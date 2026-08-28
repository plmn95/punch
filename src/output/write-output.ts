import {
  safeParentIdentity,
  assertSameDirectory,
} from "./filesystem-safety.js";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";

import type { GenerateCampaignResult } from "../core/generate-campaign.js";
import { buildOutputBundle } from "./artifact-builder.js";
import { OutputError } from "./output-error.js";
import type { OutputArtifact } from "./contracts.js";

export type WriteOutputOptions = Readonly<{
  force?: boolean;
  cwd?: string;
}>;

/** Checks an intended destination without creating files or reserving the path. */
export async function assertOutputAvailable(
  output: string,
  force = false,
): Promise<void> {
  const destination = resolveOutput(output, process.cwd());
  await safeParentIdentity(dirname(destination));
  await assertDestinationMissing(destination, force);
}

/** Atomically publishes a complete result into one previously absent directory. */
export async function writeCampaignOutput(
  result: GenerateCampaignResult,
  output: string,
  options: WriteOutputOptions = {},
): Promise<string> {
  const destination = resolveOutput(output, options.cwd ?? process.cwd());
  const parent = dirname(destination);
  const parentIdentity = await safeParentIdentity(parent);
  await assertDestinationMissing(destination, options.force ?? false);
  const staging = join(
    parent,
    `.${basename(destination)}.punch-${randomUUID()}`,
  );

  try {
    await mkdir(staging, { mode: 0o700 });
    const bundle = buildOutputBundle(result);
    await writeArtifacts(staging, bundle.artifacts);
    await assertSameDirectory(parent, parentIdentity);
    await rename(staging, destination);
    return destination;
  } catch (error) {
    await removeStaging(staging);
    if (error instanceof OutputError) {
      throw error;
    }
    throw new OutputError("write-failed");
  }
}

/** Resolves a non-root output path without accepting an empty basename. */
function resolveOutput(output: string, cwd: string): string {
  const trimmed = output.trim();
  if (trimmed.length === 0 || trimmed.includes("\0")) {
    throw new OutputError("invalid-output-path");
  }
  const destination = isAbsolute(trimmed)
    ? resolve(trimmed)
    : resolve(cwd, trimmed);
  if (destination === sep || basename(destination) === ".") {
    throw new OutputError("invalid-output-path");
  }
  return destination;
}

/** Rejects every existing destination and fails closed for forced replacement. */
async function assertDestinationMissing(
  destination: string,
  force: boolean,
): Promise<void> {
  try {
    await lstat(destination);
    throw new OutputError(force ? "force-unsupported" : "destination-exists");
  } catch (error) {
    if (error instanceof OutputError) {
      throw error;
    }
    if (!isMissingEntryError(error)) {
      throw new OutputError("unsafe-output-path");
    }
  }
}

/** Writes only allowlisted regular artifacts beneath the owned staging root. */
async function writeArtifacts(
  root: string,
  artifacts: readonly OutputArtifact[],
): Promise<void> {
  if (artifacts.some((artifact) => !safeRelativePath(artifact.path))) {
    throw new OutputError("unsafe-output-path");
  }
  if (artifacts.some((artifact) => artifact.path.startsWith("trace/"))) {
    await mkdir(join(root, "trace"), { mode: 0o700 });
  }
  for (const artifact of artifacts) {
    const target = join(root, artifact.path);
    await writeFile(target, artifact.content, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    const info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
      throw new OutputError("unsafe-output-path");
    }
  }
}

/** Accepts one or two simple path segments from the fixed artifact builder. */
function safeRelativePath(value: string): boolean {
  return /^(?:[a-z][a-z0-9-]*\.(?:html|json)|trace\/[a-z][a-z0-9-]*\.json)$/u.test(
    value,
  );
}

/** Removes only the unguessable staging directory owned by this invocation. */
async function removeStaging(staging: string): Promise<void> {
  await rm(staging, { recursive: true, force: true }).catch(() => undefined);
}

/** Narrows Node's missing-entry error without retaining its message. */
function isMissingEntryError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

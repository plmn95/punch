import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, open, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import { BrandProfileSchema, type BrandSettings } from "../brand/settings.js";
import {
  assertSameDirectory,
  safeParentIdentity,
} from "../output/filesystem-safety.js";
import { CliArgumentError } from "./cli-error.js";

/** Rejects empty paths and terminal-control characters before filesystem use. */
export function localPath(value: string): string {
  if (!value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) throw fileError();
  return resolve(value);
}

/** Reads bounded regular JSON through a no-follow descriptor. */
export async function readLocalJson(
  path: string,
  limit: number,
): Promise<unknown> {
  const target = localPath(path);
  try {
    const identity = await safeParentIdentity(dirname(target));
    const file = await open(
      target,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    try {
      const before = await file.stat();
      if (!before.isFile() || before.nlink !== 1 || before.size > limit)
        throw fileError();
      const buffer = Buffer.alloc(limit + 1);
      const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
      const after = await file.stat();
      if (
        bytesRead > limit ||
        bytesRead !== before.size ||
        after.size !== before.size ||
        after.mtimeMs !== before.mtimeMs
      )
        throw fileError();
      await assertSameDirectory(dirname(target), identity);
      return JSON.parse(buffer.subarray(0, bytesRead).toString("utf8"));
    } finally {
      await file.close();
    }
  } catch {
    throw fileError();
  }
}

/** Reads only the versioned, strict brand-profile format. */
export async function readBrandProfile(path: string): Promise<BrandSettings> {
  const parsed = BrandProfileSchema.safeParse(await readLocalJson(path, 8192));
  if (!parsed.success) throw fileError();
  return parsed.data.settings;
}

/** Atomically creates a profile without overwriting any existing file or symlink. */
export async function saveBrandProfile(
  path: string,
  settings: BrandSettings,
): Promise<void> {
  const target = localPath(path);
  const profile = BrandProfileSchema.parse({ version: "1", settings });
  const parent = dirname(target);
  const staging = join(parent, `.${basename(target)}.punch-${randomUUID()}`);
  let created = false;
  try {
    const identity = await safeParentIdentity(parent);
    const file = await open(staging, "wx", 0o600);
    created = true;
    try {
      await file.writeFile(`${JSON.stringify(profile, null, 2)}\n`);
      await file.sync();
    } finally {
      await file.close();
    }
    await assertSameDirectory(parent, identity);
    await link(staging, target);
  } catch {
    throw fileError();
  } finally {
    if (created) await unlink(staging).catch(() => undefined);
  }
}

/** Creates a safe error for malformed, oversized, linked or occupied local files. */
function fileError(): CliArgumentError {
  return new CliArgumentError(
    "invalid-file",
    "Use a bounded regular JSON file and an existing real parent directory. Saving requires a new filename; linked files are refused.",
  );
}

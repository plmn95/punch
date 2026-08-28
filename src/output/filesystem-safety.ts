import { lstat, realpath, stat } from "node:fs/promises";
import { join, parse, relative, sep } from "node:path";
import { OutputError } from "./output-error.js";

/** Resolves a real parent and rejects a symlink as its final component. */
export async function safeParentIdentity(
  parent: string,
): Promise<Readonly<{ real: string; dev: bigint; ino: bigint }>> {
  try {
    await assertNoLinkedAncestors(parent);
    const info = await lstat(parent, { bigint: true });
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new OutputError("unsafe-output-path");
    }
    const real = await realpath(parent);
    const actual = await stat(real, { bigint: true });
    return { real, dev: actual.dev, ino: actual.ino };
  } catch (error) {
    if (error instanceof OutputError) {
      throw error;
    }
    throw new OutputError("invalid-output-path");
  }
}

/** Rejects a symlink or non-directory anywhere in the existing parent chain. */
async function assertNoLinkedAncestors(parent: string): Promise<void> {
  const root = parse(parent).root;
  const segments = relative(root, parent).split(sep).filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = join(current, segment);
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new OutputError("unsafe-output-path");
    }
  }
}

/** Rechecks parent identity immediately before atomic publication. */
export async function assertSameDirectory(
  parent: string,
  expected: Readonly<{ real: string; dev: bigint; ino: bigint }>,
): Promise<void> {
  const actual = await safeParentIdentity(parent);
  if (
    actual.real !== expected.real ||
    actual.dev !== expected.dev ||
    actual.ino !== expected.ino
  ) {
    throw new OutputError("unsafe-output-path");
  }
}

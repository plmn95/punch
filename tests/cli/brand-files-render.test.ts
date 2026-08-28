import {
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
  link,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readBrandProfile,
  saveBrandProfile,
} from "../../src/cli/local-files.js";
import { runCli } from "../../src/cli/run-cli.js";
import { reviewResult } from "../../src/cli/preview-result.js";
import { renderCampaign } from "../../src/core/render-campaign.js";
import { FIXED_CAMPAIGN } from "../rendering/support.js";
import type { CliIo } from "../../src/cli/io.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

/** Creates one canonical temporary parent owned by this test. */
async function temporaryParent() {
  const path = await mkdtemp(
    join(await realpath(tmpdir()), "punch-brand-test-"),
  );
  directories.push(path);
  return path;
}

describe("reusable brand profiles and render-only CLI", () => {
  it("round-trips profiles and refuses overwrite, symlinks, hardlinks and oversized JSON", async () => {
    const parent = await temporaryParent();
    const path = join(parent, "brand.json");
    await saveBrandProfile(path, { primaryColour: "#2563eb" });
    expect(await readBrandProfile(path)).toEqual({ primaryColour: "#2563EB" });
    const before = await readFile(path, "utf8");
    await expect(
      saveBrandProfile(path, { primaryColour: "#006644" }),
    ).rejects.toMatchObject({ code: "invalid-file" });
    expect(await readFile(path, "utf8")).toBe(before);
    await symlink(path, join(parent, "linked.json"));
    await expect(
      readBrandProfile(join(parent, "linked.json")),
    ).rejects.toMatchObject({ code: "invalid-file" });
    await expect(
      saveBrandProfile(join(parent, "linked.json"), {}),
    ).rejects.toMatchObject({ code: "invalid-file" });
    await link(path, join(parent, "hardlinked.json"));
    await expect(readBrandProfile(path)).rejects.toMatchObject({
      code: "invalid-file",
    });
    await writeFile(join(parent, "large.json"), " ".repeat(8193));
    await expect(
      readBrandProfile(join(parent, "large.json")),
    ).rejects.toMatchObject({ code: "invalid-file" });
    await expect(readBrandProfile(parent)).rejects.toMatchObject({
      code: "invalid-file",
    });
    expect(
      (await readdir(parent)).some((name) => name.includes(".punch-")),
    ).toBe(false);
  });

  it("refuses linked parent directories and arbitrary profile properties", async () => {
    const parent = await temporaryParent();
    const alias = `${parent}-alias`;
    await symlink(parent, alias);
    directories.push(alias);
    await expect(
      saveBrandProfile(join(alias, "new.json"), {}),
    ).rejects.toMatchObject({ code: "invalid-file" });
    const path = join(parent, "invalid.json");
    await writeFile(
      path,
      JSON.stringify({ version: "1", settings: { css: "body{}" } }),
    );
    await expect(readBrandProfile(path)).rejects.toMatchObject({
      code: "invalid-file",
    });
  });

  it("renders without a key, applies explicit flags over profiles and saves reproducible settings", async () => {
    const parent = await temporaryParent();
    const campaign = join(parent, "source.json");
    const profile = join(parent, "brand.json");
    const savedProfile = join(parent, "saved-brand.json");
    await writeFile(campaign, JSON.stringify(FIXED_CAMPAIGN));
    await saveBrandProfile(profile, {
      primaryColour: "#006644",
      bodyFont: "Verdana",
    });
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io: CliIo = {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
      env: {},
      signal: new AbortController().signal,
      ask: vi.fn(),
    };
    const first = join(parent, "first");
    const code = await runCli(
      [
        "render",
        "--campaign",
        campaign,
        "--brand",
        profile,
        "--primary-colour",
        "#2563EB",
        "--save-brand",
        savedProfile,
        "--output",
        first,
        "--json",
      ],
      io,
    );
    expect(code).toBe(0);
    expect(stdout).toHaveLength(1);
    expect(stderr).toEqual([]);
    expect(io.ask).not.toHaveBeenCalled();
    expect(JSON.parse(stdout[0]!).validationScope).toBe("render-only");
    const document = JSON.parse(
      await readFile(join(first, "campaign.json"), "utf8"),
    );
    expect(document.campaign).toEqual(FIXED_CAMPAIGN);
    expect(document.brand.settings.primaryColour).toBe("#2563EB");
    expect((await readBrandProfile(savedProfile)).bodyFont).toBe("Verdana");
    const second = join(parent, "second");
    expect(
      await runCli(
        [
          "render",
          "--campaign",
          join(first, "campaign.json"),
          "--output",
          second,
        ],
        io,
      ),
    ).toBe(0);
    expect(await readFile(join(second, "email.html"), "utf8")).toBe(
      await readFile(join(first, "email.html"), "utf8"),
    );
    const validation = JSON.parse(
      await readFile(join(second, "validation.json"), "utf8"),
    );
    expect(validation.usage.total.inputTokens).toBe(0);
    expect(validation.validation.scope).toBe("render-only");
  });

  it("lets the guide cancel a profile save requested on the command line", async () => {
    const parent = await temporaryParent();
    const campaign = join(parent, "source.json");
    const profile = join(parent, "cancelled-brand.json");
    await writeFile(campaign, JSON.stringify(FIXED_CAMPAIGN));
    const answers = ["", "s", "", ""];
    const code = await runCli(
      [
        "render",
        "--campaign",
        campaign,
        "--output",
        join(parent, "output"),
        "--save-brand",
        profile,
        "--interactive",
      ],
      {
        stdout: vi.fn(),
        stderr: vi.fn(),
        env: {},
        signal: new AbortController().signal,
        stdinIsTTY: true,
        stdoutIsTTY: true,
        ask: async () => {
          const answer = answers.shift();
          if (answer === undefined) throw new Error("Unexpected question");
          return answer;
        },
      },
    );
    expect(code).toBe(0);
    expect(answers).toEqual([]);
    await expect(readFile(profile)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("previews two revisions, preserves copy, and removes owned temporary previews", async () => {
    const answers = ["p", "b", "1", "#2563EB", "", "p", ""];
    const previews: string[] = [];
    const html: string[] = [];
    const initial = await renderCampaign(FIXED_CAMPAIGN);
    const reviewed = await reviewResult(
      {
        stdout: vi.fn(),
        stderr: vi.fn(),
        env: {},
        signal: new AbortController().signal,
        ask: async () => {
          const value = answers.shift();
          if (value === undefined) throw new Error("Unexpected question");
          return value;
        },
        openPreview: async (path) => {
          previews.push(path);
          html.push(await readFile(path, "utf8"));
        },
      },
      initial,
    );
    expect(html).toHaveLength(2);
    expect(html[0]).not.toBe(html[1]);
    expect(reviewed.result.campaign).toEqual(initial.campaign);
    expect(reviewed.result.usage).toEqual(initial.usage);
    for (const path of previews)
      await expect(readFile(path)).rejects.toMatchObject({ code: "ENOENT" });
  });
});

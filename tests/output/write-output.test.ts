import { mkdtemp, readFile, readdir, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { GenerateCampaignResult } from "../../src/core/generate-campaign.js";
import { normaliseCampaignDraft } from "../../src/core/schemas/index.js";
import { writeCampaignOutput } from "../../src/output/index.js";
import { aggregateModelUsage } from "../../src/providers/index.js";
import { renderCampaignHtml } from "../../src/rendering/index.js";
import {
  createCampaignPayload,
  createGenerationContext,
} from "../factories.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

/** Creates one valid fictional generated result without a provider call. */
async function createResult(trace: boolean): Promise<GenerateCampaignResult> {
  const campaign = normaliseCampaignDraft(createCampaignPayload());
  const context = createGenerationContext();
  return {
    campaign,
    html: await renderCampaignHtml(campaign),
    validation: {
      valid: true,
      checks: [{ id: "campaign-grounding", passed: true }],
    },
    usage: aggregateModelUsage([]),
    ...(trace
      ? {
          trace: {
            brandProfile: context.brand,
            productProfiles: context.products,
            draft: campaign,
            critique: { issues: [] },
            promptVersions: { emit: "test", critique: "test" },
          },
        }
      : {}),
  };
}

describe("safe output publication", () => {
  it("publishes the complete allowlisted artifact set atomically", async () => {
    const parent = await temporaryParent();
    temporaryDirectories.push(parent);
    const destination = join(parent, "campaign");

    await expect(
      writeCampaignOutput(await createResult(true), destination),
    ).resolves.toBe(destination);
    expect((await readdir(destination)).sort()).toEqual([
      "campaign.json",
      "email.html",
      "trace",
      "validation.json",
    ]);
    expect((await readdir(join(destination, "trace"))).sort()).toEqual([
      "brand-profile.json",
      "critique.json",
      "draft.json",
      "manifest.json",
      "product-profiles.json",
    ]);
    const validation = JSON.parse(
      await readFile(join(destination, "validation.json"), "utf8"),
    );
    expect(validation).toMatchObject({ generator: "punch", status: "valid" });
  });

  it("refuses an existing destination and fails closed for force", async () => {
    const parent = await temporaryParent();
    temporaryDirectories.push(parent);
    const destination = join(parent, "campaign");
    const result = await createResult(false);
    await writeCampaignOutput(result, destination);

    await expect(
      writeCampaignOutput(result, destination),
    ).rejects.toMatchObject({
      code: "destination-exists",
    });
    await expect(
      writeCampaignOutput(result, destination, { force: true }),
    ).rejects.toMatchObject({ code: "force-unsupported" });
  });
});

/** Creates a test parent beneath the canonical path rather than an OS alias. */
async function temporaryParent(): Promise<string> {
  return mkdtemp(join(await realpath(tmpdir()), "punch-output-"));
}

import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveBrand } from "../brand/resolve-brand.js";
import type { GenerateCampaignResult } from "../core/generate-campaign.js";
import { restyleCampaign } from "../core/render-campaign.js";
import { writeCampaignOutput } from "../output/write-output.js";
import { editBrand } from "./guide-brand.js";
import { ask, type CliIo } from "./io.js";
import { localPath } from "./local-files.js";

/** Reviews the actual result and restyles it without rerunning extraction or generation. */
export async function reviewResult(
  io: CliIo,
  initial: GenerateCampaignResult,
): Promise<{ result: GenerateCampaignResult; saveBrandPath?: string | null }> {
  let result = initial;
  let saveBrandPath: string | null | undefined;
  let temporary: string | undefined;
  let revision = 0;
  try {
    for (;;) {
      const choice = await ask(
        io,
        "\n4. Preview: (p) open email, (b) adjust branding, (s) save profile, Enter to export: ",
      );
      if (!choice)
        return {
          result,
          ...(saveBrandPath !== undefined ? { saveBrandPath } : {}),
        };
      if (choice === "b") {
        const changes = await editBrand(io, result.brand ?? resolveBrand());
        result = await restyleCampaign(result, changes);
        io.stderr(
          "Re-rendered the same campaign. No AI call or copy change.\n",
        );
      } else if (choice === "s") {
        const path = await ask(
          io,
          "New profile filename (blank cancels saving): ",
        );
        saveBrandPath = path ? localPath(path) : null;
      } else if (choice === "p") {
        temporary ??= await mkdtemp(
          join(await realpath(tmpdir()), "punch-preview-"),
        );
        await openResultPreview(
          io,
          result,
          join(temporary, `revision-${++revision}`),
        );
      } else io.stderr("Choose p, b, s, or Enter.\n");
    }
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }
}

/** Writes one fresh preview and opens it only after the user selected that action. */
async function openResultPreview(
  io: CliIo,
  result: GenerateCampaignResult,
  destination: string,
): Promise<void> {
  const output = await writeCampaignOutput(result, destination);
  const path = join(output, "email.html");
  io.stderr(
    `Preview: ${path}\nTemporary previews are removed when this session ends.\n`,
  );
  if (io.openPreview)
    await io
      .openPreview(path)
      .catch(() =>
        io.stderr(
          "Could not open a browser automatically. Open the preview path above.\n",
        ),
      );
}

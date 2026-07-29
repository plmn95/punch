import { expect, it } from "vitest";

import { UNSUBSCRIBE_PLACEHOLDER } from "../../src/rendering/render-contract.js";
import { renderCampaignHtml } from "../../src/rendering/render-campaign-html.js";
import { FIXED_CAMPAIGN, transformCampaign } from "./support.js";

it("renders only the restricted inline Markdown subset with React escaping", async () => {
  const markdown =
    "Use **bold & bright** and *quiet*; [shop](https://example.com/path?a=1&b=2), [unsafe](javascript:alert(1)), ![image](https://example.com/image.jpg), [paren](https://example.com/products/cup_(red)), [trail](https://example.com/a_(b)/c), \\[escaped](https://example.com/escaped), ***unsupported***, and 2 < 3.";
  const campaign = transformCampaign(FIXED_CAMPAIGN, (block) => {
    if (block.type === "body-paragraph") {
      return { ...block, markdown };
    }
    if (block.type === "product-feature" && block.image !== undefined) {
      return {
        ...block,
        image: {
          ...block.image,
          alt: 'A "mug" & cup < 3',
        },
      };
    }
    return block;
  });

  const html = await renderCampaignHtml(campaign);
  const normalisedHtml = html.replaceAll(/<!--[\s\S]*?-->/gu, "");

  expect(html).toContain("<strong>bold &amp; bright</strong>");
  expect(html).toContain("<em>quiet</em>");
  expect(html).toMatch(
    /<a [^>]*href="https:\/\/example\.com\/path\?a=1&amp;b=2"[^>]*>shop<\/a>/u,
  );
  expect(normalisedHtml).toContain("[unsafe](javascript:alert(1))");
  expect(normalisedHtml).toContain("![image](https://example.com/image.jpg)");
  expect(normalisedHtml).toContain(
    "[paren](https://example.com/products/cup_(red))",
  );
  expect(normalisedHtml).toContain("[trail](https://example.com/a_(b)/c)");
  expect(normalisedHtml).toContain("\\[escaped](https://example.com/escaped)");
  expect(normalisedHtml).toContain("***unsupported***");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('href="https://example.com/image.jpg"');
  expect(html).not.toContain('href="https://example.com/products/cup_(red"');
  expect(html).not.toContain('href="https://example.com/a_(b"');
  expect(html).not.toContain('href="https://example.com/escaped"');
  expect(html).toContain("2 &lt; 3");
  expect(html).toContain('alt="A &quot;mug&quot; &amp; cup &lt; 3"');
});

it("rejects malformed URLs, raw markup, and unknown runtime blocks", async () => {
  const invalidUrl = {
    ...FIXED_CAMPAIGN,
    blocks: FIXED_CAMPAIGN.blocks.map((block) =>
      block.type === "header-standard"
        ? { ...block, homeUrl: "https://user:secret@example.com/" }
        : block,
    ),
  };
  const rawMarkup = {
    ...FIXED_CAMPAIGN,
    blocks: FIXED_CAMPAIGN.blocks.map((block) =>
      block.type === "body-paragraph"
        ? { ...block, markdown: "<script>alert('unsafe')</script>" }
        : block,
    ),
  };
  const unknownBlock = {
    ...FIXED_CAMPAIGN,
    blocks: FIXED_CAMPAIGN.blocks.map((block, index) =>
      index === 0 ? { id: "block-01", type: "editor-only" } : block,
    ),
  };
  const reservedPlaceholder = {
    ...FIXED_CAMPAIGN,
    blocks: FIXED_CAMPAIGN.blocks.map((block) =>
      block.type === "body-paragraph"
        ? {
            ...block,
            markdown: `Do not emit ${UNSUBSCRIBE_PLACEHOLDER} here.`,
          }
        : block,
    ),
  };

  await expect(renderCampaignHtml(invalidUrl)).rejects.toThrow();
  await expect(renderCampaignHtml(rawMarkup)).rejects.toThrow();
  await expect(renderCampaignHtml(unknownBlock)).rejects.toThrow();
  await expect(renderCampaignHtml(reservedPlaceholder)).rejects.toThrow(
    "reserved renderer placeholder",
  );
});

it("contains no editor, application, script, or private-host surface", async () => {
  const html = await renderCampaignHtml(FIXED_CAMPAIGN);

  expect(html).not.toMatch(
    /contenteditable|tiptap|data-selected|dangerouslySetInnerHTML/iu,
  );
  expect(html).not.toMatch(/<script|<form|<iframe|<svg|\son[a-z]+\s*=/iu);
  expect(html).not.toMatch(/punchline|r2\.cloudflarestorage/iu);
  expect(html).not.toMatch(/fonts\.(?:googleapis|gstatic)\.com/iu);
});

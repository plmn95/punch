import { describe, expect, it } from "vitest";
import { extractBrand } from "../../src/extraction/extract-brand.js";

const url = "https://grove.example.com/";

/** Extracts only fictional styles for deterministic role tests. */
function roles(css: string) {
  return extractBrand({ finalUrl: url, html: `<style>${css}</style>` })
    .styleRoles;
}

describe("role-aware brand style extraction", () => {
  it("keeps semantic roles rather than choosing the first colour", () => {
    const styles = roles(
      `.error{color:#ff0000} :root{--primary:#2563eb;--background:#ffffff;--text:#111827;--font-heading:"Grove Serif";--font-body:Verdana} button{background:#ffff00}`,
    );
    expect(styles.primaryColour?.value).toBe("#2563EB");
    expect(styles.backgroundColour?.value).toBe("#FFFFFF");
    expect(styles.textColour?.value).toBe("#111827");
    expect(styles.headingFont?.value).toBe("Grove Serif");
    expect(styles.bodyFont?.value).toBe("Verdana");
    expect(styles.primaryColour?.evidence.url).toBe(url);
  });

  it("resolves local variables, RGB, shorthand hex and body/heading roles", () => {
    const styles = roles(
      ':root{--ink:#123;--action:#006644} body{background:rgb(255, 255, 255);color:var(--ink);font-family:Arial,sans-serif} h1,h2{font-family:"Grove Serif",serif} .button{background-color:var(--action)}',
    );
    expect(styles.textColour?.value).toBe("#112233");
    expect(styles.backgroundColour?.value).toBe("#FFFFFF");
    expect(styles.primaryColour?.value).toBe("#006644");
    expect(styles.headingFont?.value).toBe("Grove Serif");
    expect(styles.bodyFont?.value).toBe("Arial");
  });

  it("retains element roles for inline styles", () => {
    const result = extractBrand({
      finalUrl: url,
      html: '<body style="background:#fff;color:#111"><h1 style="font-family:Georgia">Grove</h1><button style="background:#006644">Shop</button></body>',
    });
    expect(result.styleRoles.primaryColour?.value).toBe("#006644");
    expect(result.styleRoles.headingFont?.value).toBe("Georgia");
  });

  it("omits ambiguous, conditional, unrecognised and cyclic values", () => {
    expect(
      roles("button{background:#123456}.button{background:#654321}")
        .primaryColour,
    ).toBeUndefined();
    expect(
      roles(
        "@media(prefers-color-scheme:dark){body{background:#111}} button:hover{background:#123456} .alert{color:#abcdef}",
      ),
    ).toEqual({});
    expect(
      roles(":root{--a:var(--b);--b:var(--a);--primary:var(--a)}"),
    ).toEqual({});
    expect(
      roles(
        "body{background:url(https://outside.example.com/x);font-family:var(--missing)}",
      ),
    ).toEqual({});
  });
});

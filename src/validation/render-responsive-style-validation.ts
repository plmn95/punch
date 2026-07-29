import { MIN_CONTENT_FONT_SIZE } from "../rendering/render-contract.js";

/** Checks every responsive stylesheet font declaration against the pixel floor. */
export function responsiveFontFloorsPass(html: string): boolean {
  const styleBlocks = [
    ...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
  return (
    styleBlocks.length === 1 &&
    styleBlocks.every((style) => {
      const declarations = [
        ...style.matchAll(/(?:^|[;{])\s*(font(?:-size)?)\s*:\s*([^;}]+)/giu),
      ];
      return declarations.every((declaration) => {
        const property = declaration[1]?.toLowerCase();
        const value = declaration[2]?.replace(/\s*!important\s*$/iu, "").trim();
        return (
          property === "font-size" &&
          value !== undefined &&
          /^\d+(?:\.\d+)?px$/u.test(value) &&
          Number.parseFloat(value) >= MIN_CONTENT_FONT_SIZE
        );
      });
    })
  );
}

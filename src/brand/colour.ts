/** Parses one opaque six-digit hexadecimal colour. */
function parseHex(value: unknown): [number, number, number] | undefined {
  if (typeof value !== "string" || !/^#[\da-f]{6}$/iu.test(value))
    return undefined;
  return [1, 3, 5].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

/** Converts one sRGB channel to relative luminance. */
function linearise(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Computes the relative luminance of a supported opaque colour. */
function luminance([red, green, blue]: [number, number, number]): number {
  return (
    0.2126 * linearise(red) +
    0.7152 * linearise(green) +
    0.0722 * linearise(blue)
  );
}

/** Returns the contrast ratio for supported opaque foreground/background colours. */
export function contrastRatio(
  foreground: unknown,
  background: unknown,
): number | undefined {
  const front = parseHex(foreground);
  const back = parseHex(background);
  if (!front || !back) return undefined;
  const first = luminance(front);
  const second = luminance(back);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Selects the higher-contrast black or white text for a validated background. */
export function readableInk(background: string): string {
  return (contrastRatio("#000000", background) ?? 0) >=
    (contrastRatio("#FFFFFF", background) ?? 0)
    ? "#000000"
    : "#FFFFFF";
}

/** Mixes a bounded proportion of a validated colour into a background. */
export function tint(
  background: string,
  colour: string,
  amount: number,
): string {
  const base = parseHex(background)!;
  const target = parseHex(colour)!;
  return `#${base
    .map((channel, index) =>
      Math.round(channel * (1 - amount) + target[index]! * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

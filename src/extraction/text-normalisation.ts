const INVISIBLE_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/gu;

/** Converts untrusted source text into bounded semantic text. */
export function sanitiseSourceText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(INVISIBLE_PATTERN, "")
    .replace(/\s+/gu, " ")
    .trim();
}

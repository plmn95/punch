import { z } from "zod";

export const SCHEMA_VERSION = "0.1.0" as const;

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const BLOCK_ID_PATTERN = /^block-(?:0[1-9]|[1-3][0-9]|40)$/u;
const ISSUE_ID_PATTERN = /^issue-(?:0[1-9]|1[0-9]|20)$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;
const DECIMAL_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/u;
const FORBIDDEN_CONTROL_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const RAW_MARKUP_PATTERN =
  /(?:<\/?[A-Za-z][^>]*>|<!--[\s\S]*?-->|<![A-Za-z][^>]*>|<\?[A-Za-z][\s\S]*?\?>)/u;

/** Reports whether semantic text contains unsafe control characters or HTML. */
function containsForbiddenSemanticText(value: string): boolean {
  return (
    FORBIDDEN_CONTROL_PATTERN.test(value) || RAW_MARKUP_PATTERN.test(value)
  );
}

/** Builds a bounded semantic-text schema that rejects raw HTML. */
function createSemanticTextSchema(maximumLength: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(maximumLength)
    .refine((value) => !containsForbiddenSemanticText(value), {
      message: "Must contain semantic text, not raw HTML or control characters",
    });
}

/** Canonicalises a credential-free HTTP(S) URL without its fragment. */
export function canonicaliseHttpUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

export const SchemaVersionSchema = z.literal(SCHEMA_VERSION);

export const ProductIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(IDENTIFIER_PATTERN);

export const BlockIdSchema = z.string().regex(BLOCK_ID_PATTERN);
export const IssueIdSchema = z.string().regex(ISSUE_ID_PATTERN);

export const LabelTextSchema = createSemanticTextSchema(80);
export const ShortTextSchema = createSemanticTextSchema(200);
export const LongTextSchema = createSemanticTextSchema(4_000);
export const CodeTextSchema = createSemanticTextSchema(64);

export const HttpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .transform((value, context) => {
    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        context.addIssue({
          code: "custom",
          message: "URL must use HTTP or HTTPS",
        });
        return z.NEVER;
      }

      if (url.username || url.password) {
        context.addIssue({
          code: "custom",
          message: "URL must not contain credentials",
        });
        return z.NEVER;
      }

      return canonicaliseHttpUrl(url.toString());
    } catch {
      context.addIssue({
        code: "custom",
        message: "Must be a valid URL",
      });
      return z.NEVER;
    }
  });

export const MoneySchema = z.strictObject({
  amount: z.string().trim().regex(DECIMAL_AMOUNT_PATTERN).max(64),
  currency: z.string().trim().regex(CURRENCY_PATTERN),
  display: ShortTextSchema.optional(),
});

export const ImageSchema = z.strictObject({
  url: HttpUrlSchema,
  alt: ShortTextSchema,
});

export const CtaSchema = z.strictObject({
  label: LabelTextSchema,
  href: HttpUrlSchema,
});

export type ProductId = z.infer<typeof ProductIdSchema>;
export type BlockId = z.infer<typeof BlockIdSchema>;
export type IssueId = z.infer<typeof IssueIdSchema>;
export type SchemaVersion = z.infer<typeof SchemaVersionSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Cta = z.infer<typeof CtaSchema>;

import { z } from "zod";

export const MarkdownRendererSchema = z.object({
  content: z.string(),
  locale: z.enum(["en", "fr"]),
  maxLength: z.number().positive().default(50000),
  allowHtml: z.boolean().default(false),
});

export type MarkdownRendererProps = z.infer<typeof MarkdownRendererSchema>;

export function validateProps(raw: unknown): MarkdownRendererProps {
  return MarkdownRendererSchema.parse(raw);
}

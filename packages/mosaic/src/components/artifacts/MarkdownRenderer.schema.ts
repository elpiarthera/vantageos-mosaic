import { z } from "zod";

export const MarkdownRendererPropsSchema = z.object({
  content: z.string(),
  locale: z.enum(["en", "fr"]),
  maxLength: z.number().positive().default(50000),
  allowHtml: z.boolean().default(false),
});

export type MarkdownRendererProps = z.infer<typeof MarkdownRendererPropsSchema>;

export function validateProps(raw: unknown): MarkdownRendererProps {
  return MarkdownRendererPropsSchema.parse(raw);
}

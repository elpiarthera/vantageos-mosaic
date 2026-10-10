import { z } from "zod";

// i18nKeys: PipelineBoard.title, PipelineBoard.deals.one, PipelineBoard.deals.many, PipelineBoard.total, PipelineBoard.stage.empty, PipelineBoard.filter.label, PipelineBoard.summary.open, PipelineBoard.more, PipelineBoard.empty.message, PipelineBoard.loading, PipelineBoard.error.invalidProps, PipelineBoard.col.stage, PipelineBoard.col.deals

export const PipelineDealSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Decimal STRING (never a float), in the board currency. */
  amount: z.string().optional(),
  contact: z.string().optional(),
  url: z.string().optional(),
});

export const PipelineStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  deals: z.array(PipelineDealSchema).default([]),
});

export type PipelineDeal = z.infer<typeof PipelineDealSchema>;
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

/**
 * PipelineBoard (R06): deals by stage, READ-ONLY (no drag, no stage change), fullscreen-first.
 * `layout: "board"` is the fullscreen columns view; `"summary"` is the inline stage-totals card
 * (see `layoutForDisplayMode`). `{}` parses: ChatGPT opens entrypoints fullscreen with empty
 * arguments (openai/mcp-extensions docs/spec.md).
 */
export const PipelineBoardPropsSchema = z.object({
  stages: z.array(PipelineStageSchema).default([]),
  /** ISO 4217 code used to format amounts. */
  currency: z.string().default("EUR"),
  layout: z.enum(["board", "summary"]).default("board"),
  loading: z.boolean().default(false),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type PipelineBoardProps = z.input<typeof PipelineBoardPropsSchema>;
export type PipelineBoardPropsOutput = z.output<typeof PipelineBoardPropsSchema>;

export function validatePipelineBoardProps(raw: unknown): PipelineBoardPropsOutput {
  return PipelineBoardPropsSchema.parse(raw);
}

import { z } from "zod";

// i18nKeys: PipelineBoard.title, PipelineBoard.deals.one, PipelineBoard.deals.many, PipelineBoard.total, PipelineBoard.stage.empty, PipelineBoard.filter.label, PipelineBoard.summary.open, PipelineBoard.more, PipelineBoard.empty.message, PipelineBoard.loading, PipelineBoard.error.invalidProps
// RED stub schema.
export const PipelineBoardPropsSchema = z.object({}).passthrough();
export type PipelineBoardProps = Record<string, unknown>;
export type PipelineBoardPropsOutput = Record<string, unknown>;
export type PipelineStage = Record<string, unknown>;
export type PipelineDeal = Record<string, unknown>;
export function validatePipelineBoardProps(raw: unknown): PipelineBoardPropsOutput {
  return PipelineBoardPropsSchema.parse(raw);
}

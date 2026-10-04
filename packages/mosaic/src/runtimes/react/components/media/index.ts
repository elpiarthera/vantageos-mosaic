/**
 * @vantageos/mosaic/react/media — runtime subpath barrel.
 *
 * StatusBadge is implemented under components/display (kept there for
 * back-compat) and re-exported here because the registry assigns it to the
 * `media` category. Same component, same schema: no second implementation.
 */
export { StatusBadge } from "../display/StatusBadge.js";
export type { StatusBadgeProps } from "../../../../components/media/StatusBadge.schema.js";
export {
  StatusBadgePropsSchema,
  validateProps as validateStatusBadgeProps,
} from "../../../../components/media/StatusBadge.schema.js";

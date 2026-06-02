/**
 * Convenience re-export shim — exposes `@vantageos/mosaic-tokens` under the
 * `@vantageos/mosaic/tokens` subpath so consumers can stay on a single
 * package import surface. Skeleton (T3-A) — token tables land in T3-B.
 *
 * Implementation note: we import from the sibling workspace package's
 * source. tsup keeps `@vantageos/mosaic-tokens` external in this pass, but
 * since we go through a relative path here, esbuild inlines the (currently
 * empty) skeleton tokens. T3-B switches this to a bare specifier once the
 * sibling package is fully built and published.
 */
export * from "../../mosaic-tokens/src";
export { default } from "../../mosaic-tokens/src";

/**
 * `@vantageos/mosaic/streaming` — the rxjs-backed postMessage stream.
 *
 * Separate from the root entry because it loads rxjs at runtime and rxjs is an optional peer:
 * a consumer importing this entry installs rxjs ^7.8.0; a consumer of the root does not need it.
 */
export { createPostMessageObservable } from "../adapters/postMessageObservable.js";
export { MOSAIC_STREAM_CHUNK_TYPE } from "../adapters/postMessageAdapter.js";

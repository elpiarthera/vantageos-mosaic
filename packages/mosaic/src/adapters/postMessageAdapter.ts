import { type Observable, Subject } from "rxjs";

/**
 * MCP App postMessage adapter (mosaic-architecture-standard-v1 §3.4 streaming).
 * Listens for `mosaic.stream.chunk` messages and emits their `data` payload
 * into an RxJS Observable so components can consume them via {@link useStreamingHydration}.
 *
 * Canonical envelope per StreamChunkSchema:
 *   { type: 'mosaic.stream.chunk', componentKey, chunkId, data, isLast }
 */
export const MOSAIC_STREAM_CHUNK_TYPE = "mosaic.stream.chunk" as const;

export function createPostMessageObservable<T>(): Observable<Partial<T>> {
  const subject = new Subject<Partial<T>>();
  if (typeof window !== "undefined") {
    window.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { type?: string; data?: unknown; params?: unknown } | undefined;
      if (data?.type === MOSAIC_STREAM_CHUNK_TYPE) {
        subject.next((data.data ?? data.params) as Partial<T>);
      }
    });
  }
  return subject.asObservable();
}

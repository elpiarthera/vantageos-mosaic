import { type Observable, Subject } from "rxjs";
import { MOSAIC_STREAM_CHUNK_TYPE } from "./postMessageAdapter.js";

/**
 * Listens for `mosaic.stream.chunk` messages and emits their `data` payload into an RxJS
 * Observable so components can consume them via `useStreamingHydration` or
 * `StreamingTableView`.
 *
 * Imports rxjs at runtime, so it is published only from `@vantageos/mosaic/streaming`, never from
 * the root entry: a consumer using it installs rxjs ^7.8.0 (an optional peer).
 */
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

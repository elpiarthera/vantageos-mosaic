import { type Observable, Subject } from "rxjs";

/**
 * MCP App postMessage adapter (SEP-1865 `ui/notifications/host-context-changed`).
 * Bridges window.postMessage events into an RxJS Observable so components can
 * consume them via {@link useStreamingHydration}.
 */
export function createPostMessageObservable<T>(): Observable<Partial<T>> {
  const subject = new Subject<Partial<T>>();
  if (typeof window !== "undefined") {
    window.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { method?: string; params?: unknown } | undefined;
      if (data?.method === "ui/notifications/host-context-changed") {
        subject.next(data.params as Partial<T>);
      }
    });
  }
  return subject.asObservable();
}

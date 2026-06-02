import { useEffect, useState } from "react";
import type { Observable } from "rxjs";

/**
 * Subscribes to an Observable stream of partial prop updates and merges them
 * into local state. Used for MCP App streaming hydration (SEP-1865 host-context
 * change notifications, TableView large dataset chunking, etc).
 *
 * @param props$ Observable emitting partial prop chunks.
 * @returns merged state accumulated across emissions.
 */
export function useStreamingHydration<T>(props$: Observable<Partial<T>>): Partial<T> {
  const [state, setState] = useState<Partial<T>>({});
  useEffect(() => {
    const sub = props$.subscribe((chunk) => {
      setState((prev) => ({ ...prev, ...chunk }));
    });
    return () => {
      sub.unsubscribe();
    };
  }, [props$]);
  return state;
}

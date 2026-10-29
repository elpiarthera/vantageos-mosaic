export interface AppLike {
  ontoolresult?: unknown;
  ontoolinput?: unknown;
  onhostcontextchanged?: unknown;
  connect(): Promise<void>;
  callServerTool(p: { name: string; arguments?: Record<string, unknown> }): Promise<unknown>;
  getHostContext(): { locale?: string } | undefined;
}
export function ConfigViewApp(_p: { app: AppLike }) {
  return null;
}
export function startConfigView(_app: AppLike, _root: HTMLElement): Promise<void> {
  throw new Error("not implemented");
}

// RED stub: behaviour lands in the next commit.
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export function readSafeAreaInsets(_raw: unknown): SafeAreaInsets | undefined {
  return undefined;
}
export function safeAreaPadding(_insets: SafeAreaInsets): string {
  return "";
}
export function applySafeAreaInsets(_insets: SafeAreaInsets | undefined, _root: HTMLElement): void {}

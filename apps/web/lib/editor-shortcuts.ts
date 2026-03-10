export type ShortcutAction = "toggle-play" | "seek-backward" | "seek-forward" | "speed-down" | "speed-up" | "speed-reset" | "save-now" | "find";
export type ShortcutBinding = { key: string; shiftKey?: boolean; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean };
export type ShortcutPreset = Record<ShortcutAction, ShortcutBinding[]>;
export const temiPreset: ShortcutPreset = {
  "toggle-play": [{ key: "Tab" }],
  "seek-backward": [{ key: "Tab", shiftKey: true }],
  "seek-forward": [{ key: "ArrowRight", altKey: true }],
  "speed-down": [{ key: ",", altKey: true }],
  "speed-up": [{ key: ".", altKey: true }],
  "speed-reset": [{ key: "/", altKey: true }],
  "save-now": [{ key: "s", ctrlKey: true }, { key: "s", metaKey: true }],
  "find": [{ key: "f", ctrlKey: true }, { key: "f", metaKey: true }]
};
export function eventMatchesBinding(event: KeyboardEvent, binding: ShortcutBinding) {
  return event.key === binding.key && !!event.shiftKey === !!binding.shiftKey && !!event.altKey === !!binding.altKey && !!event.ctrlKey === !!binding.ctrlKey && !!event.metaKey === !!binding.metaKey;
}

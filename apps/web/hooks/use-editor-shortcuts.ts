"use client";
import { useEffect, useRef } from "react";
import { eventMatchesBinding, temiPreset, type ShortcutAction } from "@/lib/editor-shortcuts";
type Handlers = Partial<Record<ShortcutAction, () => void>>;
function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || element.isContentEditable;
}
export function useEditorShortcuts(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = isTypingTarget(event.target);
      for (const [action, bindings] of Object.entries(temiPreset) as [ShortcutAction, typeof temiPreset[ShortcutAction]][]) {
        for (const binding of bindings) {
          if (eventMatchesBinding(event, binding)) {
            const shouldAllowWhileTyping = action === "toggle-play" || action === "seek-backward" || action === "seek-forward";
            if (typing && !shouldAllowWhileTyping) return;
            event.preventDefault(); handlersRef.current[action]?.(); return;
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

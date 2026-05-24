import {
  jayessClipboardClear,
  jayessClipboardReadText,
  jayessClipboardWriteText
} from "./clipboard-primitives.hpp";

export function readText() {
  return jayessClipboardReadText();
}

export function writeText(text) {
  return jayessClipboardWriteText(text);
}

export function clear() {
  return jayessClipboardClear();
}

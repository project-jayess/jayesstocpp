import {
  jayessTerminalAnsi,
  jayessTerminalClearLine,
  jayessTerminalClearScreen,
  jayessTerminalCursorTo,
  jayessTerminalSize,
  jayessTerminalStripAnsi
} from "./terminal-primitives.hpp";

export function ansi(style) {
  return jayessTerminalAnsi(style);
}

export function stripAnsi(text) {
  return jayessTerminalStripAnsi(text);
}

export function cursorTo(row, column) {
  return jayessTerminalCursorTo(row, column);
}

export function clearScreen() {
  return jayessTerminalClearScreen();
}

export function clearLine() {
  return jayessTerminalClearLine();
}

export function size() {
  return jayessTerminalSize();
}

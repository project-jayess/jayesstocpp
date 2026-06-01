import {
  jayessConsoleError,
  jayessConsoleLog,
  jayessConsolePrompt,
  jayessConsoleReadLine,
  jayessConsoleReadStdin,
  jayessConsoleWrite,
  jayessConsoleWriteLine
} from "./console-primitives.hpp";

export function log(value) {
  return jayessConsoleLog(value);
}

export function error(value) {
  return jayessConsoleError(value);
}

export function write(text) {
  return jayessConsoleWrite(text);
}

export function writeLine(text) {
  return jayessConsoleWriteLine(text);
}

export function readLine() {
  return jayessConsoleReadLine();
}

export function readStdin() {
  return jayessConsoleReadStdin();
}

export function prompt(text) {
  return jayessConsolePrompt(text);
}

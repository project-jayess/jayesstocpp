import {
  jayessConsoleError,
  jayessConsoleLog,
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

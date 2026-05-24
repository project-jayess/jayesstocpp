import { error as writeError, writeLine } from "jayess:console";
import { stringify } from "jayess:json";

function entry(level, message) {
  return "[" + level + "] " + message;
}

export function debug(message) {
  return writeLine(entry("debug", message));
}

export function info(message) {
  return writeLine(entry("info", message));
}

export function warn(message) {
  return writeError(entry("warn", message));
}

export function error(message) {
  return writeError(entry("error", message));
}

export function withLevel(level, message) {
  if (level === "error" || level === "warn") {
    return writeError(entry(level, message));
  }
  return writeLine(entry(level, message));
}

export function formatJson(level, value) {
  return "{\"level\":\"" + level + "\",\"value\":" + stringify(value) + "}";
}

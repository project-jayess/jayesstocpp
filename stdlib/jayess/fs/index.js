import {
  jayessFsCreateDirectories,
  jayessFsExists,
  jayessFsList,
  jayessFsReadText,
  jayessFsRemove,
  jayessFsRename,
  jayessFsStat,
  jayessFsWriteText
} from "./fs-primitives.hpp";

export function exists(path) {
  return jayessFsExists(path);
}

export function readText(path) {
  return jayessFsReadText(path);
}

export function writeText(path, text) {
  return jayessFsWriteText(path, text);
}

export function createDirectories(path) {
  return jayessFsCreateDirectories(path);
}

export function remove(path) {
  return jayessFsRemove(path);
}

export function list(path) {
  return jayessFsList(path);
}

export function rename(fromPath, toPath) {
  return jayessFsRename(fromPath, toPath);
}

export function stat(path) {
  return jayessFsStat(path);
}

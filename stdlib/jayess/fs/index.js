import {
  jayessFsCreateDirectories,
  jayessFsExists,
  jayessFsReadText,
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

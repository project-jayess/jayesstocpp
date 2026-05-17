import {
  jayessPathBasename,
  jayessPathDirname,
  jayessPathExtname,
  jayessPathJoin,
  jayessPathNormalize
} from "./path-primitives.hpp";

export function join(...parts) {
  return jayessPathJoin(...parts);
}

export function dirname(path) {
  return jayessPathDirname(path);
}

export function basename(path) {
  return jayessPathBasename(path);
}

export function extname(path) {
  return jayessPathExtname(path);
}

export function normalize(path) {
  return jayessPathNormalize(path);
}

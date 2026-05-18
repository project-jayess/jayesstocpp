import {
  jayessPathBasename,
  jayessPathDirname,
  jayessPathExtname,
  jayessPathIsAbsolute,
  jayessPathJoin,
  jayessPathNormalize,
  jayessPathRelative,
  jayessPathResolve
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

export function resolve(...parts) {
  return jayessPathResolve(...parts);
}

export function relative(fromPath, toPath) {
  return jayessPathRelative(fromPath, toPath);
}

export function isAbsolute(path) {
  return jayessPathIsAbsolute(path);
}

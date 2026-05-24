import {
  jayessPathBasename,
  jayessPathDelimiter,
  jayessPathDirname,
  jayessPathExtname,
  jayessPathFormat,
  jayessPathIsAbsolute,
  jayessPathJoin,
  jayessPathNormalize,
  jayessPathParse,
  jayessPathRelative,
  jayessPathResolve,
  jayessPathSeparator
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

export function parse(path) {
  return jayessPathParse(path);
}

export function format(parts) {
  return jayessPathFormat(parts);
}

export function separator() {
  return jayessPathSeparator();
}

export function delimiter() {
  return jayessPathDelimiter();
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

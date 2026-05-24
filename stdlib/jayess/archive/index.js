import {
  jayessArchiveCreateTar,
  jayessArchiveExtractTar,
  jayessArchiveReadTar,
  jayessArchiveReadTarSync,
  jayessArchiveWriteTar,
  jayessArchiveWriteTarSync
} from "./archive-primitives.hpp";

export function createTar(entries) {
  return jayessArchiveCreateTar(entries);
}

export function extractTar(bytes) {
  return jayessArchiveExtractTar(bytes);
}

export function writeTar(path, entries) {
  return jayessArchiveWriteTar(path, entries);
}

export function writeTarSync(path, entries) {
  return jayessArchiveWriteTarSync(path, entries);
}

export function readTar(path) {
  return jayessArchiveReadTar(path);
}

export function readTarSync(path) {
  return jayessArchiveReadTarSync(path);
}

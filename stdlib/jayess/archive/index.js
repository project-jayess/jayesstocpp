import {
  jayessArchiveCreateTar,
  jayessArchiveExtractTar
} from "./archive-primitives.hpp";
export {
  createTarFromDirectory,
  createTarFromDirectorySync,
  extractTarToDirectory,
  extractTarToDirectorySync
} from "./directories.js";
export {
  readTar,
  readTarSync,
  writeTar,
  writeTarSync
} from "./tar-files.js";

export function createTar(entries) {
  return jayessArchiveCreateTar(entries);
}

export function extractTar(bytes) {
  return jayessArchiveExtractTar(bytes);
}

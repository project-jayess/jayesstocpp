import {
  jayessArchiveCreateTar,
  jayessArchiveExtractTar
} from "./archive-primitives.hpp";
import {
  readBytes,
  readBytesSync,
  writeBytes,
  writeBytesSync
} from "jayess:fs";

export function writeTar(path, entries) {
  return writeBytes(path, jayessArchiveCreateTar(entries));
}

export function writeTarSync(path, entries) {
  return writeBytesSync(path, jayessArchiveCreateTar(entries));
}

export async function readTar(path) {
  return jayessArchiveExtractTar(await readBytes(path));
}

export function readTarSync(path) {
  return jayessArchiveExtractTar(readBytesSync(path));
}

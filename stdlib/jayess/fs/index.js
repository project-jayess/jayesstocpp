import {
  jayessFsCreateDirectories,
  jayessFsAppendText,
  jayessFsCopy,
  jayessFsCopyRecursive,
  jayessFsCopyRecursiveSync,
  jayessFsCopySync,
  jayessFsExists,
  jayessFsExistsSync,
  jayessFsList,
  jayessFsListSync,
  jayessFsReadBytes,
  jayessFsReadBytesSync,
  jayessFsReadText,
  jayessFsReadTextSync,
  jayessFsRemove,
  jayessFsRemoveRecursive,
  jayessFsRemoveRecursiveSync,
  jayessFsRemoveSync,
  jayessFsRename,
  jayessFsRenameSync,
  jayessFsStat,
  jayessFsStatSync,
  jayessFsWriteBytes,
  jayessFsWriteBytesSync,
  jayessFsWriteText,
  jayessFsWriteTextSync,
  jayessFsWalk,
  jayessFsWalkSync
} from "./fs-primitives.hpp";
import {
  openRead as streamOpenRead,
  openReadSync as streamOpenReadSync,
  openWrite as streamOpenWrite,
  openWriteSync as streamOpenWriteSync
} from "jayess:stream";
import { parse as parseJson, stringify as stringifyJson } from "jayess:json";
import { tmpDir } from "jayess:os";
import { join } from "jayess:path";
import { v4 as uuidV4 } from "jayess:uuid";

function requireTempPrefix(prefix) {
  if (prefix === null || prefix === "") {
    throw "jayess:fs temp helpers require a non-empty prefix";
  }
  return prefix;
}

function requireSuffix(suffix) {
  if (suffix === null) {
    throw "jayess:fs tempFile requires a suffix";
  }
  return suffix;
}

function tempPath(prefix, suffix) {
  return join(tmpDir(), requireTempPrefix(prefix) + "-" + uuidV4() + suffix);
}

export function exists(path) {
  return jayessFsExists(path);
}

export function existsSync(path) {
  return jayessFsExistsSync(path);
}

export function readText(path) {
  return jayessFsReadText(path);
}

export function readTextSync(path) {
  return jayessFsReadTextSync(path);
}

export async function readJson(path) {
  return parseJson(await readText(path));
}

export function readJsonSync(path) {
  return parseJson(readTextSync(path));
}

export function readBytes(path) {
  return jayessFsReadBytes(path);
}

export function readBytesSync(path) {
  return jayessFsReadBytesSync(path);
}

export function createReadStream(path) {
  return streamOpenRead(path);
}

export function createReadStreamSync(path) {
  return streamOpenReadSync(path);
}

export function createWriteStream(path) {
  return streamOpenWrite(path);
}

export function createWriteStreamSync(path) {
  return streamOpenWriteSync(path);
}

export function writeText(path, text) {
  return jayessFsWriteText(path, text);
}

export function writeTextSync(path, text) {
  return jayessFsWriteTextSync(path, text);
}

export function writeJson(path, value) {
  return writeText(path, stringifyJson(value));
}

export function writeJsonSync(path, value) {
  return writeTextSync(path, stringifyJson(value));
}

export function writeBytes(path, bytes) {
  return jayessFsWriteBytes(path, bytes);
}

export function writeBytesSync(path, bytes) {
  return jayessFsWriteBytesSync(path, bytes);
}

export function appendText(path, text) {
  return jayessFsAppendText(path, text);
}

export function appendTextSync(path, text) {
  return jayessFsAppendTextSync(path, text);
}

export function copy(fromPath, toPath) {
  return jayessFsCopy(fromPath, toPath);
}

export function copySync(fromPath, toPath) {
  return jayessFsCopySync(fromPath, toPath);
}

export function copyRecursive(fromPath, toPath) {
  return jayessFsCopyRecursive(fromPath, toPath);
}

export function copyRecursiveSync(fromPath, toPath) {
  return jayessFsCopyRecursiveSync(fromPath, toPath);
}

export function createDirectories(path) {
  return jayessFsCreateDirectories(path);
}

export function createDirectoriesSync(path) {
  return jayessFsCreateDirectoriesSync(path);
}

export async function tempDirectory(prefix) {
  var directory = tempPath(prefix, "");
  await createDirectories(directory);
  return directory;
}

export function tempDirectorySync(prefix) {
  var directory = tempPath(prefix, "");
  createDirectoriesSync(directory);
  return directory;
}

export async function tempFile(prefix, suffix) {
  var file = tempPath(prefix, requireSuffix(suffix));
  await writeText(file, "");
  return file;
}

export function tempFileSync(prefix, suffix) {
  var file = tempPath(prefix, requireSuffix(suffix));
  writeTextSync(file, "");
  return file;
}

export function remove(path) {
  return jayessFsRemove(path);
}

export function removeSync(path) {
  return jayessFsRemoveSync(path);
}

export function removeRecursive(path) {
  return jayessFsRemoveRecursive(path);
}

export function removeRecursiveSync(path) {
  return jayessFsRemoveRecursiveSync(path);
}

export function list(path) {
  return jayessFsList(path);
}

export function listSync(path) {
  return jayessFsListSync(path);
}

export function walk(path) {
  return jayessFsWalk(path);
}

export function walkSync(path) {
  return jayessFsWalkSync(path);
}

export function rename(fromPath, toPath) {
  return jayessFsRename(fromPath, toPath);
}

export function renameSync(fromPath, toPath) {
  return jayessFsRenameSync(fromPath, toPath);
}

export function stat(path) {
  return jayessFsStat(path);
}

export function statSync(path) {
  return jayessFsStatSync(path);
}

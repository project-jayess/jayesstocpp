import {
  createTarFromDirectory,
  createTarFromDirectorySync,
  createTar,
  extractTarToDirectory,
  extractTarToDirectorySync,
  extractTar,
  readTar,
  readTarSync,
  writeTar,
  writeTarSync
} from "jayess:archive";
import { fromUtf8, length as bytesLength } from "jayess:bytes";
import {
  createDirectoriesSync,
  readTextSync,
  writeTextSync
} from "jayess:fs";

function entries() {
  return [
    { path: "docs/readme.txt", text: "hello", mode: 420, mtime: 12 },
    { path: "bin/data.bin", bytes: fromUtf8("bytes"), mode: 384, mtime: 34 },
    { path: "empty", type: "directory", mode: 493, mtime: 56 }
  ];
}

export function run(syncPath, asyncPath) {
  var archive = createTar(entries());
  var extracted = extractTar(archive);
  writeTarSync(syncPath, entries());
  var syncEntries = readTarSync(syncPath);
  return [
    bytesLength(archive),
    extracted.length,
    extracted[0].path,
    extracted[0].text,
    extracted[1].mode,
    syncEntries[1].text,
    syncEntries[2].type,
    syncEntries[2].mtime,
    asyncPath
  ];
}

export async function runAsync(path) {
  await writeTar(path, entries());
  var extracted = await readTar(path);
  return extracted[0].text + " " + extracted[1].text;
}

export function runDirectorySync(root) {
  var source = root + "/source";
  var target = root + "/target";
  createDirectoriesSync(source + "/docs");
  writeTextSync(source + "/docs/readme.txt", "directory");
  var archive = createTarFromDirectorySync(source);
  var count = extractTarToDirectorySync(archive, target);
  return [
    count,
    extractTar(archive)[0].path,
    readTextSync(target + "/docs/readme.txt")
  ];
}

export async function runDirectoryAsync(root) {
  var source = root + "/async-source";
  var target = root + "/async-target";
  createDirectoriesSync(source + "/nested");
  writeTextSync(source + "/nested/file.txt", "async directory");
  var archive = await createTarFromDirectory(source);
  var count = await extractTarToDirectory(archive, target);
  return [count, readTextSync(target + "/nested/file.txt")];
}

export function unsafePath() {
  return createTar([{ path: "../escape.txt", text: "bad" }]);
}

export function unsupportedType() {
  return createTar([{ path: "link", text: "bad", type: "symlink" }]);
}

export function duplicatePath() {
  return createTar([
    { path: "same.txt", text: "one" },
    { path: "same.txt/", text: "two" }
  ]);
}

export function unsafeEmptySegment() {
  return createTar([{ path: "bad//name.txt", text: "bad" }]);
}

export function unsafeDirectoryContent() {
  return createTar([{ path: "dir", type: "directory", text: "bad" }]);
}

export function directoryHelperUnsupportedOptions(root) {
  return createTarFromDirectorySync(root, { recursive: true });
}

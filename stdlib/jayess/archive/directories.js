import {
  createDirectories,
  createDirectoriesSync,
  readBytes,
  readBytesSync,
  walk,
  walkSync,
  writeBytes,
  writeBytesSync
} from "jayess:fs";
import {
  dirname,
  join,
  resolve,
  separator
} from "jayess:path";
import {
  jayessArchiveCreateTar,
  jayessArchiveExtractTar
} from "./archive-primitives.hpp";

function requireNoOptions(options, operation) {
  if (options !== null) {
    throw "Jayess archive " + operation + " options are unsupported in this slice";
  }
}

function isWindowsAbsolute(path) {
  return path.length >= 2 && path[1] === ":";
}

function normalizeTarPath(path) {
  if (path === "" || path[0] === "/" || isWindowsAbsolute(path) || path.includes("\\")) {
    throw "Jayess archive directory helper paths must be relative";
  }
  var parts = path.split("/");
  var output = [];
  for (var index = 0; index < parts.length; index = index + 1) {
    var part = parts[index];
    if (part === "") {
      throw "Jayess archive directory helper paths must not contain empty path segments";
    }
    if (part === ".") {
      throw "Jayess archive directory helper paths must not contain . segments";
    }
    if (part === "..") {
      throw "Jayess archive directory helper paths must not contain ..";
    }
    output.push(part);
  }
  return output.join("/");
}

function destinationPath(root, relativePath) {
  var normalizedRoot = resolve(root);
  var normalizedPath = normalizeTarPath(relativePath);
  var destination = resolve(join(normalizedRoot, normalizedPath));
  var prefix = normalizedRoot + separator();
  if (destination !== normalizedRoot && !destination.startsWith(prefix)) {
    throw "Jayess archive extraction target escapes destination directory";
  }
  return destination;
}

function entryFromWalk(root, item, sync) {
  var relativePath = normalizeTarPath(item.relativePath);
  if (item.type === "directory") {
    return { path: relativePath, type: "directory" };
  }
  if (item.type !== "file") {
    throw "Jayess archive directory creation supports only files and directories";
  }
  return {
    path: relativePath,
    type: "file",
    bytes: sync ? readBytesSync(item.path) : readBytes(item.path)
  };
}

function entriesFromWalk(root, items, sync) {
  var entries = [];
  for (var index = 0; index < items.length; index = index + 1) {
    entries.push(entryFromWalk(root, items[index], sync));
  }
  return entries;
}

export async function createTarFromDirectory(root, options = null) {
  requireNoOptions(options, "createTarFromDirectory");
  var items = await walk(root);
  var entries = [];
  for (var index = 0; index < items.length; index = index + 1) {
    var item = items[index];
    var relativePath = normalizeTarPath(item.relativePath);
    if (item.type === "directory") {
      entries.push({ path: relativePath, type: "directory" });
    } else if (item.type === "file") {
      entries.push({ path: relativePath, type: "file", bytes: await readBytes(item.path) });
    } else {
      throw "Jayess archive directory creation supports only files and directories";
    }
  }
  return jayessArchiveCreateTar(entries);
}

export function createTarFromDirectorySync(root, options = null) {
  requireNoOptions(options, "createTarFromDirectorySync");
  var items = walkSync(root);
  var entries = entriesFromWalk(root, items, true);
  return jayessArchiveCreateTar(entries);
}

export async function extractTarToDirectory(bytes, targetDir, options = null) {
  requireNoOptions(options, "extractTarToDirectory");
  await createDirectories(targetDir);
  var entries = jayessArchiveExtractTar(bytes);
  for (var index = 0; index < entries.length; index = index + 1) {
    var entry = entries[index];
    var destination = destinationPath(targetDir, entry.path);
    if (entry.type === "directory") {
      await createDirectories(destination);
    } else {
      await createDirectories(dirname(destination));
      await writeBytes(destination, entry.bytes);
    }
  }
  return entries.length;
}

export function extractTarToDirectorySync(bytes, targetDir, options = null) {
  requireNoOptions(options, "extractTarToDirectorySync");
  createDirectoriesSync(targetDir);
  var entries = jayessArchiveExtractTar(bytes);
  for (var index = 0; index < entries.length; index = index + 1) {
    var entry = entries[index];
    var destination = destinationPath(targetDir, entry.path);
    if (entry.type === "directory") {
      createDirectoriesSync(destination);
    } else {
      createDirectoriesSync(dirname(destination));
      writeBytesSync(destination, entry.bytes);
    }
  }
  return entries.length;
}

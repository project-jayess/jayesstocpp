import {
  createDirectories,
  createDirectoriesSync,
  exists,
  existsSync,
  list,
  listSync,
  readJson,
  readJsonSync,
  remove,
  removeSync,
  writeJson,
  writeJsonSync
} from "jayess:fs";
import { endsWith, indexOf, slice } from "jayess:string";
import { join } from "jayess:path";

function fail(message) {
  throw message;
}

function storeRoot(store) {
  if (store === null || store.root === null || store.root === "") {
    fail("jayess:kv expected an open store");
  }
  return store.root;
}

function requireKey(key) {
  if (key === null || key === "") {
    fail("jayess:kv key must be a non-empty string");
  }
  if (indexOf(key, "/") !== -1 || indexOf(key, "\\") !== -1 || indexOf(key, "..") !== -1 || indexOf(key, ":") !== -1) {
    fail("jayess:kv key must not contain path separators, drive prefixes, or traversal");
  }
  return key;
}

function entryPath(store, key) {
  return join(storeRoot(store), requireKey(key) + ".json");
}

function keyFromFilename(filename) {
  if (!endsWith(filename, ".json")) {
    return null;
  }
  return slice(filename, 0, filename.length - 5);
}

export function open(root, options) {
  return {
    root: root,
    options: options
  };
}

export async function get(store, key) {
  var path = entryPath(store, key);
  if (!(await exists(path))) {
    return null;
  }
  return await readJson(path);
}

export function getSync(store, key) {
  var path = entryPath(store, key);
  if (!existsSync(path)) {
    return null;
  }
  return readJsonSync(path);
}

export async function set(store, key, value) {
  await createDirectories(storeRoot(store));
  await writeJson(entryPath(store, key), value);
  return value;
}

export function setSync(store, key, value) {
  createDirectoriesSync(storeRoot(store));
  writeJsonSync(entryPath(store, key), value);
  return value;
}

export async function has(store, key) {
  return await exists(entryPath(store, key));
}

export function hasSync(store, key) {
  return existsSync(entryPath(store, key));
}

export async function deleteKey(store, key) {
  var path = entryPath(store, key);
  if (await exists(path)) {
    await remove(path);
    return true;
  }
  return false;
}

export function deleteKeySync(store, key) {
  var path = entryPath(store, key);
  if (existsSync(path)) {
    removeSync(path);
    return true;
  }
  return false;
}

export async function keys(store) {
  var names = await list(storeRoot(store));
  var result = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var key = keyFromFilename(names[index]);
    if (key !== null) {
      result.push(key);
    }
  }
  return result;
}

export function keysSync(store) {
  var names = listSync(storeRoot(store));
  var result = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var key = keyFromFilename(names[index]);
    if (key !== null) {
      result.push(key);
    }
  }
  return result;
}

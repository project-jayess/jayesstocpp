import { readText, readTextSync } from "jayess:fs";
import { parse as parseDotenv } from "jayess:dotenv";
import { parse as parseIni } from "jayess:ini";
import { parse as parseJson } from "jayess:json";
import { keys } from "jayess:object";
import { extname } from "jayess:path";
import { toLower } from "jayess:string";
import { parse as parseToml } from "jayess:toml";

function parseByExtension(path, text) {
  var extension = toLower(extname(path));
  if (extension === ".json") {
    return parseJson(text);
  }
  if (extension === ".toml") {
    return parseToml(text);
  }
  if (extension === ".ini") {
    return parseIni(text);
  }
  if (extension === ".env") {
    return parseDotenv(text);
  }
  throw "Unsupported Jayess config file extension: " + extension;
}

export async function loadJson(path) {
  return parseJson(await readText(path));
}

export function loadJsonSync(path) {
  return parseJson(readTextSync(path));
}

export async function loadToml(path) {
  return parseToml(await readText(path));
}

export function loadTomlSync(path) {
  return parseToml(readTextSync(path));
}

export async function loadIni(path) {
  return parseIni(await readText(path));
}

export function loadIniSync(path) {
  return parseIni(readTextSync(path));
}

export async function loadDotenv(path) {
  return parseDotenv(await readText(path));
}

export function loadDotenvSync(path) {
  return parseDotenv(readTextSync(path));
}

export async function load(path) {
  return parseByExtension(path, await readText(path));
}

export function loadSync(path) {
  return parseByExtension(path, readTextSync(path));
}

export function merge(base, override) {
  var result = {};
  var baseKeys = keys(base);
  for (var baseIndex = 0; baseIndex < baseKeys.length; baseIndex = baseIndex + 1) {
    var baseKey = baseKeys[baseIndex];
    result[baseKey] = base[baseKey];
  }
  var overrideKeys = keys(override);
  for (var overrideIndex = 0; overrideIndex < overrideKeys.length; overrideIndex = overrideIndex + 1) {
    var overrideKey = overrideKeys[overrideIndex];
    result[overrideKey] = override[overrideKey];
  }
  return result;
}

export function get(config, key, fallback) {
  var value = config[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

export function requireKey(config, key) {
  var value = config[key];
  if (value === null) {
    throw "Missing Jayess config key: " + key;
  }
  return value;
}

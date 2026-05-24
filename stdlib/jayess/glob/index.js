import { walkSync } from "jayess:fs";
import { separator } from "jayess:path";
import { replaceAll, split } from "jayess:string";

function normalize(path) {
  var sep = separator();
  if (sep === "/") {
    return path;
  }
  return replaceAll(path, sep, "/");
}

function matchName(name, pattern) {
  var nameIndex = 0;
  var patternIndex = 0;
  var starIndex = -1;
  var retryIndex = 0;
  while (nameIndex < name.length) {
    var patternChar = pattern.slice(patternIndex, patternIndex + 1);
    var nameChar = name.slice(nameIndex, nameIndex + 1);
    if (patternChar === "?" || patternChar === nameChar) {
      nameIndex = nameIndex + 1;
      patternIndex = patternIndex + 1;
    } else if (patternChar === "*") {
      starIndex = patternIndex;
      retryIndex = nameIndex;
      patternIndex = patternIndex + 1;
    } else if (starIndex >= 0) {
      patternIndex = starIndex + 1;
      retryIndex = retryIndex + 1;
      nameIndex = retryIndex;
    } else {
      return false;
    }
  }
  while (pattern.slice(patternIndex, patternIndex + 1) === "*") {
    patternIndex = patternIndex + 1;
  }
  return patternIndex === pattern.length;
}

function matchParts(pathParts, pathIndex, patternParts, patternIndex) {
  if (patternIndex === patternParts.length) {
    return pathIndex === pathParts.length;
  }
  var pattern = patternParts[patternIndex];
  if (pattern === "**") {
    if (matchParts(pathParts, pathIndex, patternParts, patternIndex + 1)) {
      return true;
    }
    if (pathIndex < pathParts.length) {
      return matchParts(pathParts, pathIndex + 1, patternParts, patternIndex);
    }
    return false;
  }
  if (pathIndex >= pathParts.length) {
    return false;
  }
  if (!matchName(pathParts[pathIndex], pattern)) {
    return false;
  }
  return matchParts(pathParts, pathIndex + 1, patternParts, patternIndex + 1);
}

export function matches(path, pattern) {
  return matchParts(split(normalize(path), "/"), 0, split(normalize(pattern), "/"), 0);
}

export function globSync(root, pattern) {
  var entries = walkSync(root);
  var matched = [];
  for (var index = 0; index < entries.length; index = index + 1) {
    var entry = normalize(entries[index]);
    if (matches(entry, pattern)) {
      matched.push(entries[index]);
    }
  }
  return matched;
}

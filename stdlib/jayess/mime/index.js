import { endsWith, startsWith, toLower } from "jayess:string";

function normalizeExtension(pathOrExtension) {
  var value = toLower(pathOrExtension);
  if (startsWith(value, ".")) {
    return value;
  }
  var index = value.length - 1;
  while (index >= 0) {
    if (value[index] === ".") {
      return value.slice(index);
    }
    if (value[index] === "/" || value[index] === "\\") {
      return "";
    }
    index = index - 1;
  }
  return "";
}

export function lookup(pathOrExtension) {
  var ext = normalizeExtension(pathOrExtension);
  if (ext === ".html" || ext === ".htm") {
    return "text/html";
  }
  if (ext === ".css") {
    return "text/css";
  }
  if (ext === ".js" || ext === ".mjs") {
    return "text/javascript";
  }
  if (ext === ".json") {
    return "application/json";
  }
  if (ext === ".txt" || ext === ".md" || ext === ".csv" || ext === ".toml" || ext === ".ini") {
    return "text/plain";
  }
  if (ext === ".png") {
    return "image/png";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }
  if (ext === ".gif") {
    return "image/gif";
  }
  if (ext === ".svg") {
    return "image/svg+xml";
  }
  if (ext === ".wasm") {
    return "application/wasm";
  }
  return "application/octet-stream";
}

export function extension(type) {
  var normalized = toLower(type);
  if (startsWith(normalized, "text/html")) {
    return ".html";
  }
  if (startsWith(normalized, "text/css")) {
    return ".css";
  }
  if (startsWith(normalized, "text/javascript") || startsWith(normalized, "application/javascript")) {
    return ".js";
  }
  if (startsWith(normalized, "application/json")) {
    return ".json";
  }
  if (startsWith(normalized, "text/plain")) {
    return ".txt";
  }
  if (startsWith(normalized, "image/png")) {
    return ".png";
  }
  if (startsWith(normalized, "image/jpeg")) {
    return ".jpg";
  }
  if (startsWith(normalized, "image/gif")) {
    return ".gif";
  }
  if (startsWith(normalized, "image/svg+xml")) {
    return ".svg";
  }
  if (startsWith(normalized, "application/wasm")) {
    return ".wasm";
  }
  return "";
}

export function isText(type) {
  var normalized = toLower(type);
  return startsWith(normalized, "text/") || startsWith(normalized, "application/json") || endsWith(normalized, "+json");
}

export function charset(type) {
  var normalized = toLower(type);
  var marker = "charset=";
  var index = normalized.indexOf(marker);
  if (index < 0) {
    return "";
  }
  return normalized.slice(index + marker.length);
}

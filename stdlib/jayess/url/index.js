import {
  jayessUrlFormat,
  jayessUrlGetQuery,
  jayessUrlJoinPath,
  jayessUrlParse,
  jayessUrlSetQuery
} from "./url-primitives.hpp";

export function parse(text) {
  return jayessUrlParse(text);
}

export function format(parts) {
  return jayessUrlFormat(parts);
}

export function joinPath(base, path) {
  return jayessUrlJoinPath(base, path);
}

export function getQuery(url, key) {
  return jayessUrlGetQuery(url, key);
}

export function setQuery(url, key, value) {
  return jayessUrlSetQuery(url, key, value);
}

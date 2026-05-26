import { join } from "jayess:array";
import { keys } from "jayess:object";
import { includes, replaceAll, slice } from "jayess:string";
export { sanitizeSubset } from "./sanitize.js";

const htmlNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:_-";

function isName(value) {
  if (value.length === 0) {
    return false;
  }
  for (var index = 0; index < value.length; index = index + 1) {
    if (!includes(htmlNameCharacters, slice(value, index, index + 1))) {
      return false;
    }
  }
  return true;
}

function requireTagName(name) {
  if (!isName(name)) {
    throw "jayess:html tag name must contain only letters, digits, ':', '_', or '-'";
  }
}

function requireAttributeName(name) {
  if (!isName(name)) {
    throw "jayess:html attribute name must contain only letters, digits, ':', '_', or '-'";
  }
}

function requireChild(value) {
  if (value === null) {
    throw "jayess:html child value must be a string";
  }
}

function requireAttributeValue(value) {
  if (value === null) {
    throw "jayess:html attribute value must be a string";
  }
}

export function escapeText(value) {
  var escaped = replaceAll(value, "&", "&amp;");
  escaped = replaceAll(escaped, "<", "&lt;");
  escaped = replaceAll(escaped, ">", "&gt;");
  return escaped;
}

export function escapeAttribute(value) {
  var escaped = escapeText(value);
  escaped = replaceAll(escaped, "\"", "&quot;");
  escaped = replaceAll(escaped, "'", "&#39;");
  return escaped;
}

function renderAttributes(attributes) {
  var names = keys(attributes);
  var parts = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    requireAttributeName(name);
    requireAttributeValue(attributes[name]);
    parts.push(name + "=\"" + escapeAttribute(attributes[name]) + "\"");
  }
  if (parts.length === 0) {
    return "";
  }
  return " " + join(parts, " ");
}

export function fragment(children) {
  var parts = [];
  for (var index = 0; index < children.length; index = index + 1) {
    requireChild(children[index]);
    parts.push(children[index]);
  }
  return join(parts, "");
}

export function tag(name, attributes, children) {
  requireTagName(name);
  return "<" + name + renderAttributes(attributes) + ">" + fragment(children) + "</" + name + ">";
}

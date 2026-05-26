import { parse as parseColor } from "jayess:color";
import { parseFloat } from "jayess:number";
import { slice, split, startsWith, trim } from "jayess:string";
import { parseBoxValue } from "./box-values.js";

const supportedProperties = [
  "display",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "margin",
  "padding",
  "background-color",
  "color",
  "font-size",
  "border-width",
  "border-color",
  "border-radius",
  "text-align",
  "gap",
  "overflow"
];

function fail(message) {
  throw message;
}

function isSupportedProperty(name) {
  for (var index = 0; index < supportedProperties.length; index = index + 1) {
    if (supportedProperties[index] === name) {
      return true;
    }
  }
  return false;
}

function parseSize(value) {
  var text = trim(value);
  if (text === "auto") {
    return null;
  }
  if (text.length > 2 && slice(text, text.length - 2, text.length) === "px") {
    text = slice(text, 0, text.length - 2);
  }
  var parsed = parseFloat(text);
  if (parsed === null) {
    fail("jayess:canvas css expected a numeric size");
  }
  return parsed;
}

function normalizeValue(property, value) {
  var normalized = trim(value);
  if (property === "background-color" || property === "color" || property === "border-color") {
    return parseColor(normalized);
  }
  if (
    property === "width"
    || property === "height"
    || property === "min-width"
    || property === "max-width"
    || property === "min-height"
    || property === "max-height"
    || property === "font-size"
    || property === "border-width"
    || property === "border-radius"
    || property === "gap"
  ) {
    return parseSize(normalized);
  }
  if (property === "margin" || property === "padding") {
    return parseBoxValue(normalized);
  }
  if (property === "overflow") {
    if (normalized !== "visible" && normalized !== "hidden") {
      fail("jayess:canvas css overflow must be visible or hidden");
    }
  }
  return normalized;
}

export function parseInlineStyle(styleText) {
  var style = {};
  if (styleText === null || trim(styleText) === "") {
    return style;
  }
  var declarations = split(styleText, ";");
  for (var index = 0; index < declarations.length; index = index + 1) {
    var declaration = trim(declarations[index]);
    if (declaration.length === 0) {
      continue;
    }
    var parts = split(declaration, ":");
    if (parts.length < 2) {
      fail("jayess:canvas css declaration is malformed");
    }
    var property = trim(parts[0]);
    if (!isSupportedProperty(property)) {
      fail("jayess:canvas css unsupported property: " + property);
    }
    style[property] = normalizeValue(property, parts[1]);
  }
  return style;
}

function simpleSelectorKind(selector) {
  if (startsWith(selector, ".")) {
    return "class";
  }
  if (startsWith(selector, "#")) {
    return "id";
  }
  return "element";
}

function simpleSelectorName(selector) {
  if (startsWith(selector, ".") || startsWith(selector, "#")) {
    return slice(selector, 1, selector.length);
  }
  return selector;
}

function parseSimpleSelector(selector) {
  var text = trim(selector);
  if (text.length === 0) {
    fail("jayess:canvas css selector is empty");
  }
  return {
    kind: simpleSelectorKind(text),
    name: simpleSelectorName(text)
  };
}

function parseSelector(selector) {
  var parts = split(selector, " ");
  var chain = [];
  for (var index = 0; index < parts.length; index = index + 1) {
    var part = trim(parts[index]);
    if (part.length !== 0) {
      chain.push(parseSimpleSelector(part));
    }
  }
  if (chain.length === 0) {
    fail("jayess:canvas css selector is empty");
  }
  if (chain.length === 1) {
    return {
      kind: chain[0].kind,
      name: chain[0].name,
      chain: chain
    };
  }
  return {
    kind: "descendant",
    name: selector,
    chain: chain
  };
}

export function parseCss(css, options) {
  var rules = [];
  var chunks = split(css, "}");
  for (var index = 0; index < chunks.length; index = index + 1) {
    var chunk = trim(chunks[index]);
    if (chunk.length === 0) {
      continue;
    }
    var parts = split(chunk, "{");
    if (parts.length !== 2) {
      fail("jayess:canvas css rule is malformed");
    }
    var selector = trim(parts[0]);
    if (selector.length === 0) {
      fail("jayess:canvas css selector is empty");
    }
    var parsedSelector = parseSelector(selector);
    rules.push({
      selector: selector,
      kind: parsedSelector.kind,
      name: parsedSelector.name,
      chain: parsedSelector.chain,
      style: parseInlineStyle(parts[1])
    });
  }
  return { rules: rules };
}

import { parse as parseColor } from "jayess:color";
import { indexOf, slice, split, startsWith, trim } from "jayess:string";
import { parseBoxValue } from "./box-values.js";
import { parseCssSize } from "./css-values.js";

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
  "font-family",
  "font-size",
  "line-height",
  "border-width",
  "border-color",
  "border-radius",
  "text-align",
  "gap",
  "overflow",
  "box-sizing"
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
    || property === "line-height"
    || property === "border-width"
    || property === "border-radius"
    || property === "gap"
  ) {
    return parseCssSize(normalized);
  }
  if (property === "font-family") {
    return normalized;
  }
  if (property === "margin" || property === "padding") {
    return parseBoxValue(normalized);
  }
  if (property === "overflow") {
    if (normalized !== "visible" && normalized !== "hidden") {
      fail("jayess:canvas css overflow must be visible or hidden");
    }
  }
  if (property === "box-sizing") {
    if (normalized !== "border-box" && normalized !== "content-box") {
      fail("jayess:canvas css box-sizing must be border-box or content-box");
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
  var childParts = split(selector, ">");
  if (childParts.length > 1) {
    var childChain = [];
    for (var childIndex = 0; childIndex < childParts.length; childIndex = childIndex + 1) {
      childChain.push(parseSimpleSelector(childParts[childIndex]));
    }
    return {
      kind: "child",
      name: selector,
      chain: childChain
    };
  }

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

function stripComments(css) {
  var output = "";
  var cursor = 0;
  while (cursor < css.length) {
    var start = indexOf(slice(css, cursor, css.length), "/*");
    if (start < 0) {
      return output + slice(css, cursor, css.length);
    }
    start = cursor + start;
    output = output + slice(css, cursor, start);
    var end = indexOf(slice(css, start + 2, css.length), "*/");
    if (end < 0) {
      fail("jayess:canvas css comment is not closed");
    }
    cursor = start + 2 + end + 2;
  }
  return output;
}

export function parseCss(css, options) {
  var rules = [];
  var chunks = split(stripComments(css), "}");
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
    var selectors = split(selector, ",");
    var style = parseInlineStyle(parts[1]);
    for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex = selectorIndex + 1) {
      var selectorText = trim(selectors[selectorIndex]);
      if (selectorText.length === 0) {
        fail("jayess:canvas css selector is empty");
      }
      var parsedSelector = parseSelector(selectorText);
      rules.push({
        selector: selectorText,
        kind: parsedSelector.kind,
        name: parsedSelector.name,
        chain: parsedSelector.chain,
        style: style
      });
    }
  }
  return { rules: rules };
}

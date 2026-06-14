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

function findTopLevelBraceEnd(text, openIndex) {
  var depth = 1;
  for (var index = openIndex + 1; index < text.length; index = index + 1) {
    var char = text[index];
    if (char === "{") {
      depth = depth + 1;
    }
    if (char === "}") {
      depth = depth - 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function parseMediaFeature(query) {
  var text = trim(query);
  if (startsWith(text, "(") && text[text.length - 1] === ")") {
    text = trim(slice(text, 1, text.length - 1));
  }
  var parts = split(text, ":");
  if (parts.length !== 2) {
    fail("jayess:canvas css media query must be a single width or height condition");
  }
  var feature = trim(parts[0]);
  if (feature !== "max-width" && feature !== "min-width" && feature !== "max-height" && feature !== "min-height") {
    fail("jayess:canvas css unsupported media feature: " + feature);
  }
  var size = parseCssSize(parts[1]);
  return {
    feature: feature,
    size: size
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

function parseCssRules(css, media) {
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
        media: media,
        style: style
      });
    }
  }
  return rules;
}

export function parseCss(css, options) {
  var rules = [];
  var source = stripComments(css);
  var cursor = 0;
  while (cursor < source.length) {
    var remaining = slice(source, cursor, source.length);
    var mediaOffset = indexOf(remaining, "@media");
    if (mediaOffset < 0) {
      var trailingRules = parseCssRules(remaining, null);
      for (var trailingIndex = 0; trailingIndex < trailingRules.length; trailingIndex = trailingIndex + 1) {
        rules.push(trailingRules[trailingIndex]);
      }
      cursor = source.length;
    } else {
      var mediaStart = cursor + mediaOffset;
      var leadingRules = parseCssRules(slice(source, cursor, mediaStart), null);
      for (var leadingIndex = 0; leadingIndex < leadingRules.length; leadingIndex = leadingIndex + 1) {
        rules.push(leadingRules[leadingIndex]);
      }
      var openOffset = indexOf(slice(source, mediaStart, source.length), "{");
      if (openOffset < 0) {
        fail("jayess:canvas css media block is not opened");
      }
      var openIndex = mediaStart + openOffset;
      var closeIndex = findTopLevelBraceEnd(source, openIndex);
      if (closeIndex < 0) {
        fail("jayess:canvas css media block is not closed");
      }
      var query = slice(source, mediaStart + 6, openIndex);
      var media = parseMediaFeature(query);
      var mediaRules = parseCssRules(slice(source, openIndex + 1, closeIndex), media);
      for (var mediaRuleIndex = 0; mediaRuleIndex < mediaRules.length; mediaRuleIndex = mediaRuleIndex + 1) {
        rules.push(mediaRules[mediaRuleIndex]);
      }
      cursor = closeIndex + 1;
    }
  }
  return { rules: rules };
}

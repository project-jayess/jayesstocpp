import { split } from "jayess:string";
import { parseCss, parseInlineStyle } from "./css-parser.js";
import { resolveCssSizeWithContext } from "./css-layout-values.js";
import { parseHtml } from "./html-parser.js";

function copyStyle(style) {
  var copied = {};
  copied.display = style.display;
  copied.width = style.width;
  copied.height = style.height;
  copied["min-width"] = style["min-width"];
  copied["max-width"] = style["max-width"];
  copied["min-height"] = style["min-height"];
  copied["max-height"] = style["max-height"];
  copied.margin = style.margin;
  copied.padding = style.padding;
  copied["background-color"] = style["background-color"];
  copied.color = style.color;
  copied["font-family"] = style["font-family"];
  copied["font-size"] = style["font-size"];
  copied["line-height"] = style["line-height"];
  copied["border-width"] = style["border-width"];
  copied["border-color"] = style["border-color"];
  copied["border-radius"] = style["border-radius"];
  copied["text-align"] = style["text-align"];
  copied.gap = style.gap;
  copied.overflow = style.overflow;
  copied["box-sizing"] = style["box-sizing"];
  return copied;
}

function applyStyle(target, source) {
  var keys = ["display", "width", "height", "min-width", "max-width", "min-height", "max-height", "margin", "padding", "background-color", "color", "font-family", "font-size", "line-height", "border-width", "border-color", "border-radius", "text-align", "gap", "overflow", "box-sizing"];
  for (var index = 0; index < keys.length; index = index + 1) {
    var key = keys[index];
    if (source[key] !== null) {
      target[key] = source[key];
    }
  }
  return target;
}

function hasClass(node, className) {
  var value = node.attributes["class"];
  if (value === null) {
    return false;
  }
  var classes = split(value, " ");
  for (var index = 0; index < classes.length; index = index + 1) {
    if (classes[index] === className) {
      return true;
    }
  }
  return false;
}

function simpleSelectorMatches(node, selector) {
  if (node.type !== "element") {
    return false;
  }
  if (selector.kind === "element") {
    return node.tagName === selector.name;
  }
  if (selector.kind === "id") {
    return node.attributes.id === selector.name;
  }
  return hasClass(node, selector.name);
}

function descendantSelectorMatches(node, rule, ancestors) {
  var chain = rule.chain;
  if (chain === null || chain.length === 0) {
    return false;
  }
  if (!simpleSelectorMatches(node, chain[chain.length - 1])) {
    return false;
  }
  var ancestorIndex = ancestors.length - 1;
  for (var chainIndex = chain.length - 2; chainIndex >= 0; chainIndex = chainIndex - 1) {
    var found = false;
    while (ancestorIndex >= 0) {
      if (simpleSelectorMatches(ancestors[ancestorIndex], chain[chainIndex])) {
        found = true;
        ancestorIndex = ancestorIndex - 1;
        break;
      }
      ancestorIndex = ancestorIndex - 1;
    }
    if (!found) {
      return false;
    }
  }
  return true;
}

function mediaMatches(media, viewport) {
  if (media === null) {
    return true;
  }
  if (viewport === null) {
    return false;
  }
  var context = {
    fontSize: 8,
    rootFontSize: 8,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height
  };
  var basis = media.feature === "max-height" || media.feature === "min-height" ? viewport.height : viewport.width;
  var threshold = resolveCssSizeWithContext(media.size, basis, null, context);
  if (threshold === null) {
    return false;
  }
  if (media.feature === "max-width") {
    return viewport.width <= threshold;
  }
  if (media.feature === "min-width") {
    return viewport.width >= threshold;
  }
  if (media.feature === "max-height") {
    return viewport.height <= threshold;
  }
  return viewport.height >= threshold;
}

function ruleMatches(node, rule, ancestors, viewport) {
  if (!mediaMatches(rule.media, viewport)) {
    return false;
  }
  if (rule.kind === "descendant") {
    return descendantSelectorMatches(node, rule, ancestors);
  }
  if (rule.kind === "child") {
    var chain = rule.chain;
    if (chain === null || chain.length === 0 || !simpleSelectorMatches(node, chain[chain.length - 1])) {
      return false;
    }
    var ancestorIndex = ancestors.length - 1;
    for (var chainIndex = chain.length - 2; chainIndex >= 0; chainIndex = chainIndex - 1) {
      if (ancestorIndex < 0 || !simpleSelectorMatches(ancestors[ancestorIndex], chain[chainIndex])) {
        return false;
      }
      ancestorIndex = ancestorIndex - 1;
    }
    return true;
  }
  return simpleSelectorMatches(node, rule);
}

function defaultStyle(parentStyle, node) {
  var defaultDisplay = "block";
  if (node !== null && (node.type === "text" || node.tagName === "span" || node.tagName === "label")) {
    defaultDisplay = "inline";
  }
  return {
    display: defaultDisplay,
    width: null,
    height: null,
    "min-width": null,
    "max-width": null,
    "min-height": null,
    "max-height": null,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    "background-color": null,
    color: parentStyle === null ? null : parentStyle.color,
    "font-family": parentStyle === null ? null : parentStyle["font-family"],
    "font-size": parentStyle === null ? 8 : parentStyle["font-size"],
    "line-height": parentStyle === null ? null : parentStyle["line-height"],
    "border-width": 0,
    "border-color": null,
    "border-radius": 0,
    "text-align": "left",
    gap: 0,
    overflow: "visible",
    "box-sizing": "border-box"
  };
}

function styleNode(node, stylesheet, parentStyle, ancestors, viewport) {
  var style = defaultStyle(parentStyle, node);
  for (var index = 0; index < stylesheet.rules.length; index = index + 1) {
    var rule = stylesheet.rules[index];
    if (ruleMatches(node, rule, ancestors, viewport)) {
      applyStyle(style, rule.style);
    }
  }
  if (node.type === "element" && node.attributes.style !== null) {
    applyStyle(style, parseInlineStyle(node.attributes.style));
  }
  node.style = style;
  if (node.children !== null) {
    var childAncestors = [];
    for (var ancestorIndex = 0; ancestorIndex < ancestors.length; ancestorIndex = ancestorIndex + 1) {
      childAncestors.push(ancestors[ancestorIndex]);
    }
    childAncestors.push(node);
    for (var childIndex = 0; childIndex < node.children.length; childIndex = childIndex + 1) {
      styleNode(node.children[childIndex], stylesheet, style, childAncestors, viewport);
    }
  }
}

export function styleHtmlDocument(document, viewport) {
  styleNode(document.tree, document.stylesheet, null, [], viewport);
  return document;
}

export function createHtmlDocument(html, css, options) {
  var tree = parseHtml(html, options);
  var stylesheet = parseCss(css, options);
  var document = {
    tree: tree,
    stylesheet: stylesheet,
    layout: null,
    actions: []
  };
  styleHtmlDocument(document, null);
  return document;
}

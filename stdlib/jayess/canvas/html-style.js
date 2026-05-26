import { split } from "jayess:string";
import { parseCss, parseInlineStyle } from "./css-parser.js";
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
  copied["font-size"] = style["font-size"];
  copied["border-width"] = style["border-width"];
  copied["border-color"] = style["border-color"];
  copied["border-radius"] = style["border-radius"];
  copied["text-align"] = style["text-align"];
  copied.gap = style.gap;
  copied.overflow = style.overflow;
  return copied;
}

function applyStyle(target, source) {
  var keys = ["display", "width", "height", "min-width", "max-width", "min-height", "max-height", "margin", "padding", "background-color", "color", "font-size", "border-width", "border-color", "border-radius", "text-align", "gap", "overflow"];
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

function ruleMatches(node, rule, ancestors) {
  if (rule.kind === "descendant") {
    return descendantSelectorMatches(node, rule, ancestors);
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
    "font-size": parentStyle === null ? 8 : parentStyle["font-size"],
    "border-width": 0,
    "border-color": null,
    "border-radius": 0,
    "text-align": "left",
    gap: 0,
    overflow: "visible"
  };
}

function styleNode(node, stylesheet, parentStyle, ancestors) {
  var style = defaultStyle(parentStyle, node);
  for (var index = 0; index < stylesheet.rules.length; index = index + 1) {
    var rule = stylesheet.rules[index];
    if (ruleMatches(node, rule, ancestors)) {
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
      styleNode(node.children[childIndex], stylesheet, style, childAncestors);
    }
  }
}

export function createHtmlDocument(html, css, options) {
  var tree = parseHtml(html, options);
  var stylesheet = parseCss(css, options);
  styleNode(tree, stylesheet, null, []);
  return {
    tree: tree,
    stylesheet: stylesheet,
    layout: null,
    actions: []
  };
}

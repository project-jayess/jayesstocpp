import { hasExplicitSize, resolveBoxSide, resolveCssSize, uniformResolvedBoxValue } from "./css-layout-values.js";
import { slice as sliceString, split } from "jayess:string";

function styleValue(style, key, fallback) {
  var value = style[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

function resolvedStyleSize(style, key, basis, fallback) {
  return resolveCssSize(styleValue(style, key, null), basis, fallback);
}

function applySizeConstraints(style, width, height, widthBasis, heightBasis) {
  var constrainedWidth = width;
  var constrainedHeight = height;
  var minWidth = resolvedStyleSize(style, "min-width", widthBasis, null);
  var maxWidth = resolvedStyleSize(style, "max-width", widthBasis, null);
  var minHeight = resolvedStyleSize(style, "min-height", heightBasis, null);
  var maxHeight = resolvedStyleSize(style, "max-height", heightBasis, null);
  if (minWidth !== null && constrainedWidth < minWidth) {
    constrainedWidth = minWidth;
  }
  if (maxWidth !== null && constrainedWidth > maxWidth) {
    constrainedWidth = maxWidth;
  }
  if (minHeight !== null && constrainedHeight < minHeight) {
    constrainedHeight = minHeight;
  }
  if (maxHeight !== null && constrainedHeight > maxHeight) {
    constrainedHeight = maxHeight;
  }
  return {
    width: constrainedWidth,
    height: constrainedHeight
  };
}

function childText(node) {
  if (node.type === "text") {
    return node.text;
  }
  if (node.tagName === "input") {
    if (node.attributes.value !== null) {
      return node.attributes.value;
    }
    if (node.attributes.placeholder !== null) {
      return node.attributes.placeholder;
    }
    return "";
  }
  var text = "";
  for (var index = 0; index < node.children.length; index = index + 1) {
    var childValue = childText(node.children[index]);
    if (childValue !== "") {
      if (text === "") {
        text = childValue;
      } else {
        text = text + " " + childValue;
      }
    }
  }
  return text;
}

function isInlineLike(node) {
  return node.type === "text" || node.style.display === "inline" || node.tagName === "span" || node.tagName === "label";
}

function hasOnlyInlineChildren(node) {
  if (node.children === null || node.children.length === 0) {
    return false;
  }
  for (var index = 0; index < node.children.length; index = index + 1) {
    if (!isInlineLike(node.children[index])) {
      return false;
    }
  }
  return true;
}

function wrapText(text, availableWidth, charWidth) {
  if (text === "") {
    return [];
  }
  if (availableWidth <= 0 || charWidth <= 0) {
    return [text];
  }
  var maxChars = availableWidth / charWidth;
  if (maxChars < 1) {
    maxChars = 1;
  }
  var words = split(text, " ");
  var lines = [];
  var line = "";
  for (var index = 0; index < words.length; index = index + 1) {
    var word = words[index];
    var candidate = line === "" ? word : line + " " + word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line !== "") {
        lines.push(line);
      }
      while (word.length > maxChars) {
        lines.push(sliceString(word, 0, maxChars));
        word = sliceString(word, maxChars, word.length);
      }
      line = word;
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines;
}

function layoutNode(node, x, y, width, heightBasis, measureText) {
  var style = node.style;
  var marginValue = styleValue(style, "margin", null);
  var paddingValue = styleValue(style, "padding", null);
  var marginTop = resolveBoxSide(marginValue, "top", width);
  var marginRight = resolveBoxSide(marginValue, "right", width);
  var marginBottom = resolveBoxSide(marginValue, "bottom", width);
  var marginLeft = resolveBoxSide(marginValue, "left", width);
  var availableOuterWidth = width - marginLeft - marginRight;
  if (availableOuterWidth < 0) {
    availableOuterWidth = 0;
  }
  var paddingTop = resolveBoxSide(paddingValue, "top", availableOuterWidth);
  var paddingRight = resolveBoxSide(paddingValue, "right", availableOuterWidth);
  var paddingBottom = resolveBoxSide(paddingValue, "bottom", availableOuterWidth);
  var paddingLeft = resolveBoxSide(paddingValue, "left", availableOuterWidth);
  var margin = uniformResolvedBoxValue(marginTop, marginRight, marginBottom, marginLeft);
  var padding = uniformResolvedBoxValue(paddingTop, paddingRight, paddingBottom, paddingLeft);
  var borderWidth = resolvedStyleSize(style, "border-width", availableOuterWidth, 0);
  var contentX = x + marginLeft + borderWidth + paddingLeft;
  var contentY = y + marginTop + borderWidth + paddingTop;
  var explicitOuterWidth = resolvedStyleSize(style, "width", availableOuterWidth, null);
  if (explicitOuterWidth !== null && style["box-sizing"] === "content-box") {
    explicitOuterWidth = explicitOuterWidth + paddingLeft + paddingRight + borderWidth * 2;
  }
  var fallbackContentWidth = availableOuterWidth - borderWidth * 2 - paddingLeft - paddingRight;
  var contentWidth = explicitOuterWidth === null ? fallbackContentWidth : explicitOuterWidth - borderWidth * 2 - paddingLeft - paddingRight;
  if (contentWidth < 0) {
    contentWidth = 0;
  }

  if (node.type === "text" || node.children.length === 0 || node.tagName === "button" || node.tagName === "input" || hasOnlyInlineChildren(node)) {
    var textValue = childText(node);
    var fontSize = resolvedStyleSize(style, "font-size", availableOuterWidth, 8);
    var lineHeight = resolvedStyleSize(style, "line-height", availableOuterWidth, fontSize);
    var charWidth = fontSize * 0.85;
    var explicitWidth = hasExplicitSize(style.width);
    var explicitHeight = hasExplicitSize(style.height);
    var wrapWidth = explicitWidth ? contentWidth : fallbackContentWidth;
    if (wrapWidth < 0) {
      wrapWidth = 0;
    }
    var lines = wrapText(textValue, wrapWidth, charWidth);
    var measured = {
      width: textValue.length * charWidth,
      height: lineHeight
    };
    var lineHeightTotal = lines.length === 0 ? lineHeight : lines.length * lineHeight;
    var fallbackHeight = lineHeightTotal + paddingTop + paddingBottom + borderWidth * 2 + marginTop + marginBottom;
    var nodeHeight = resolvedStyleSize(style, "height", heightBasis, fallbackHeight);
    if (hasExplicitSize(style.height) && style["box-sizing"] === "content-box") {
      nodeHeight = nodeHeight + paddingTop + paddingBottom + borderWidth * 2;
    }
    var fallbackWidth = measured.width + paddingLeft + paddingRight + borderWidth * 2 + marginLeft + marginRight;
    if (explicitWidth) {
      fallbackWidth = explicitOuterWidth;
    }
    if (!explicitWidth && fallbackWidth > width) {
      fallbackWidth = width;
    }
    var nodeWidth = explicitWidth ? explicitOuterWidth : fallbackWidth;
    var constrained = applySizeConstraints(style, nodeWidth, nodeHeight, availableOuterWidth, heightBasis);
    nodeWidth = constrained.width;
    nodeHeight = constrained.height;
    node.layout = {
      x: x + marginLeft,
      y: y + marginTop,
      width: nodeWidth,
      height: nodeHeight,
      contentX: contentX,
      contentY: contentY,
      contentWidth: nodeWidth - paddingLeft - paddingRight - borderWidth * 2,
      text: textValue,
      textLines: lines,
      lineHeight: lineHeight,
      fontSize: fontSize,
      margin: margin,
      padding: padding,
      marginTop: marginTop,
      marginRight: marginRight,
      marginBottom: marginBottom,
      marginLeft: marginLeft,
      paddingTop: paddingTop,
      paddingRight: paddingRight,
      paddingBottom: paddingBottom,
      paddingLeft: paddingLeft,
      borderWidth: borderWidth,
      disabled: node.type === "element" && node.attributes !== null && (node.attributes.disabled === "true" || node.attributes.disabled === "disabled"),
      overflow: style.overflow
    };
    return nodeHeight;
  }

  var usedHeight = paddingTop + borderWidth;
  var childHeightBasis = resolvedStyleSize(style, "height", heightBasis, null);
  if (childHeightBasis !== null) {
    if (style["box-sizing"] === "content-box") {
      childHeightBasis = childHeightBasis + paddingTop + paddingBottom + borderWidth * 2;
    }
    childHeightBasis = childHeightBasis - paddingTop - paddingBottom - borderWidth * 2;
    if (childHeightBasis < 0) {
      childHeightBasis = 0;
    }
  }
  var gap = resolvedStyleSize(style, "gap", availableOuterWidth, 0);
  for (var index = 0; index < node.children.length; index = index + 1) {
    var child = node.children[index];
    var childY = contentY + usedHeight;
    var childHeight = layoutNode(child, contentX, childY, contentWidth, childHeightBasis, measureText);
    usedHeight = usedHeight + childHeight + gap;
  }
  if (node.children.length > 0) {
    usedHeight = usedHeight - gap;
  }

  var totalHeight = resolvedStyleSize(style, "height", heightBasis, usedHeight + paddingBottom + borderWidth + marginTop + marginBottom);
  if (hasExplicitSize(style.height) && style["box-sizing"] === "content-box") {
    totalHeight = totalHeight + paddingTop + paddingBottom + borderWidth * 2;
  }
  var totalWidth = explicitOuterWidth === null ? width - marginLeft - marginRight : explicitOuterWidth;
  var constrained = applySizeConstraints(style, totalWidth, totalHeight, availableOuterWidth, heightBasis);
  totalWidth = constrained.width;
  totalHeight = constrained.height;
  node.layout = {
    x: x + marginLeft,
    y: y + marginTop,
    width: totalWidth,
    height: totalHeight,
    contentX: contentX,
    contentY: contentY,
    contentWidth: contentWidth,
    text: "",
    textLines: [],
    lineHeight: resolvedStyleSize(style, "line-height", availableOuterWidth, resolvedStyleSize(style, "font-size", availableOuterWidth, 8)),
    fontSize: resolvedStyleSize(style, "font-size", availableOuterWidth, 8),
    margin: margin,
    padding: padding,
    marginTop: marginTop,
    marginRight: marginRight,
    marginBottom: marginBottom,
    marginLeft: marginLeft,
    paddingTop: paddingTop,
    paddingRight: paddingRight,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    borderWidth: borderWidth,
    disabled: node.type === "element" && node.attributes !== null && (node.attributes.disabled === "true" || node.attributes.disabled === "disabled"),
    overflow: style.overflow
  };
  return totalHeight;
}

export function layoutHtml(document, bounds, measureText) {
  var root = document.tree;
  root.layout = bounds;
  var cursorY = bounds.y;
  for (var index = 0; index < root.children.length; index = index + 1) {
    cursorY = cursorY + layoutNode(root.children[index], bounds.x, cursorY, bounds.width, bounds.height, measureText);
  }
  document.layout = bounds;
  return document;
}

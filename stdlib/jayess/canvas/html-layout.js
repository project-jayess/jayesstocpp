import { boxBottom, boxLeft, boxRight, boxTop, uniformBoxValue } from "./box-values.js";

function styleNumber(style, key, fallback) {
  var value = style[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

function applySizeConstraints(style, width, height) {
  var constrainedWidth = width;
  var constrainedHeight = height;
  var minWidth = styleNumber(style, "min-width", null);
  var maxWidth = styleNumber(style, "max-width", null);
  var minHeight = styleNumber(style, "min-height", null);
  var maxHeight = styleNumber(style, "max-height", null);
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
  var words = text.split(" ");
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
        lines.push(word.slice(0, maxChars));
        word = word.slice(maxChars, word.length);
      }
      line = word;
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines;
}

function layoutNode(node, x, y, width, measureText) {
  var style = node.style;
  var marginValue = styleNumber(style, "margin", 0);
  var paddingValue = styleNumber(style, "padding", 0);
  var marginTop = boxTop(marginValue);
  var marginRight = boxRight(marginValue);
  var marginBottom = boxBottom(marginValue);
  var marginLeft = boxLeft(marginValue);
  var paddingTop = boxTop(paddingValue);
  var paddingRight = boxRight(paddingValue);
  var paddingBottom = boxBottom(paddingValue);
  var paddingLeft = boxLeft(paddingValue);
  var margin = uniformBoxValue(marginValue);
  var padding = uniformBoxValue(paddingValue);
  var borderWidth = styleNumber(style, "border-width", 0);
  var contentX = x + marginLeft + borderWidth + paddingLeft;
  var contentY = y + marginTop + borderWidth + paddingTop;
  var contentWidth = styleNumber(style, "width", width - marginLeft - marginRight - borderWidth * 2 - paddingLeft - paddingRight);
  if (contentWidth < 0) {
    contentWidth = 0;
  }

  if (node.type === "text" || node.children.length === 0 || node.tagName === "button" || node.tagName === "input" || hasOnlyInlineChildren(node)) {
    var textValue = childText(node);
    var fontSize = styleNumber(style, "font-size", 8);
    var charWidth = fontSize / 2;
    var explicitWidth = style.width !== null;
    var wrapWidth = explicitWidth ? contentWidth : width - marginLeft - marginRight - borderWidth * 2 - paddingLeft - paddingRight;
    if (wrapWidth < 0) {
      wrapWidth = 0;
    }
    var lines = wrapText(textValue, wrapWidth, charWidth);
    var lineHeight = fontSize;
    var measured = measureText(textValue, {
      charWidth: charWidth,
      charHeight: fontSize
    });
    var lineHeightTotal = lines.length === 0 ? lineHeight : lines.length * lineHeight;
    var nodeHeight = styleNumber(style, "height", lineHeightTotal + paddingTop + paddingBottom + borderWidth * 2 + marginTop + marginBottom);
    var fallbackWidth = explicitWidth ? style.width + paddingLeft + paddingRight + borderWidth * 2 + marginLeft + marginRight : measured.width + paddingLeft + paddingRight + borderWidth * 2 + marginLeft + marginRight;
    if (!explicitWidth && fallbackWidth > width) {
      fallbackWidth = width;
    }
    var nodeWidth = styleNumber(style, "width", fallbackWidth);
    var constrained = applySizeConstraints(style, nodeWidth, nodeHeight);
    nodeWidth = constrained.width;
    nodeHeight = constrained.height;
    node.layout = {
      x: x + marginLeft,
      y: y + marginTop,
      width: nodeWidth,
      height: nodeHeight,
      contentX: contentX,
      contentY: contentY,
      contentWidth: nodeWidth - padding * 2 - borderWidth * 2,
      text: textValue,
      textLines: lines,
      lineHeight: lineHeight,
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
  for (var index = 0; index < node.children.length; index = index + 1) {
    var child = node.children[index];
    var childY = contentY + usedHeight;
    var childHeight = layoutNode(child, contentX, childY, contentWidth, measureText);
    usedHeight = usedHeight + childHeight + styleNumber(style, "gap", 0);
  }
  if (node.children.length > 0) {
    usedHeight = usedHeight - styleNumber(style, "gap", 0);
  }

  var totalHeight = styleNumber(style, "height", usedHeight + paddingBottom + borderWidth + marginTop + marginBottom);
  var totalWidth = styleNumber(style, "width", width - marginLeft - marginRight);
  var constrained = applySizeConstraints(style, totalWidth, totalHeight);
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
    lineHeight: styleNumber(style, "font-size", 8),
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
    cursorY = cursorY + layoutNode(root.children[index], bounds.x, cursorY, bounds.width, measureText);
  }
  document.layout = bounds;
  return document;
}

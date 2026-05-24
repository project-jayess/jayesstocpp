import { fillRect } from "jayess:canvas";
import { defaultBitmapFont, glyphRows } from "./glyphs.js";

function activeFont(font) {
  if (font === null) {
    return defaultBitmapFont();
  }
  if (font.charWidth === null || font.charHeight === null || font.spacing === null) {
    throw "jayess:font expected a font with charWidth, charHeight, and spacing";
  }
  return font;
}

function fontLineSpacing(font) {
  if (font.lineSpacing === null) {
    return 1;
  }
  return font.lineSpacing;
}

function requireGlyph(char) {
  if (char.length !== 1) {
    throw "jayess:font expected a single-character glyph";
  }
  return char;
}

export function lineHeight(font) {
  var used = activeFont(font);
  return used.charHeight + fontLineSpacing(used);
}

export function charWidth(font, char) {
  requireGlyph(char);
  if (char === "\n") {
    return 0;
  }
  return activeFont(font).charWidth;
}

export function measureText(font, text) {
  var used = activeFont(font);
  if (text.length === 0) {
    return { width: 0, height: used.charHeight };
  }

  var maxWidth = 0;
  var currentWidth = 0;
  var lines = 1;
  for (var index = 0; index < text.length; index = index + 1) {
    var char = text[index];
    if (char === "\n") {
      if (currentWidth > maxWidth) {
        maxWidth = currentWidth;
      }
      currentWidth = 0;
      lines = lines + 1;
    } else {
      if (currentWidth > 0) {
        currentWidth = currentWidth + used.spacing;
      }
      currentWidth = currentWidth + charWidth(used, char);
    }
  }

  if (currentWidth > maxWidth) {
    maxWidth = currentWidth;
  }

  return {
    width: maxWidth,
    height: used.charHeight * lines + fontLineSpacing(used) * (lines - 1)
  };
}

function drawGlyph(canvas, char, x, y, color) {
  var rows = glyphRows(requireGlyph(char));
  for (var row = 0; row < rows.length; row = row + 1) {
    var pixels = rows[row];
    for (var column = 0; column < pixels.length; column = column + 1) {
      if (pixels[column] === "1") {
        fillRect(canvas, x + column, y + row, 1, 1, color);
      }
    }
  }
}

export function drawText(canvas, font, text, x, y, color) {
  var used = activeFont(font);
  var cursorX = x;
  var cursorY = y;
  for (var index = 0; index < text.length; index = index + 1) {
    var char = text[index];
    if (char === "\n") {
      cursorX = x;
      cursorY = cursorY + lineHeight(used);
    } else {
      if (char !== " ") {
        drawGlyph(canvas, char, cursorX, cursorY, color);
      }
      cursorX = cursorX + used.charWidth + used.spacing;
    }
  }
  return canvas;
}

function optionValue(options, key, fallback) {
  if (options === null) {
    return fallback;
  }
  var value = options[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

function horizontalOffset(bounds, measured, align) {
  if (align === "center") {
    return (bounds.width - measured.width) / 2;
  }
  if (align === "right") {
    return bounds.width - measured.width;
  }
  return 0;
}

function verticalOffset(bounds, measured, align) {
  if (align === "middle") {
    return (bounds.height - measured.height) / 2;
  }
  if (align === "bottom") {
    return bounds.height - measured.height;
  }
  return 0;
}

export function drawTextAligned(canvas, font, text, bounds, color, options) {
  var used = activeFont(font);
  var measured = measureText(used, text);
  var align = optionValue(options, "align", "left");
  var verticalAlign = optionValue(options, "verticalAlign", "top");
  var cursorY = bounds.y + verticalOffset(bounds, measured, verticalAlign);
  var start = 0;

  for (var index = 0; index <= text.length; index = index + 1) {
    if (index === text.length || text[index] === "\n") {
      var line = text.slice(start, index);
      var lineSize = measureText(used, line);
      var cursorX = bounds.x + horizontalOffset(bounds, lineSize, align);
      drawText(canvas, used, line, cursorX, cursorY, color);
      cursorY = cursorY + lineHeight(used);
      start = index + 1;
    }
  }

  return canvas;
}

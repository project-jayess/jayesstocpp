import { fillRect } from "jayess:canvas";
import { parse as parseJson } from "jayess:json";
import { readTextSync } from "jayess:fs";
import { slice as sliceString } from "jayess:string";
import { jayessFontKind, jayessFontLoad, jayessFontSystemDefault } from "./font-primitives.hpp";
import {
  bitmapFontByName,
  createBitmapFont,
  defaultBitmapFont,
  glyphExistsForFont,
  glyphRowsForFont,
  registerBitmapFont,
  setDefaultBitmapFont
} from "./glyphs.js";

function activeFont(font) {
  if (font === null) {
    return defaultBitmapFont();
  }
  if (font.charWidth === null || font.charHeight === null || font.advance === null || font.lineHeight === null) {
    throw "jayess:font expected a font with charWidth, charHeight, advance, and lineHeight";
  }
  return font;
}

function requireGlyph(char) {
  if (char.length !== 1) {
    throw "jayess:font expected a single-character glyph";
  }
  return char;
}

export function defaultFont() {
  return defaultBitmapFont();
}

export function createFont(name, glyphs, metrics) {
  return createBitmapFont(name, glyphs, metrics);
}

export function registerFont(font) {
  return registerBitmapFont(font);
}

export function getFont(name) {
  return bitmapFontByName(name);
}

export function setDefaultFont(name) {
  return setDefaultBitmapFont(name);
}

export function loadFont(name, path, options) {
  var kind = jayessFontKind(path);
  if (kind !== "bitmap-json") {
    return registerFont(jayessFontLoad(name, path, options));
  }

  var parsed = parseJson(readTextSync(path));
  var fontName = name === null ? parsed.name : name;
  var font = createBitmapFont(fontName, parsed.glyphs, {
    charWidth: parsed.charWidth,
    charHeight: parsed.charHeight,
    advance: parsed.advance,
    baseline: parsed.baseline,
    lineHeight: parsed.lineHeight
  });
  return registerFont(font);
}

function bitmapFallbackFromSystemHandle(name, handle) {
  var fallback = defaultBitmapFont();
  fallback.name = name === null ? "system-default" : name;
  fallback.family = "jayess-default-5x7";
  fallback.kind = "bitmap-font";
  fallback.sourcePath = "";
  fallback.sourceFormat = "bitmap";
  fallback.systemFont = true;
  fallback.platform = handle.platform;
  fallback.fallbackUsed = true;
  fallback.diagnostic = handle.diagnostic;
  fallback.ascent = handle.ascent;
  fallback.descent = handle.descent;
  fallback.fallbackGlyph = "?";
  return fallback;
}

export function systemDefaultFont(options) {
  var handle = jayessFontSystemDefault("system-default", options);
  if (handle.fallbackUsed === true) {
    return bitmapFallbackFromSystemHandle("system-default", handle);
  }
  return handle;
}

export function registerSystemDefaultFont(name, options) {
  var fontName = name === null ? "system-default" : name;
  var handle = jayessFontSystemDefault(fontName, options);
  if (handle.fallbackUsed === true) {
    return registerFont(bitmapFallbackFromSystemHandle(fontName, handle));
  }
  return registerFont(handle);
}

export function lineHeight(font) {
  return activeFont(font).lineHeight;
}

export function charWidth(font, char) {
  requireGlyph(char);
  if (char === "\n") {
    return 0;
  }
  return activeFont(font).advance;
}

export function fontMetrics(font) {
  var used = activeFont(font);
  return {
    charWidth: used.charWidth,
    charHeight: used.charHeight,
    advance: used.advance,
    baseline: used.baseline,
    lineHeight: used.lineHeight,
    ascent: used.ascent === null ? used.baseline : used.ascent,
    descent: used.descent === null ? used.lineHeight - used.baseline : used.descent,
    fallbackGlyph: used.fallbackGlyph === null ? "?" : used.fallbackGlyph
  };
}

export function measureGlyph(font, char) {
  requireGlyph(char);
  var metrics = fontMetrics(font);
  if (char === "\n") {
    return {
      width: 0,
      height: metrics.lineHeight,
      advance: 0,
      missing: false
    };
  }
  var used = activeFont(font);
  return {
    width: metrics.charWidth,
    height: metrics.charHeight,
    advance: metrics.advance,
    missing: !glyphExistsForFont(used, char)
  };
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
        currentWidth = currentWidth + (used.advance - used.charWidth);
      }
      currentWidth = currentWidth + charWidth(used, char);
    }
  }

  if (currentWidth > maxWidth) {
    maxWidth = currentWidth;
  }

  return {
    width: maxWidth,
    height: used.lineHeight * lines
  };
}

function drawGlyph(canvas, char, x, y, color) {
  var used = activeFont(null);
  var rows = glyphRowsForFont(used, requireGlyph(char));
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
        var rows = glyphRowsForFont(used, char);
        for (var row = 0; row < rows.length; row = row + 1) {
          var pixels = rows[row];
          for (var column = 0; column < pixels.length; column = column + 1) {
            if (pixels[column] === "1") {
              fillRect(canvas, cursorX + column, cursorY + row, 1, 1, color);
            }
          }
        }
      }
      cursorX = cursorX + used.advance;
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
      var line = sliceString(text, start, index);
      var lineSize = measureText(used, line);
      var cursorX = bounds.x + horizontalOffset(bounds, lineSize, align);
      drawText(canvas, used, line, cursorX, cursorY, color);
      cursorY = cursorY + lineHeight(used);
      start = index + 1;
    }
  }

  return canvas;
}

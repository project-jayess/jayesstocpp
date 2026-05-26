import { join } from "jayess:array";
import { escapeAttribute, escapeText, sanitizeSubset } from "jayess:html";
import { startsWith, slice, split, trim } from "jayess:string";

function headingLevel(line) {
  var level = 0;
  while (level < line.length && slice(line, level, level + 1) === "#") {
    level = level + 1;
  }
  if (level > 0 && level <= 6 && slice(line, level, level + 1) === " ") {
    return level;
  }
  return 0;
}

function codeLanguage(line) {
  if (!startsWith(line, "```")) {
    return null;
  }
  return trim(slice(line, 3, line.length));
}

export function tokenize(text) {
  var lines = split(text, "\n");
  var result = [];
  var inCode = false;
  var codeLines = [];
  var language = "";
  for (var index = 0; index < lines.length; index = index + 1) {
    var line = lines[index];
    var fenceLanguage = codeLanguage(line);
    if (fenceLanguage !== null) {
      if (inCode) {
        result.push({ type: "code", language: language, text: join(codeLines, "\n") });
        codeLines = [];
        inCode = false;
      } else {
        language = fenceLanguage;
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    var trimmed = trim(line);
    if (trimmed.length === 0) {
      continue;
    }
    var level = headingLevel(trimmed);
    if (level > 0) {
      result.push({ type: "heading", level: level, text: trim(slice(trimmed, level + 1, trimmed.length)) });
    } else if (startsWith(trimmed, "- ")) {
      result.push({ type: "listItem", text: trim(slice(trimmed, 2, trimmed.length)) });
    } else {
      result.push({ type: "paragraph", text: trimmed });
    }
  }
  if (inCode) {
    throw "jayess:markdown code fence is not closed";
  }
  return result;
}

function renderInline(text) {
  var open = text.indexOf("[");
  var close = text.indexOf("]");
  var paren = text.indexOf("(");
  var end = text.indexOf(")");
  if (open >= 0 && close > open && paren === close + 1 && end > paren) {
    var before = escapeText(slice(text, 0, open));
    var label = escapeText(slice(text, open + 1, close));
    var href = escapeAttribute(slice(text, paren + 1, end));
    var after = escapeText(slice(text, end + 1, text.length));
    return before + "<a href=\"" + href + "\">" + label + "</a>" + after;
  }
  return escapeText(text);
}

function renderToken(token) {
  if (token.type === "heading") {
    var level = token.level.toString();
    return "<h" + level + ">" + renderInline(token.text) + "</h" + level + ">";
  }
  if (token.type === "paragraph") {
    return "<p>" + renderInline(token.text) + "</p>";
  }
  if (token.type === "code") {
    return "<pre><code>" + escapeText(token.text) + "</code></pre>";
  }
  throw "jayess:markdown unsupported token type";
}

export function toHtml(text) {
  var sourceTokens = tokenize(text);
  var parts = [];
  var listOpen = false;
  for (var index = 0; index < sourceTokens.length; index = index + 1) {
    var token = sourceTokens[index];
    if (token.type === "listItem") {
      if (!listOpen) {
        parts.push("<ul>");
        listOpen = true;
      }
      parts.push("<li>" + renderInline(token.text) + "</li>");
    } else {
      if (listOpen) {
        parts.push("</ul>");
        listOpen = false;
      }
      parts.push(renderToken(token));
    }
  }
  if (listOpen) {
    parts.push("</ul>");
  }
  return join(parts, "\n");
}

export function toSafeHtml(text) {
  return sanitizeSubset(toHtml(text));
}

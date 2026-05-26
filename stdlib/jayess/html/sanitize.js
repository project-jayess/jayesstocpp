import { endsWith, includes, replaceAll, slice, startsWith, trim } from "jayess:string";

const allowedTags = "|a|p|ul|li|pre|code|h1|h2|h3|h4|h5|h6|";

function isAllowedTag(name) {
  return includes(allowedTags, "|" + name + "|");
}

function safeHref(value) {
  return startsWith(value, "https://")
    || startsWith(value, "http://")
    || startsWith(value, "/")
    || startsWith(value, "#")
    || startsWith(value, "mailto:");
}

function escapeText(value) {
  var escaped = replaceAll(value, "&", "&amp;");
  escaped = replaceAll(escaped, "<", "&lt;");
  escaped = replaceAll(escaped, ">", "&gt;");
  return escaped;
}

function escapeAttribute(value) {
  var escaped = escapeText(value);
  escaped = replaceAll(escaped, "\"", "&quot;");
  escaped = replaceAll(escaped, "'", "&#39;");
  return escaped;
}

function renderSafeTag(body) {
  var normalized = trim(body);
  if (startsWith(normalized, "/")) {
    var closingName = trim(slice(normalized, 1, normalized.length));
    if (isAllowedTag(closingName)) {
      return "</" + closingName + ">";
    }
    return escapeText("<" + body + ">");
  }

  if (isAllowedTag(normalized)) {
    return "<" + normalized + ">";
  }

  if (startsWith(normalized, "a href=\"") && endsWith(normalized, "\"")) {
    var href = slice(normalized, 8, normalized.length - 1);
    if (safeHref(href)) {
      return "<a href=\"" + escapeAttribute(href) + "\">";
    }
  }

  return escapeText("<" + body + ">");
}

export function sanitizeSubset(markup) {
  var result = "";
  var index = 0;
  while (index < markup.length) {
    var tagStart = markup.indexOf("<", index);
    if (tagStart < 0) {
      result = result + escapeText(slice(markup, index, markup.length));
      break;
    }

    result = result + escapeText(slice(markup, index, tagStart));
    var tagEnd = markup.indexOf(">", tagStart + 1);
    if (tagEnd < 0) {
      result = result + escapeText(slice(markup, tagStart, markup.length));
      break;
    }

    result = result + renderSafeTag(slice(markup, tagStart + 1, tagEnd));
    index = tagEnd + 1;
  }
  return result;
}

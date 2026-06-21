import { includes, slice, toLower, trim } from "jayess:string";

const supportedElements = ["html", "body", "main", "section", "div", "span", "p", "button", "input", "label", "img", "ul", "ol", "li", "form"];
const voidElements = ["img", "input"];

function fail(message) {
  throw message;
}

function isWhitespace(character) {
  return trim(character) === "";
}

function isNameCharacter(character) {
  return includes("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:_-", character);
}

function isSupportedElement(name) {
  for (var index = 0; index < supportedElements.length; index = index + 1) {
    if (supportedElements[index] === name) {
      return true;
    }
  }
  return false;
}

function isVoidElement(name) {
  for (var index = 0; index < voidElements.length; index = index + 1) {
    if (voidElements[index] === name) {
      return true;
    }
  }
  return false;
}

function readName(text, cursor) {
  var start = cursor;
  while (cursor < text.length && isNameCharacter(slice(text, cursor, cursor + 1))) {
    cursor = cursor + 1;
  }
  if (cursor === start) {
    fail("jayess:canvas html expected a tag or attribute name");
  }
  return {
    name: toLower(slice(text, start, cursor)),
    cursor: cursor
  };
}

function skipWhitespace(text, cursor) {
  while (cursor < text.length && isWhitespace(slice(text, cursor, cursor + 1))) {
    cursor = cursor + 1;
  }
  return cursor;
}

function readAttributeValue(text, cursor) {
  var quote = slice(text, cursor, cursor + 1);
  if (quote !== "\"" && quote !== "'") {
    var start = cursor;
    while (cursor < text.length && !isWhitespace(slice(text, cursor, cursor + 1)) && slice(text, cursor, cursor + 1) !== ">" && slice(text, cursor, cursor + 1) !== "/") {
      cursor = cursor + 1;
    }
    if (cursor === start) {
      fail("jayess:canvas html attribute value is empty");
    }
    return {
      value: slice(text, start, cursor),
      cursor: cursor
    };
  }
  cursor = cursor + 1;
  var start = cursor;
  while (cursor < text.length && slice(text, cursor, cursor + 1) !== quote) {
    cursor = cursor + 1;
  }
  if (cursor >= text.length) {
    fail("jayess:canvas html attribute is missing a closing quote");
  }
  return {
    value: slice(text, start, cursor),
    cursor: cursor + 1
  };
}

function readOpeningTag(text, cursor) {
  cursor = cursor + 1;
  var nameResult = readName(text, cursor);
  var name = nameResult.name;
  if (!isSupportedElement(name)) {
    fail("jayess:canvas html unsupported element: " + name);
  }

  cursor = nameResult.cursor;
  var attributes = {};
  var selfClosing = false;
  while (cursor < text.length) {
    cursor = skipWhitespace(text, cursor);
    var current = slice(text, cursor, cursor + 1);
    if (current === ">") {
      cursor = cursor + 1;
      break;
    }
    if (current === "/" && slice(text, cursor + 1, cursor + 2) === ">") {
      selfClosing = true;
      cursor = cursor + 2;
      break;
    }

    var attributeName = readName(text, cursor);
    cursor = skipWhitespace(text, attributeName.cursor);
    if (slice(text, cursor, cursor + 1) !== "=") {
      attributes[attributeName.name] = "true";
      continue;
    }
    cursor = cursor + 1;
    cursor = skipWhitespace(text, cursor);
    var attributeValue = readAttributeValue(text, cursor);
    attributes[attributeName.name] = attributeValue.value;
    cursor = attributeValue.cursor;
  }

  if (cursor > text.length) {
    fail("jayess:canvas html tag is not closed");
  }

  return {
    node: {
      type: "element",
      tagName: name,
      attributes: attributes,
      children: [],
      style: {},
      layout: null
    },
    cursor: cursor,
    selfClosing: selfClosing || isVoidElement(name)
  };
}

function readClosingTag(text, cursor) {
  cursor = cursor + 2;
  var nameResult = readName(text, cursor);
  cursor = skipWhitespace(text, nameResult.cursor);
  if (slice(text, cursor, cursor + 1) !== ">") {
    fail("jayess:canvas html closing tag is malformed");
  }
  return {
    name: nameResult.name,
    cursor: cursor + 1
  };
}

function appendText(stack, value) {
  var normalized = trim(value);
  if (normalized.length === 0) {
    return null;
  }
  stack[stack.length - 1].children.push({
    type: "text",
    text: normalized,
    style: {},
    layout: null
  });
}

export function parseHtml(html, options) {
  var document = {
    type: "document",
    children: [],
    style: {},
    layout: null
  };
  var stack = [document];
  var cursor = 0;
  var textStart = 0;

  while (cursor < html.length) {
    if (slice(html, cursor, cursor + 1) !== "<") {
      cursor = cursor + 1;
      continue;
    }

    appendText(stack, slice(html, textStart, cursor));
    if (slice(html, cursor + 1, cursor + 2) === "/") {
      var closing = readClosingTag(html, cursor);
      if (stack.length === 1) {
        fail("jayess:canvas html has an unexpected closing tag");
      }
      var active = stack[stack.length - 1];
      if (active.tagName !== closing.name) {
        fail("jayess:canvas html mismatched closing tag: " + closing.name);
      }
      stack.pop();
      cursor = closing.cursor;
      textStart = cursor;
    } else {
      var opening = readOpeningTag(html, cursor);
      stack[stack.length - 1].children.push(opening.node);
      cursor = opening.cursor;
      textStart = cursor;
      if (!opening.selfClosing) {
        stack.push(opening.node);
      }
    }
  }

  appendText(stack, slice(html, textStart, html.length));
  if (stack.length !== 1) {
    fail("jayess:canvas html has an unclosed tag: " + stack[stack.length - 1].tagName);
  }
  return document;
}

import { join } from "jayess:array";
import { has, keys } from "jayess:object";
import { includes, replaceAll, slice, trim } from "jayess:string";

const xmlNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:_-";

function isName(value) {
  if (value.length === 0) {
    return false;
  }
  for (var index = 0; index < value.length; index = index + 1) {
    if (!includes(xmlNameCharacters, slice(value, index, index + 1))) {
      return false;
    }
  }
  return true;
}

function requireName(name, label) {
  if (!isName(name)) {
    throw "jayess:xml " + label + " must contain only letters, digits, ':', '_', or '-'";
  }
}

function escapeText(value) {
  var escaped = replaceAll(value, "&", "&amp;");
  escaped = replaceAll(escaped, "<", "&lt;");
  return replaceAll(escaped, ">", "&gt;");
}

function escapeAttribute(value) {
  var escaped = escapeText(value);
  escaped = replaceAll(escaped, "\"", "&quot;");
  return replaceAll(escaped, "'", "&apos;");
}

function skipWhitespace(state) {
  while (state.index < state.text.length && includes(" \n\r\t", slice(state.text, state.index, state.index + 1))) {
    state.index = state.index + 1;
  }
}

function readName(state, label) {
  var start = state.index;
  while (state.index < state.text.length && includes(xmlNameCharacters, slice(state.text, state.index, state.index + 1))) {
    state.index = state.index + 1;
  }
  var name = slice(state.text, start, state.index);
  requireName(name, label);
  return name;
}

function readQuotedAttributeValue(state) {
  if (slice(state.text, state.index, state.index + 1) !== "\"") {
    throw "jayess:xml attribute value must use double quotes";
  }
  state.index = state.index + 1;
  var start = state.index;
  while (state.index < state.text.length && slice(state.text, state.index, state.index + 1) !== "\"") {
    state.index = state.index + 1;
  }
  if (state.index >= state.text.length) {
    throw "jayess:xml unterminated attribute value";
  }
  var value = slice(state.text, start, state.index);
  state.index = state.index + 1;
  return value;
}

function readAttributes(state) {
  var attributes = {};
  skipWhitespace(state);
  while (state.index < state.text.length && slice(state.text, state.index, state.index + 1) !== ">" && slice(state.text, state.index, state.index + 2) !== "/>") {
    var name = readName(state, "attribute name");
    skipWhitespace(state);
    if (slice(state.text, state.index, state.index + 1) !== "=") {
      throw "jayess:xml attribute must contain '='";
    }
    state.index = state.index + 1;
    skipWhitespace(state);
    attributes[name] = readQuotedAttributeValue(state);
    skipWhitespace(state);
  }
  return attributes;
}

function addChild(stack, root, node) {
  if (stack.length === 0) {
    if (root.node !== null) {
      throw "jayess:xml document must contain one root element";
    }
    root.node = node;
  } else {
    stack[stack.length - 1].children.push(node);
  }
}

function readOpenTag(state, stack, root) {
  state.index = state.index + 1;
  var name = readName(state, "element name");
  var attributes = readAttributes(state);
  var node = { name: name, attributes: attributes, children: [] };
  if (slice(state.text, state.index, state.index + 2) === "/>") {
    state.index = state.index + 2;
    addChild(stack, root, node);
    return null;
  }
  if (slice(state.text, state.index, state.index + 1) !== ">") {
    throw "jayess:xml element tag is not closed";
  }
  state.index = state.index + 1;
  addChild(stack, root, node);
  stack.push(node);
}

function readCloseTag(state, stack) {
  state.index = state.index + 2;
  var name = readName(state, "closing element name");
  skipWhitespace(state);
  if (slice(state.text, state.index, state.index + 1) !== ">") {
    throw "jayess:xml closing tag is not closed";
  }
  state.index = state.index + 1;
  if (stack.length === 0 || stack[stack.length - 1].name !== name) {
    throw "jayess:xml closing tag does not match the current element";
  }
  stack.pop();
}

export function parse(text) {
  var state = { text: text, index: 0 };
  var stack = [];
  var root = { node: null };
  while (state.index < text.length) {
    if (slice(text, state.index, state.index + 2) === "</") {
      readCloseTag(state, stack);
    } else if (slice(text, state.index, state.index + 1) === "<") {
      readOpenTag(state, stack, root);
    } else {
      var start = state.index;
      while (state.index < text.length && slice(text, state.index, state.index + 1) !== "<") {
        state.index = state.index + 1;
      }
      var value = trim(slice(text, start, state.index));
      if (value.length > 0) {
        addChild(stack, root, { text: value });
      }
    }
  }
  if (stack.length !== 0) {
    throw "jayess:xml document ended before all elements were closed";
  }
  if (root.node === null) {
    throw "jayess:xml document must contain one root element";
  }
  return root.node;
}

function renderAttributes(attributes) {
  var names = keys(attributes);
  var parts = [];
  for (var index = 0; index < names.length; index = index + 1) {
    var name = names[index];
    requireName(name, "attribute name");
    parts.push(name + "=\"" + escapeAttribute(attributes[name]) + "\"");
  }
  if (parts.length === 0) {
    return "";
  }
  return " " + join(parts, " ");
}

export function stringify(node) {
  if (has(node, "text")) {
    return escapeText(node.text);
  }
  requireName(node.name, "element name");
  var children = [];
  for (var index = 0; index < node.children.length; index = index + 1) {
    children.push(stringify(node.children[index]));
  }
  return "<" + node.name + renderAttributes(node.attributes) + ">" + join(children, "") + "</" + node.name + ">";
}

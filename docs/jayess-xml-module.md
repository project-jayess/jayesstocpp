# `jayess:xml` Module

`jayess:xml` provides focused XML helpers for deterministic Jayess-owned data exchange. It is a small XML subset, not a browser DOM or full XML processor.

## Exports

- `parse(text)` parses one XML root element into an object tree.
- `stringify(node)` formats an object tree back to XML text.

## Node Shape

Element nodes use:

```js
{ name: "note", attributes: { priority: "high" }, children: [] }
```

Text nodes use:

```js
{ text: "hello" }
```

`stringify` escapes text and attribute values.

## Supported XML Subset

- one root element
- element names containing letters, digits, `:`, `_`, or `-`
- double-quoted attribute values
- nested elements
- text nodes
- self-closing tags

## Diagnostics

The module throws focused string diagnostics for malformed element names, malformed attributes, mismatched closing tags, unclosed tags, and missing root elements.

## Boundaries

This module does not implement XML declarations, namespaces beyond name text, comments, CDATA, processing instructions, entity decoding, schemas, or DOM mutation APIs.

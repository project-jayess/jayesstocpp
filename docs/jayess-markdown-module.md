# `jayess:markdown` Module

`jayess:markdown` provides a compact Markdown tokenizer and HTML renderer for common text output in Jayess tools and servers.

## Exports

- `tokenize(text)` returns token objects for the supported Markdown subset.
- `toHtml(text)` renders the supported subset to escaped HTML.

## Token Shapes

Headings:

```js
{ type: "heading", level: 1, text: "Title" }
```

Paragraphs:

```js
{ type: "paragraph", text: "Body" }
```

List items:

```js
{ type: "listItem", text: "Item" }
```

Code fences:

```js
{ type: "code", language: "js", text: "var name = \"Jayess\";" }
```

## Supported Markdown Subset

- ATX headings from `#` through `######`
- paragraphs
- unordered list items beginning with `- `
- fenced code blocks using triple backticks
- one inline link per line in the form `[label](href)`

`toHtml` escapes text and attribute content through `jayess:html`.

## Diagnostics

The module throws a focused string diagnostic for unclosed code fences and unsupported token types passed through internal rendering.

## Boundaries

This module does not implement full CommonMark. It intentionally excludes nested lists, tables, emphasis, raw HTML passthrough, images, reference links, and multiple inline links per line in this first focused slice.

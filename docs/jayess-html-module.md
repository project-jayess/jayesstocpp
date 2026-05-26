# Jayess `jayess:html` Module

`jayess:html` provides focused HTML string helpers for server, webview, and generated UI output. It is a Jayess-written module and does not provide a DOM.

## Surface

- `escapeText(value)` escapes `&`, `<`, and `>` for text-node content.
- `escapeAttribute(value)` escapes text plus double quotes and single quotes for quoted attribute values.
- `sanitizeSubset(markup)` preserves a narrow safe HTML subset and escapes other tags/text.
- `fragment(children)` joins an array of already-rendered child strings.
- `tag(name, attributes, children)` renders `<name ...attributes>children</name>`.

## Rules

- Tag names and attribute names must be non-empty and contain only letters, digits, `:`, `_`, or `-`.
- Attribute values must not be `null`.
- Child values passed to `fragment` or `tag` must not be `null`.
- `tag` escapes attribute values but does not escape child strings. Use `escapeText` for literal user text before passing it as a child.
- `sanitizeSubset` preserves only `a`, `p`, `ul`, `li`, `pre`, `code`, and `h1` through `h6` tags. `<a>` may keep only an exact `href="..."` attribute with `http://`, `https://`, `/`, `#`, or `mailto:` targets.
- Attribute order follows the deterministic key order produced by `jayess:object`.

## Example

```js
import { escapeText, tag } from "jayess:html";

export function render(title) {
  return tag("h1", { class: "title" }, [escapeText(title)]);
}
```

## Boundaries

This module is intentionally a compact text helper layer. `sanitizeSubset` is a deterministic allow-list pass for Jayess-generated fragments and markdown output; it is not a full browser-grade HTML parser or sanitizer. The module does not provide a DOM, CSS selectors, or browser APIs.

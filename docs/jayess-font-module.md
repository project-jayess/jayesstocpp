# `jayess:font` Module

`jayess:font` provides a small deterministic bitmap-font surface over `jayess:canvas`.

## Surface

- `measureText(font, text)`
- `lineHeight(font)`
- `charWidth(font, char)`
- `drawText(canvas, font, text, x, y, color)`
- `drawTextAligned(canvas, font, text, bounds, color, options)`

Passing `null` for `font` uses the built-in bitmap font metrics. The bitmap glyph data lives separately from the public helpers in `stdlib/jayess/font/glyphs.js`.

`measureText`, `drawText`, and `drawTextAligned` support newline-delimited multi-line text. `drawText` renders deterministic bitmap glyph rows through `jayess:canvas`, so generated output can be tested without platform text APIs.

`drawTextAligned` accepts bounds shaped as `{ x, y, width, height }`. Supported options are `align: "left" | "center" | "right"` and `verticalAlign: "top" | "middle" | "bottom"`.

`jayess:canvas` also exposes small `text` and `measureText` convenience helpers for simple block-glyph drawing. They intentionally do not import this module, so the standard library keeps a one-way dependency from `jayess:font` to `jayess:canvas`.

For rectangle-constrained text, `jayess:canvas` exposes `drawTextBox(...)` using the same deterministic block-glyph model.

# `jayess:font` Module

`jayess:font` provides deterministic font helpers for Jayess canvas rendering. It ships a small readable default 5x7 bitmap font authored in this repository, so text output does not depend on host fonts, browser engines, native text APIs, or third-party font redistribution.

## Surface

- `defaultFont()`
- `createFont(name, glyphs, metrics)`
- `registerFont(font)`
- `getFont(name)`
- `setDefaultFont(name)`
- `loadFont(name, path, options)`
- `systemDefaultFont(options)`
- `registerSystemDefaultFont(name, options)`
- `fontMetrics(font)`
- `measureGlyph(font, char)`
- `measureText(font, text)`
- `lineHeight(font)`
- `charWidth(font, char)`
- `drawText(canvas, font, text, x, y, color)`
- `drawTextAligned(canvas, font, text, bounds, color, options)`

Passing `null` where a font is accepted uses the active default bitmap font. The default font name is `jayess-default-5x7`.

## Font Shape

`createFont(name, glyphs, metrics)` accepts a compact Jayess-owned bitmap shape:

```js
var font = createFont("demo", {
  A: [
    "01110",
    "10001",
    "10001",
    "11111",
    "10001",
    "10001",
    "10001"
  ]
}, {
  charWidth: 5,
  charHeight: 7,
  advance: 6,
  baseline: 6,
  lineHeight: 8
});
```

Glyph rows are strings where `1` means draw a pixel and `0` means leave the pixel untouched. Missing glyphs render with a deterministic `?` fallback.

The bundled `jayess-default-5x7` font covers ASCII digits, uppercase letters, lowercase letters, and common UI punctuation/symbols such as quotes, brackets, braces, `@`, `#`, `$`, `%`, `&`, `*`, comparison signs, slash/backslash, pipe, caret, and tilde.

## Registry

`registerFont(font)` stores a named font in the generated program's font registry. `getFont(name)` returns a registered font and falls back to the current default if the name is not known. `setDefaultFont(name)` changes the default and fails if the name has not been registered.

`loadFont(name, path, options)` reads a deterministic JSON font file with the same glyph and metric fields. It uses Jayess file and JSON helpers, registers the loaded font, and returns it.

`systemDefaultFont(options)` asks the generated C++ runtime to find a platform default font and returns the handle without registering it. `registerSystemDefaultFont(name, options)` registers the discovered handle under `name`. If discovery is disabled, unavailable, unreadable, or invalid, Jayess registers a bitmap alias backed by `jayess-default-5x7` with `fallbackUsed: true` instead of failing ordinary text rendering. See [jayess-system-fonts.md](./jayess-system-fonts.md).

Current system font rendering uses the same deterministic fallback glyph raster path as file-backed vector fonts. Discovery and registry selection are real, but glyph pixels do not yet come from OS font outlines.

`loadFont` also accepts file-backed font containers:

- `.ttf` / TrueType sfnt files with `glyf` outlines
- `.otf` files only when they carry a TrueType-compatible sfnt signature
- `.woff` and `.woff2` wrappers whose declared flavor is TrueType-compatible

The current file-backed slice creates a deterministic vector-font handle with stable metrics, registry selection, and canvas text integration. Glyph painting still uses the repository-owned deterministic bitmap fallback until a real outline rasterizer is implemented. CFF/CFF2-style OpenType outlines are rejected with a focused diagnostic instead of being guessed.

File-backed font handles have this shape:

```js
{
  kind: "vector-font",
  name: "demo",
  family: "Demo",
  sourcePath: "./Demo.ttf",
  sourceFormat: "ttf",
  decodedFormat: "truetype",
  outlineFormat: "glyf",
  compressed: false,
  metricsOnly: true,
  ascent: 6,
  descent: 2,
  charWidth: 5,
  charHeight: 7,
  advance: 6,
  baseline: 6,
  lineHeight: 8,
  glyphCache: {},
  fallbackGlyph: "?",
  fallbackGlyphName: "jayess-default-question"
}
```

System font handles use the same metric fields and add `systemFont`, `platform`, and `fallbackUsed`. Discovered system fonts route through the same file-backed validation path; fallback system fonts route through the existing bitmap registry path.

`metricsOnly: true` is intentional. It marks a loadable font asset whose real outline metrics are not yet derived from the font tables.

The `options` object for file-backed fonts may provide deterministic metrics while real table parsing is still being built: `family`, `charWidth`, `charHeight`, `advance`, `baseline`, `lineHeight`, `ascent`, `descent`, and `fallbackGlyph`.

`fontMetrics(font)` returns the metric fields used by Jayess text helpers. `measureGlyph(font, char)` returns `{ width, height, advance, missing }` for one character, with newline measured as zero advance and one line height.

## File Assets

File-backed fonts passed directly to `loadFont(...)` are runtime input paths. `transpileFile()` does not discover or rewrite arbitrary string paths, so those paths must be readable by the generated executable or library host.

Font files can also be retained as generated project assets by importing them as side-effect dependencies:

```js
import "./fonts/Inter.ttf";
import "./fonts/Inter.woff2";
```

`transpileFile()` copies imported `.ttf`, `.otf`, `.woff`, and `.woff2` assets under `assets/fonts/` inside the target directory. These imports are packaging declarations; they do not automatically rewrite string paths passed to `loadFont(...)`. Generated metadata records copied font assets in `jayess_build_hints.json`, dependency-plan entries, and reachability metadata.

## Diagnostics

File-backed font loading validates only the container headers needed for deterministic format selection and metric-handle creation. Focused diagnostics are emitted for:

- missing or unreadable font files
- unsupported font signatures
- truncated or invalid sfnt table directories
- CFF/CFF2 OpenType outlines
- truncated or inconsistent WOFF compression metadata
- truncated, inconsistent, or transformed WOFF2 table data
- unsupported non-fallback rasterizer requests

No third-party font decoder or rasterizer is bundled in this slice. WOFF handles reconstruct sfnt bytes from the wrapper table directory and support uncompressed table payloads plus zlib stored deflate blocks. Other deflate compression modes emit focused diagnostics. WOFF2 handles use an isolated decoder path for deterministic empty/no-table fixtures and reject non-empty Brotli payloads until a full Brotli-backed table decoder is introduced.

## Vector Painting

File-backed vector-font handles paint through a deterministic grayscale fallback raster path. The current rasterizer uses the repository-owned fallback glyph shapes, applies per-pixel coverage alpha, and routes writes through normal canvas text drawing, clipping, transforms, color, and alpha compositing. It does not yet rasterize actual TrueType outlines from `glyf` tables.

## Canvas Integration

`jayess:canvas` uses the same bitmap data for `text(...)`, `measureText(...)`, and `drawTextBox(...)`. These helpers preserve their existing signatures and accept optional `font` or `fontFamily` fields in their options object:

```js
text(canvas, "Hello", 4, 4, {
  color: rgb(255, 255, 255),
  fontFamily: "demo",
  charHeight: 14
});
```

The canvas layer remains responsible for pixels, clips, transforms, colors, and compositing. Font data and glyph metrics stay in `jayess:font`.

## HTML/CSS

The canvas HTML/CSS renderer supports `font-family` and `font-size` in its focused style subset. `font-family` maps to the same bitmap font registry used by canvas text helpers. Unknown font families fall back to the active default font.

## License Status

The bundled `jayess-default-5x7` glyph data is an original minimal bitmap font authored directly in this repository for Jayess. It is intended to ship with the package without third-party font attribution or redistribution requirements. If future fonts are added from external sources, preserve their license text and origin metadata under `docs/` or beside the font asset.

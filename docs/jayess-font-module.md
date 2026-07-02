# `jayess:font` Module

`jayess:font` provides deterministic font helpers for Jayess canvas rendering. It ships a small readable default 5x7 bitmap font authored in this repository, so text output does not depend on host fonts, browser engines, native text APIs, or third-party font redistribution.

## Surface

- `defaultFont()`
- `createFont(name, glyphs, metrics)`
- `registerFont(font)`
- `getFont(name)`
- `setDefaultFont(name)`
- `loadFont(name, path, options)`
- `packFont(path, options)`
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

Current system font rendering uses the same Jayess-owned TrueType raster path as file-backed vector fonts when the discovered font is TrueType-compatible. Discovery and registry selection are real, but Jayess still does not call OS text APIs.

`loadFont` also accepts file-backed font containers:

- `.ttf` / TrueType sfnt files with `glyf` outlines
- `.otf` files only when they carry a TrueType-compatible sfnt signature
- `.woff` and `.woff2` wrappers whose declared flavor is TrueType-compatible

The current file-backed slice creates a deterministic vector-font handle with stable metrics, registry selection, and canvas text integration. TrueType `glyf` outlines are rasterized by the generated C++ runtime into cached bitmap rows for canvas text. CFF/CFF2-style OpenType outlines are rejected with a focused diagnostic instead of being guessed.

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
  metricsOnly: false,
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

`metricsOnly: false` marks a rasterizable TrueType-backed handle. `metricsOnly: true` is still used for formats whose outlines cannot currently be rasterized, such as non-empty WOFF2 or CFF-backed OpenType.

The `options` object for file-backed fonts may provide deterministic layout metrics around the rasterized glyph cell: `family`, `charWidth`, `charHeight`, `advance`, `baseline`, `lineHeight`, `ascent`, `descent`, and `fallbackGlyph`.

`fontMetrics(font)` returns the metric fields used by Jayess text helpers. `measureGlyph(font, char)` returns `{ width, height, advance, missing }` for one character, with newline measured as zero advance and one line height.

## File Assets

File-backed fonts passed directly to `loadFont(...)` are runtime input paths. `transpileFile()` does not discover or rewrite arbitrary string paths, so those paths must be readable by the generated executable or library host.

`packFont(path, options)` is the compile-time packaging form for bundled fonts:

```js
import { packFont, registerFont } from "jayess:font";

registerFont(packFont("./fonts/Inter.ttf", {
  name: "Inter",
  family: "Inter"
}));
```

The source `path` must be a relative `.ttf`, `.otf`, `.woff`, or `.woff2` path. During transpilation, Jayess copies the file under `assets/fonts/` in the generated project and lowers the call to a packed vector-font handle with `sourcePath` pointing at that generated asset. The handle can be registered and selected by canvas `font-family` immediately.

`packFont` does not currently embed multi-megabyte font bytes into generated C++ source. It copies the font into the generated project and uses the same TrueType rasterizer as file-backed `loadFont(...)` when the font has `glyf` outlines. Packed `.otf` files are treated as TrueType-capable handles and render when their sfnt tables contain `glyf` outlines; CFF/CFF2-backed OTF files still emit focused diagnostics instead of guessed pixels. Unless you are deliberately tuning layout, leave `charWidth`, `charHeight`, `advance`, and `lineHeight` unset so `font-size` scales the rasterized glyph grid consistently.

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
- unsupported outline/rasterizer combinations

No third-party font decoder or rasterizer is bundled in this slice. The generated C++ runtime contains a small Jayess-owned TrueType parser for `cmap`, `head`, `maxp`, `loca`, and `glyf`, including simple and composite glyphs. WOFF handles reconstruct sfnt bytes from the wrapper table directory and support uncompressed table payloads plus zlib stored deflate blocks. Other deflate compression modes emit focused diagnostics. WOFF2 handles use an isolated decoder path for deterministic empty/no-table fixtures and reject non-empty Brotli payloads until a full Brotli-backed table decoder is introduced.

## Vector Painting

File-backed vector-font handles paint through a deterministic TrueType raster path when `decodedFormat` is `truetype` and `metricsOnly` is `false`. Glyph outlines are flattened, supersampled into alpha bitmap rows, lightly strengthened at small UI sizes to preserve thin strokes, cached on the font handle, and then routed through normal canvas text drawing, clipping, transforms, color, and alpha compositing. The rasterizer does not yet implement kerning, OpenType shaping, hinting, CFF/CFF2 outlines, or Brotli-backed WOFF2 table reconstruction.

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

## Canvas Scene Text

Canvas text helpers and the planned XML scene renderer use `font-family` and `font-size` style data to select registered bitmap or file-backed fonts. Unknown font families fall back to the active default font.

## License Status

The bundled `jayess-default-5x7` glyph data is an original minimal bitmap font authored directly in this repository for Jayess. It is intended to ship with the package without third-party font attribution or redistribution requirements. If future fonts are added from external sources, preserve their license text and origin metadata under `docs/` or beside the font asset.

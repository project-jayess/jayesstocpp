# `jayess:canvas` Module

`jayess:canvas` is the 2D drawing and portable document-rendering module for Jayess. The current implementation draws into software `jayess:image` buffers and can write deterministic PPM output without a live window system.

Live screen presentation belongs in `jayess:window`; `jayess:canvas` stays focused on portable off-screen drawing. Focused HTML/CSS rendering also belongs in `jayess:canvas`, because it is a deterministic rendering problem over image, font, layout, color, and drawing primitives. `jayess:gui` can then consume canvas-rendered documents for interaction and window presentation.

## First Surface

- `create(width, height, options)`
- `clear(canvas, color)`
- `width(canvas)`
- `height(canvas)`
- `getPixel(canvas, x, y)`
- `copy(canvas)`
- `saveState(canvas)`
- `restoreState(canvas)`
- `setFillColor(canvas, color)`
- `setStrokeColor(canvas, color)`
- `setStrokeWidth(canvas, width)`
- `setTextColor(canvas, color)`
- `setTextSize(canvas, size)`
- `translate(canvas, x, y)`
- `scale(canvas, x, y)`
- `fillRect(canvas, x, y, width, height, color)`
- `clipRect(canvas, x, y, width, height)`
- `currentClip(canvas)`
- `pushClip(canvas, x, y, width, height)`
- `popClip(canvas)`
- `fillRectClipped(canvas, x, y, width, height, color, clip)`
- `fillRectAlpha(canvas, x, y, width, height, color)`
- `strokeRect(canvas, x, y, width, height, color, options?)`
- `drawImage(canvas, image, x, y)`
- `drawImageClipped(canvas, image, x, y, clip)`
- `drawCanvas(target, source, x, y)`
- `fillCircle(canvas, centerX, centerY, radius, color)`
- `strokeCircle(canvas, centerX, centerY, radius, color, options?)`
- `fillEllipse(canvas, centerX, centerY, radiusX, radiusY, color)`
- `strokeEllipse(canvas, centerX, centerY, radiusX, radiusY, color, options?)`
- `line(canvas, x1, y1, x2, y2, color, options?)`
- `polyline(canvas, points, color, options?)`
- `quadraticCurve(canvas, x1, y1, controlX, controlY, x2, y2, color, options)`
- `bezierCurve(canvas, x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, options)`
- `fillPolygon(canvas, points, color)`
- `strokePolygon(canvas, points, color, options?)`
- `measureText(canvas, text, options)`
- `text(canvas, text, x, y, options)`
- `drawTextBox(canvas, text, rect, options)`
- `savePpm(canvas, path)`
- `saveImage(canvas, path)`

`create` accepts an optional `options` object. Supported first-slice fields are:

- `background`: a `jayess:color` value
- `title`: metadata stored on the canvas object

The current stroke-style slice adds one focused optional field on stroke-oriented helpers:

- `strokeWidth`: integer width, at least `1`

The current drawing-state slice also provides canvas-local defaults. Passing `null` for fill or stroke colors uses the active fill/stroke state, and text helpers use active text color/size unless the options object overrides them.

Canvas drawing helpers use one explicit compositing rule: partially transparent source colors use deterministic source-over blending against the current destination pixel. Fully opaque colors overwrite the destination pixel directly.

## Role

This module provides higher-level drawing over `jayess:image` buffers. It owns canvas creation, canvas-local metadata such as `title`, pixel reads through the canvas wrapper, clipped image/canvas placement, stroke/fill-style shape drawing, and the small deterministic text convenience layer.

`jayess:image` still owns the underlying raster buffer mechanics:

- low-level pixel writes and direct pixel mutation
- deterministic image file formats and bytes encode/decode helpers
- image-to-image bulk rectangle writes and alpha rectangle writes
- crop, subimage, resize, rotate, flip, and image-to-image blit helpers

`jayess:canvas` should reuse those lower-level image helpers where practical, but it should not collapse back into a generic image-manipulation module. Canvas exists to add higher-level drawing semantics over an image buffer, not to duplicate the full `jayess:image` surface.

`polyline` expects point objects shaped as `{ x, y }`. Invalid canvases, invalid points, negative circle radii, `popClip()` without an active clip, `restoreState()` without a saved state, and zero scale factors raise focused Jayess diagnostics.

Live native window presentation is exposed through the focused `jayess:window` module instead of being mixed into this module.

Bitmap text measurement and rendering belong to `jayess:font` for full bitmap glyph data. The `text` and `measureText` canvas helpers provide a small deterministic block-glyph convenience surface without importing `jayess:font`, so the standard library keeps a one-way dependency from font to canvas.

`drawTextBox(canvas, text, rect, options)` wraps text inside `{ x, y, width, height }` and supports `horizontal` values `left`, `center`, and `right`, plus `vertical` values `top`, `middle`, and `bottom`.

`saveImage(canvas, path)` is a stable generic alias over the currently supported deterministic image output path.

## Edge Cases

- `drawPixel`-style canvas writes ignore out-of-bounds coordinates instead of failing.
- `drawImage(...)` and `drawImageClipped(...)` ignore destination pixels that fall outside the canvas bounds.
- `drawImageClipped(...)` additionally intersects the requested clip rectangle with the active clip-stack region; `drawImage(...)` uses the active clip stack through normal pixel writes.
- `fillRectClipped(...)` uses the active clip stack only through the resolved clip region it computes for that call.
- `fillRect(...)`, image placement, shape fills, shape strokes, curves, polygons, and text route their pixel writes through the active clip stack and active translate/scale state.
- Partially transparent colors use deterministic source-over blending against the current destination pixel; fully opaque colors overwrite directly.
- `text(...)` and `drawTextBox(...)` use deterministic block-glyph drawing with no kerning, shaping, font fallback, or platform text APIs.
- `drawTextBox(...)` wraps by fixed character-cell width derived from `charWidth`, `spacing`, and the target rectangle width; it does not do word-aware wrapping.
- `savePpm(...)` and `saveImage(...)` keep deterministic software-rendered output and do not depend on live windows or GPU presentation.

## Current Boundary

Use `jayess:image` when the task is really about manipulating an image buffer as data:

- direct save/load and bytes transport
- crop, subimage, resize, rotate, and flip
- image-to-image blit and transparent blit
- image-level rectangle fills

Use `jayess:canvas` when the task is really about drawing commands:

- shapes, curves, polygons, and text
- image placement into a drawing surface
- clip-aware drawing helpers
- canvas-local convenience wrappers over the backing image buffer

This split is intentional. It keeps `jayess:image` as the deterministic raster primitive layer and `jayess:canvas` as the drawing layer above it.

## Compositing Rule

The current canvas compositing rule is explicit and narrow:

- ordinary drawing helpers such as `fillRect(...)`, `drawImage(...)`, `drawImageClipped(...)`, line/curve helpers, and shape fill/stroke helpers use deterministic source-over blending when the source color has `alpha < 1`
- fully opaque source colors overwrite the destination pixel directly
- `fillRectAlpha(...)` remains available as the explicit rectangle-oriented helper, but it follows the same source-over rule rather than a different blend policy
- `clear(...)` still behaves as a full image clear through `jayess:image`, not as an incremental draw command, and uses the active fill color only when its explicit color argument is `null`

## Stroke Width

The current stroke-style slice is `strokeWidth` only.

Supported helpers:

- `line(...)`
- `polyline(...)`
- `strokeRect(...)`
- `strokeCircle(...)`
- `strokeEllipse(...)`
- `quadraticCurve(...)`
- `bezierCurve(...)`
- `strokePolygon(...)`

The current implementation uses a deterministic square brush centered on each stroked sample point. That keeps the behavior portable and reviewable without adding line-cap or line-join policy yet.

`strokeWidth` must be at least `1`. Line caps and joins remain out of this slice.

## Drawing State And Clip Stack

The current canvas state slice includes a clip stack, saved drawing state, style defaults, and a first translate/scale transform:

- `pushClip(canvas, x, y, width, height)` intersects the requested rectangle with the current active clip and pushes the result
- `currentClip(canvas)` returns the current active clip region
- `popClip(canvas)` restores the previous active clip and fails if no clip is active
- `saveState(canvas)` saves fill color, stroke color, stroke width, text color, text size, transform values, and the current clip stack
- `restoreState(canvas)` restores the last saved drawing state and fails if no saved state exists
- `setFillColor(canvas, color)` updates the active fill default
- `setStrokeColor(canvas, color)` updates the active stroke default
- `setStrokeWidth(canvas, width)` updates the active stroke width and requires a value of at least `1`
- `setTextColor(canvas, color)` updates the active text default
- `setTextSize(canvas, size)` updates the active block-glyph text size and requires a value of at least `1`
- `translate(canvas, x, y)` offsets later drawing commands
- `scale(canvas, x, y)` scales later drawing commands and rejects zero scale values

The first transform behavior is deliberately simple: draw coordinates are mapped through active scale and translation before pixel writes. The implementation favors deterministic software output over browser-canvas compatibility.

## HTML And CSS Rendering Direction

`jayess:canvas` should own the first Jayess HTML/CSS renderer. This renderer is not a browser engine and does not expose a DOM, JavaScript execution in HTML, network loading, CSS animations, or full web compatibility.

The shipped first surface is documented in [jayess-canvas-html-css.md](./jayess-canvas-html-css.md).

The first renderer should stay focused:

- parse a small HTML element subset into a plain render tree
- parse a small CSS subset into deterministic style rules
- resolve element, class, id, simple descendant, and inline-style selectors
- compute simple block/inline-ish layout with margin and padding shorthand, border width, min/max size constraints, overflow clipping metadata, content bounds, disabled-state metadata, and wrapped text-line metadata
- draw backgrounds, borders, wrapped text, and explicit image handles through existing canvas/image/font helpers
- hit-test computed document layout boxes and return stable render-target metadata for GUI use
- produce the same pixels in off-screen tests and live windows

`jayess:gui` should build on this canvas-owned renderer when it needs interactive HTML/CSS surfaces. GUI remains responsible for window state, focus, hit testing, normalized `jayess:window` event routing, invalidation, action queues, and presentation through `jayess:window`.

## Cross-platform Windowing

Live window support should be cross-platform, but not by mixing every host API into one large file or into `jayess:canvas`. Use focused platform adapters for Windows, macOS, and Linux when required.

Software rendering and image output work without external GUI libraries. Window presentation uses platform-specific native adapters or a later explicit backend module. The Linux/X11 `jayess:window` adapter can present the validated software pixel buffer produced by this module without moving native window code into `jayess:canvas`.

## Implementation Direction

Drawing helpers are Jayess-written wrappers over `jayess:image`. Keep live window creation, event polling, and frame presentation in separate focused `jayess:window` slices. Keep canvas drawing state inside `jayess:canvas`; do not move that state down into `jayess:image`.

`stdlib/jayess/canvas/index.js` remains the public drawing surface. Small focused helpers live beside it, including polygon helpers, scalar helpers, drawing state, HTML parsing, CSS parsing, style resolution, layout, paint, and hit testing. Keep additional canvas internals in sibling files instead of growing the public index file with unrelated support logic.

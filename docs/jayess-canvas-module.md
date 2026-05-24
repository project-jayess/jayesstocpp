# `jayess:canvas` Module

`jayess:canvas` is the 2D drawing module for Jayess. The current implementation draws into software `jayess:image` buffers and can write deterministic PPM output without a live window system.

Live screen presentation belongs in `jayess:window`; `jayess:canvas` stays focused on portable off-screen drawing.

## First Surface

- `create(width, height, options)`
- `clear(canvas, color)`
- `width(canvas)`
- `height(canvas)`
- `getPixel(canvas, x, y)`
- `copy(canvas)`
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

Canvas drawing helpers use one explicit compositing rule: partially transparent source colors use deterministic source-over blending against the current destination pixel. Fully opaque colors overwrite the destination pixel directly.

## Role

This module provides higher-level drawing over `jayess:image` buffers. It owns canvas creation, canvas-local metadata such as `title`, pixel reads through the canvas wrapper, clipped image/canvas placement, stroke/fill-style shape drawing, and the small deterministic text convenience layer.

`jayess:image` still owns the underlying raster buffer mechanics:

- low-level pixel writes and direct pixel mutation
- deterministic image file formats and bytes encode/decode helpers
- image-to-image bulk rectangle writes and alpha rectangle writes
- crop, subimage, resize, rotate, flip, and image-to-image blit helpers

`jayess:canvas` should reuse those lower-level image helpers where practical, but it should not collapse back into a generic image-manipulation module. Canvas exists to add higher-level drawing semantics over an image buffer, not to duplicate the full `jayess:image` surface.

`polyline` expects point objects shaped as `{ x, y }`. Invalid canvases, invalid points, negative circle radii, and `popClip()` without an active clip raise focused Jayess diagnostics.

Live native window presentation is exposed through the focused `jayess:window` module instead of being mixed into this module.

Bitmap text measurement and rendering belong to `jayess:font` for full bitmap glyph data. The `text` and `measureText` canvas helpers provide a small deterministic block-glyph convenience surface without importing `jayess:font`, so the standard library keeps a one-way dependency from font to canvas.

`drawTextBox(canvas, text, rect, options)` wraps text inside `{ x, y, width, height }` and supports `horizontal` values `left`, `center`, and `right`, plus `vertical` values `top`, `middle`, and `bottom`.

`saveImage(canvas, path)` is a stable generic alias over the currently supported deterministic image output path.

## Edge Cases

- `drawPixel`-style canvas writes ignore out-of-bounds coordinates instead of failing.
- `drawImage(...)` and `drawImageClipped(...)` ignore destination pixels that fall outside the canvas bounds.
- `drawImageClipped(...)` additionally intersects the requested clip rectangle with the active clip-stack region; `drawImage(...)` does not use the clip stack.
- `fillRectClipped(...)` uses the active clip stack only through the resolved clip region it computes for that call.
- `fillRect(...)`, shape fills, shape strokes, curves, and polygon helpers do not implicitly adopt the clip stack unless they are routed through a clip-aware helper explicitly.
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
- `clear(...)` still behaves as a full image clear through `jayess:image`, not as an incremental draw command

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

## Clip Stack

The current canvas state slice is a focused clip stack:

- `pushClip(canvas, x, y, width, height)` intersects the requested rectangle with the current active clip and pushes the result
- `currentClip(canvas)` returns the current active clip region
- `popClip(canvas)` restores the previous active clip and fails if no clip is active

This first slice intentionally affects only the clip-aware drawing helpers:

- `clipRect(...)`
- `fillRectClipped(...)`
- `drawImageClipped(...)`

Ordinary non-clipped helpers such as `fillRect(...)`, `drawImage(...)`, `line(...)`, and shape drawing do not automatically adopt the clip stack yet. That broader state propagation stays for later canvas slices.

## Next Approved State Slice

The current approved canvas state work is the **clip stack** slice above. Transform stacks and broader draw-state save/restore remain later separate slices.

## Cross-platform Windowing

Live window support should be cross-platform, but not by mixing every host API into one large file or into `jayess:canvas`. Use focused platform adapters for Windows, macOS, and Linux when required.

Software rendering and image output work without external GUI libraries. Window presentation uses platform-specific native adapters or a later explicit backend module. The Linux/X11 `jayess:window` adapter can present the validated software pixel buffer produced by this module without moving native window code into `jayess:canvas`.

## Implementation Direction

Drawing helpers are Jayess-written wrappers over `jayess:image`. Keep live window creation, event polling, and frame presentation in separate focused `jayess:window` slices. Keep future clip-state helpers inside `jayess:canvas`; do not move that state down into `jayess:image`.

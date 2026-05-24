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
- `fillRectClipped(canvas, x, y, width, height, color, clip)`
- `fillRectAlpha(canvas, x, y, width, height, color)`
- `strokeRect(canvas, x, y, width, height, color)`
- `drawImage(canvas, image, x, y)`
- `drawImageClipped(canvas, image, x, y, clip)`
- `drawCanvas(target, source, x, y)`
- `fillCircle(canvas, centerX, centerY, radius, color)`
- `strokeCircle(canvas, centerX, centerY, radius, color)`
- `fillEllipse(canvas, centerX, centerY, radiusX, radiusY, color)`
- `strokeEllipse(canvas, centerX, centerY, radiusX, radiusY, color)`
- `line(canvas, x1, y1, x2, y2, color)`
- `polyline(canvas, points, color)`
- `quadraticCurve(canvas, x1, y1, controlX, controlY, x2, y2, color, options)`
- `bezierCurve(canvas, x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, options)`
- `fillPolygon(canvas, points, color)`
- `strokePolygon(canvas, points, color)`
- `measureText(canvas, text, options)`
- `text(canvas, text, x, y, options)`
- `drawTextBox(canvas, text, rect, options)`
- `savePpm(canvas, path)`
- `saveImage(canvas, path)`

`create` accepts an optional `options` object. Supported first-slice fields are:

- `background`: a `jayess:color` value
- `title`: metadata stored on the canvas object

## Role

This module provides higher-level drawing over `jayess:image` buffers. It owns dimensions, pixel reads, deep copies, clipped image/canvas blits, rectangles, alpha rectangle blending, circles, ellipses, lines, polylines, curves, polygons, and small deterministic text convenience drawing. Lower-level image file formats, crop, resize, and image-to-image blitting belong to `jayess:image`.

`polyline` expects point objects shaped as `{ x, y }`. Invalid canvases, invalid points, and negative circle radii raise focused Jayess diagnostics.

Live native window presentation is exposed through the focused `jayess:window` module instead of being mixed into this module.

Bitmap text measurement and rendering belong to `jayess:font` for full bitmap glyph data. The `text` and `measureText` canvas helpers provide a small deterministic block-glyph convenience surface without importing `jayess:font`, so the standard library keeps a one-way dependency from font to canvas.

`drawTextBox(canvas, text, rect, options)` wraps text inside `{ x, y, width, height }` and supports `horizontal` values `left`, `center`, and `right`, plus `vertical` values `top`, `middle`, and `bottom`.

`saveImage(canvas, path)` is a stable generic alias over the currently supported deterministic image output path.

## Cross-platform Windowing

Live window support should be cross-platform, but not by mixing every host API into one large file or into `jayess:canvas`. Use focused platform adapters for Windows, macOS, and Linux when required.

Software rendering and image output work without external GUI libraries. Window presentation uses platform-specific native adapters or a later explicit backend module. The Linux/X11 `jayess:window` adapter can present the validated software pixel buffer produced by this module without moving native window code into `jayess:canvas`.

## Implementation Direction

Drawing helpers are Jayess-written wrappers over `jayess:image`. Keep live window creation, event polling, and frame presentation in separate focused `jayess:window` slices.

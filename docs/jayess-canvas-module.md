# `jayess:canvas` Module

`jayess:canvas` is the 2D drawing and portable scene-rendering module for Jayess. The current implementation draws into software `jayess:image` buffers and can write deterministic PPM output without a live window system.

Live screen presentation belongs in `jayess:window`; `jayess:canvas` stays focused on portable off-screen drawing. HTML/CSS rendering is being removed from this module direction. The replacement document/rendering surface is a deterministic XML scene model over image, font, layout, color, and drawing primitives. There is no shipped `jayess:gui` standard-library module for now.

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
- `drawPixel(canvas, x, y, color)`
- `drawLine(canvas, x1, y1, x2, y2, color, options?)`
- `drawRect(canvas, x, y, width, height, color, options?)`
- `fillRect(canvas, x, y, width, height, color)`
- `clipRect(canvas, x, y, width, height)`
- `currentClip(canvas)`
- `pushClip(canvas, x, y, width, height)`
- `popClip(canvas)`
- `fillRectClipped(canvas, x, y, width, height, color, clip)`
- `fillRectAlpha(canvas, x, y, width, height, color)`
- `drawEllipse(canvas, x, y, width, height, color, options?)`
- `fillEllipse(canvas, x, y, width, height, color)`
- `drawSemiellipse(canvas, x, y, width, height, color, options?)`
- `fillSemiellipse(canvas, x, y, width, height, color, options?)`
- `drawTriangle(canvas, points, color, options?)`
- `fillTriangle(canvas, points, color)`
- `drawCapsule(canvas, x, y, width, height, color, options?)`
- `fillCapsule(canvas, x, y, width, height, color)`
- `drawPolyline(canvas, points, color, options?)`
- `drawPolygon(canvas, points, color, options?)`
- `fillPolygon(canvas, points, color)`
- `drawImage(canvas, image, x, y)`
- `drawImageClipped(canvas, image, x, y, clip)`
- `drawCanvas(target, source, x, y)`
- `quadraticCurve(canvas, x1, y1, controlX, controlY, x2, y2, color, options)`
- `bezierCurve(canvas, x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, options)`
- `measureText(canvas, text, options)`
- `text(canvas, text, x, y, options)`
- `drawTextBox(canvas, text, rect, options)`
- `parseScene(xmlText, options?)`
- `drawScene(canvas, scene)`
- `renderScene(xmlText, options?)`
- `findElement(canvas, id)`
- `setAttribute(canvas, id, name, value)`
- `setAttributes(canvas, id, attributes)`
- `hitElement(canvas, x, y)`
- `hitElements(canvas, x, y)`
- `addEventListener(canvas, name, callback)`
- `dispatchEvent(canvas, event)`
- `requestedBackend(canvas)`
- `actualBackend(canvas)`
- `renderStats(canvas)`
- `packXml(path)`
- `packImage(path)`
- `savePpm(canvas, path)`
- `saveImage(canvas, path)`

`create` accepts an optional `options` object. Supported first-slice fields are:

- `background`: a `jayess:color` value
- `title`: metadata stored on the canvas object
- `backend`: `"auto"`, `"cpu"`, or `"gpu"`; defaults to `"auto"`

`backend: "auto"` currently selects the portable CPU renderer and records that fallback through `actualBackend(canvas)`. `backend: "cpu"` selects the same renderer explicitly. `backend: "gpu"` is reserved for the future GPU XML scene renderer and currently raises a focused diagnostic instead of silently using an incomplete path. This keeps `jayess:canvas` dependency-free from `jayess:gpu` while still giving apps a stable backend-selection surface. `renderStats(canvas)` returns lightweight counters for manual probes: `{ fullRedraws, dirtyRegionRedraws, copyRectScrolls, cachePresents }`.

The current stroke-style slice adds one focused optional field on stroke-oriented helpers:

- `strokeWidth`: integer width, at least `1`

The current drawing-state slice also provides canvas-local defaults. Passing `null` for fill or stroke colors uses the active fill/stroke state, and text helpers use active text color/size unless the options object overrides them.

Canvas drawing helpers use one explicit compositing rule: partially transparent source colors use deterministic source-over blending against the current destination pixel. Fully opaque colors overwrite the destination pixel directly.

Ellipse and capsule primitives use pixel-center coverage over their requested bounding boxes. This avoids single-pixel point artifacts at ellipse extrema and keeps `drawCapsule` outlines as one continuous capsule boundary rather than a rectangle outline plus two ellipse outlines.

`packXml("./scene.xml")` embeds a static relative XML file into generated C++ as a string at transpile time. `packImage("./icon.png")` embeds a static relative image file into generated C++ as encoded bytes and returns a decoded image object at runtime. The current image-packing slice supports `.ppm`, `.pgm`, `.bmp`, `.png`, `.jpeg`, `.jpg`, `.psd`, `.gif`, and `.webp`. The external decoder boundary is documented in [jayess-image-decoder-externals.md](./jayess-image-decoder-externals.md).

## Runtime XML Updates

Canvases returned by `renderScene(xmlText, options?)` keep the normalized XML scene tree attached to the canvas object. `setAttribute(canvas, id, name, value)` updates one existing XML element attribute by `id`, computes the old and new render bounds for that element, clears that dirty rectangle, clips drawing to the dirty rectangle, and redraws only scene elements whose render bounds intersect it. A later `window.renderCanvas(canvas)` or `window.requestRender(canvas)` presents the updated pixels. Use `setAttributes(canvas, id, attributes)` when an event changes more than one attribute; it applies all attributes and redraws once.

Visual XML shapes can also render inner text labels. Use child text for readable markup, or update the same value at runtime with `setAttribute(canvas, id, "text", "New label")`. Label styling uses `padding`, `font-color`, `font-family`, `font-size`, `line-height`, `letter-spacing`, `word-spacing`, `text-transform`, `text-decoration`, `text-overflow`, `text-wrap`, `text-select`, `text-select-color`, `mouse-select`, `mouse-select-color`, `overflow`, `overflow-x`, `overflow-y`, `scrollbar-width`, and `scrollbar-color`; these can also be changed with `setAttribute` or `setAttributes`. `font-color` affects only the label text, while `fill` still controls the shape body. `text-select="start end"` highlights a character range in the rendered label text, and `text-select="none"` clears it. `mouse-select="true"` lets canvas pointer events update the selection range by dragging, and `selectedText(canvas)` returns the current selected text for app-managed clipboard shortcuts. `measureTextBox(canvas, text, rect, options)` returns the wrapped content width, height, line list, line widths, and line height used by `drawTextBox` and XML scrollbar decisions.

The first responsive XML layout slice supports `position="relative|absolute|fixed"`, `left`, `top`, `right`, `bottom`, percentage `width` / `height`, `min-width`, `max-width`, `min-height`, `max-height`, parent `layout="none|row|column"`, `gap`, `padding`, `align`, `justify`, and child `grow`, `shrink`, and `basis`. Root scenes and parent elements default to `layout="column"`, and child elements default to `position="relative"`. Explicit-coordinate scenes should use `layout="none"` on the parent and `position="absolute"` on children that should honor `x`, `y`, `xy`, `left`, `top`, `right`, or `bottom`.

This first CPU update path is intentionally dirty-rectangle based instead of cached transparent element layers. It avoids full-scene redraw for common hover/state changes while avoiding the black-box artifact risk from alpha-compositing cached layers. Future cache slices should keep the same dirty-region contract and add artifact-free caches for expensive shadows, text, and image decodes.

Paint-only runtime updates such as `fill`, `outline`, and `opacity` use paint bounds instead of full shadow bounds. The changed element's existing shadow is not regenerated or repainted for those updates. XML shadows are cached by geometry and shadow style, so repeated dirty redraws reuse the blurred shadow bitmap when geometry and shadow attributes are unchanged. Clipped alpha image draws use a native clipped span path rather than the slower per-pixel JavaScript clipping path.

The first mutable attributes are focused on common app state updates: `fill`, `outline`, `outline-thickness`, `opacity`, `visible`, `x`, `y`, `width`, `height`, `z`, `text`, and `src`. Unknown IDs or unsupported attributes raise focused Jayess diagnostics.

`hitElement(canvas, x, y)` returns the topmost visible XML element with an `id` at the given canvas coordinate, using z-order plus shape-aware geometry for ellipses, capsules, triangles, and polygons instead of only rectangular bounds. `hitElements(canvas, x, y)` returns every visible ID-bearing element at that coordinate, ordered topmost first. Both helpers are intentionally simple and deterministic for the first slice.

Canvas event helpers derive element-level pointer events from window events:

```js
import {
  addEventListener,
  dispatchEvent,
  renderScene,
  setAttributes
} from "jayess:canvas";
import { create } from "jayess:window";

export function main() {
  var window = create({ title: "Canvas", width: 320, height: 180 });
  var canvas = renderScene("<scene width=\"320\" height=\"180\"><ellipse id=\"target\" x=\"20\" y=\"20\" width=\"80\" height=\"48\" fill=\"#3366ff\" /></scene>", null);

  addEventListener(canvas, "mouseover", function (event) {
    setAttributes(canvas, event.targetId, {
      fill: "#ff0000",
      outline: "#111111"
    });
    window.renderCanvas(canvas);
  });

  addEventListener(canvas, "mouseout", function (event) {
    setAttributes(canvas, event.targetId, {
      fill: "#3366ff",
      outline: "none"
    });
    window.renderCanvas(canvas);
  });

  window.addEventListener("mouseMove", function (event) {
    dispatchEvent(canvas, event);
  });

  window.renderCanvas(canvas);
  window.run();
  return 0;
}
```

`dispatchEvent(canvas, event)` currently derives `mouseover` and `mouseout` from `mouseMove` events, button state changes from pointer events, scroll changes from wheel and scrollbar drag events, and `textselect` events for XML elements with `mouse-select="true"`. Keyboard focus, text input routing, creation of new UI elements, and higher-level controls remain later work.

## Role

This module provides higher-level drawing over `jayess:image` buffers. It owns canvas creation, canvas-local metadata such as `title`, pixel reads through the canvas wrapper, clipped image/canvas placement, stroke/fill-style shape drawing, and the small deterministic text convenience layer.

`jayess:image` still owns the underlying raster buffer mechanics:

- low-level pixel writes and direct pixel mutation
- deterministic image file formats and bytes encode/decode helpers
- image-to-image bulk rectangle writes and alpha rectangle writes
- crop, subimage, resize, rotate, flip, and image-to-image blit helpers

`jayess:canvas` should reuse those lower-level image helpers where practical, but it should not collapse back into a generic image-manipulation module. Canvas exists to add higher-level drawing semantics over an image buffer, not to duplicate the full `jayess:image` surface.

Point-based drawing helpers expect point objects shaped as `{ x, y }`. XML scene point attributes use tuple syntax such as `points="(10,10), (30,20)"` and are resolved relative to the element's resolved `x` and `y`. XML elements may use `xy="(10,20)"` as a convenience alias for `x="10"` plus `y="20"`, and `w="40"` / `h="20"` as aliases for `width="40"` / `height="20"`. Runtime updates may call `setAttribute(canvas, id, "xy", "(10,20)")`, `setAttribute(canvas, id, "w", "40")`, or `setAttribute(canvas, id, "h", "20")` to update those normalized fields. XML `outline-opacity` controls only outline/stroke alpha and can also be updated at runtime with `setAttribute(canvas, id, "outline-opacity", "0.5")`. Shape label attributes `text`, `padding`, `font-color`, `font-family`, `font-size`, line/spacing attributes, text overflow/wrap attributes, `text-select`, `text-select-color`, `mouse-select`, `mouse-select-color`, and scrollbar attributes are also runtime-mutable. Invalid canvases, invalid points, negative dimensions, `popClip()` without an active clip, `restoreState()` without a saved state, and zero scale factors raise focused Jayess diagnostics.

Live native window presentation is exposed through the focused `jayess:window` module instead of being mixed into this module.

Text measurement and rendering use the font registry owned by `jayess:font`. The `text`, `measureText`, and `drawTextBox` canvas helpers preserve their existing signatures and accept optional `font` or `fontFamily` fields for selecting a registered bitmap font, file-backed TrueType vector-font handle, packaged font, or registered system default font handle. `fontSize` is accepted as an alias for the existing `textSize` option, and `charHeight`, `charWidth`, `advance`, and `lineHeight` can still override the deterministic metrics for focused layout cases. XML scene `<text>` should use the same font selection behavior.

`drawTextBox(canvas, text, rect, options)` wraps text inside `{ x, y, width, height }` and supports `horizontal` values `left`, `center`, and `right`, plus `vertical` values `top`, `middle`, and `bottom`.

`saveImage(canvas, path)` is a stable generic alias over the currently supported deterministic image output path.

## Edge Cases

- `drawPixel`-style canvas writes ignore out-of-bounds coordinates instead of failing.
- `drawImage(...)` and `drawImageClipped(...)` ignore destination pixels that fall outside the canvas bounds.
- `drawImageClipped(...)` additionally intersects the requested clip rectangle with the active clip-stack region; `drawImage(...)` uses the active clip stack through normal pixel writes.
- `fillRectClipped(...)` uses the active clip stack only through the resolved clip region it computes for that call.
- `fillRect(...)`, image placement, shape fills, shape outlines, curves, polygons, and text route their pixel writes through the active clip stack and active translate/scale state.
- Partially transparent colors use deterministic source-over blending against the current destination pixel; fully opaque colors overwrite directly.
- `text(...)` and `drawTextBox(...)` use deterministic font drawing with no kerning, shaping, or platform text APIs. TrueType-backed file, packaged, and discovered system font handles rasterize `glyf` outlines through the Jayess-owned runtime. CFF/CFF2 and non-empty WOFF2 still fall back or fail with focused diagnostics. If system discovery fails, registered system font aliases render with `jayess-default-5x7`.
- `drawTextBox(...)` wraps by fixed bitmap-font advance derived from the selected font, optional `charWidth` / `spacing`, and the target rectangle width; it does not do word-aware wrapping.
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

- ordinary drawing helpers such as `fillRect(...)`, `drawImage(...)`, `drawImageClipped(...)`, line/curve helpers, and shape fill/outline helpers use deterministic source-over blending when the source color has `alpha < 1`
- fully opaque source colors overwrite the destination pixel directly
- `fillRectAlpha(...)` remains available as the explicit rectangle-oriented helper, but it follows the same source-over rule rather than a different blend policy
- `clear(...)` still behaves as a full image clear through `jayess:image`, not as an incremental draw command, and uses the active fill color only when its explicit color argument is `null`

## Stroke Width

The current stroke-style slice is `strokeWidth` only.

Supported helpers:

- `drawLine(...)`
- `drawPolyline(...)`
- `drawRect(...)`
- `drawEllipse(...)`
- `drawSemiellipse(...)`
- `drawCapsule(...)`
- `drawPolygon(...)`
- `quadraticCurve(...)`
- `bezierCurve(...)`

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
- `setTextSize(canvas, size)` updates the active bitmap text size and requires a value of at least `1`
- `translate(canvas, x, y)` offsets later drawing commands
- `scale(canvas, x, y)` scales later drawing commands and rejects zero scale values

The first transform behavior is deliberately simple: draw coordinates are mapped through active scale and translation before pixel writes. The implementation favors deterministic software output over browser-canvas compatibility.

## XML Scene Rendering Direction

`jayess:canvas` should own the first Jayess XML scene renderer. This renderer is not a browser engine and does not expose HTML, CSS selectors, a DOM, JavaScript execution in markup, network loading, animations, or full web compatibility.

The planned first surface is documented in [jayess-canvas-xml-scenes.md](./jayess-canvas-xml-scenes.md). The current primitive API cleanup boundary is documented in [canvas-primitive-api-audit.md](./canvas-primitive-api-audit.md).

The first renderer should stay focused:

- parse XML scene text through `jayess:xml`
- normalize shape elements such as `<rectangle>`, `<ellipse>`, `<semiellipse>`, `<triangle>`, `<capsule>`, `<line>`, `<pixel>`, `<polygon>`, `<polyline>`, `<image>`, and `<text>`
- resolve attributes such as `x`, `y`, `width`, `height`, responsive layout fields, `fill`, `outline`, `outline-thickness`, `opacity`, `clip`, `visible`, `shadow`, `z`, `src`, `font-family`, `font-size`, and relative `points`
- reject alternate geometry attributes such as `x1`, `y1`, `x2`, `y2`, `x3`, `y3`, `radius`, `radius-x`, and `radius-y`
- draw shapes, text, and explicit image handles through existing canvas/image/font helpers
- render CSS-like shadows by drawing a source alpha mask, applying spread and native alpha blur, tinting the mask, and alpha-blitting it behind the original shape
- support root `antialias="2"` or `renderScene(xml, { antialias: 2 })` by selectively smoothing diagonal stair-step edges without blurring the whole XML scene
- expose stable IDs and normalized bounds for future app-level hit testing
- produce the same pixels in off-screen tests and live windows

## Cross-platform Windowing

Live window support should be cross-platform, but not by mixing every host API into one large file or into `jayess:canvas`. Use focused platform adapters for Windows, macOS, and Linux when required.

Software rendering and image output work without external GUI libraries. Window presentation uses platform-specific native adapters or a later explicit backend module. The Linux/X11 `jayess:window` adapter can present the validated software pixel buffer produced by this module without moving native window code into `jayess:canvas`.

## Implementation Direction

Drawing helpers are Jayess-written wrappers over `jayess:image`. Keep live window creation, event polling, and frame presentation in separate focused `jayess:window` slices. Keep canvas drawing state inside `jayess:canvas`; do not move that state down into `jayess:image`.

`stdlib/jayess/canvas/index.js` remains the public drawing surface. Small focused helpers should live beside it, including polygon helpers, scalar helpers, drawing state, XML scene parsing adapters, XML attribute normalization, scene rendering, and hit-test metadata. Keep additional canvas internals in sibling files instead of growing the public index file with unrelated support logic.

Shadow internals should stay split between `xml-shadow.js` for scene-level mask construction and `jayess:image` native primitives for expensive alpha spread/blur/tint work. Avoid per-pixel blur loops in Jayess code for normal rendering paths.

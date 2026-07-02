# Canvas Primitive API Audit

This audit records the canvas public surface after the first primitive cleanup slice.

## Preserved Image And Canvas Core

- `create`
- `clear`
- `width`
- `height`
- `getPixel`
- `copy`
- `savePpm`
- `saveImage`
- `drawImage`
- `drawImageClipped`
- `drawCanvas`

## Preserved State, Clip, And Transform Helpers

- `saveState`
- `restoreState`
- `setFillColor`
- `setStrokeColor`
- `setStrokeWidth`
- `setTextColor`
- `setTextSize`
- `translate`
- `scale`
- `clipRect`
- `currentClip`
- `pushClip`
- `popClip`
- `fillRectClipped`
- `fillRectAlpha`

## Explicit Primitive Drawing Helpers

- `drawPixel`
- `drawLine`
- `drawPolyline`
- `drawRect`
- `fillRect`
- `drawEllipse`
- `fillEllipse`
- `drawSemiellipse`
- `fillSemiellipse`
- `drawTriangle`
- `fillTriangle`
- `drawCapsule`
- `fillCapsule`
- `drawPolygon`
- `fillPolygon`

The public API intentionally uses explicit `draw*` and `fill*` names. Legacy aliases such as `line`, `strokeRect`, `strokeEllipse`, `fillCircle`, `strokeCircle`, `polyline`, and `strokePolygon` are not public canvas exports after this cleanup.

## Text And Font Drawing

- `measureText`
- `text`
- `drawTextBox`

These remain in `jayess:canvas` and use the font registry owned by `jayess:font`.

## Removed HTML/CSS Surface

The old canvas HTML/CSS renderer exports were hard-removed after the XML scene renderer replacement landed:

- `packHtml`
- `packCss`
- `loadHtml`
- `loadCss`
- `parseHtml`
- `parseCss`
- `createHtmlDocument`
- `layoutHtml`
- `drawHtml`
- `drawHtmlScrollbars`
- `hitTestHtml`
- `hitTestHtmlNode`
- HTML scroll helpers

The separate `jayess:html` string helper module remains available for server/string use; it is not a canvas or GUI renderer.

## Split Helpers

Shape-box normalization for the explicit primitive API lives in `stdlib/jayess/canvas/shapes.js`. Existing focused helpers remain split across `state.js`, `scalar-helpers.js`, and `polygon-helpers.js`.

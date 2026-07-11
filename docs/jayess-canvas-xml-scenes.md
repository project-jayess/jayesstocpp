# Jayess Canvas XML Scenes

`jayess:canvas` should use XML scenes as its deterministic document-rendering layer. This is not a browser renderer: there is no HTML compatibility, CSS selector model, browser DOM, markup-executed JavaScript, network loading, or hidden event loop.

XML text should be parsed through `jayess:xml`. `jayess:canvas` should consume parsed XML nodes or XML text by delegating to `jayess:xml`; it should not add a second XML parser.

## Shape Model

The first scene root is `<scene>` or `<canvas>` with:

- `width`
- `height`
- `w`
- `h`
- optional `background`
- optional `title`
- optional `antialias`

The first shape elements are:

- `<group>`
- `<rectangle>`
- `<button>`
- `<ellipse>`
- `<semiellipse>`
- `<triangle>`
- `<capsule>`
- `<line>`
- `<pixel>`
- `<polygon>`
- `<polyline>`
- `<image>`
- `<text>`

Shared attributes should stay explicit:

- `id`
- `color-event-mode`
- `x`
- `y`
- `xy`
- `width`
- `height`
- `w`
- `h`
- `fill`
- `outline`
- `outline-thickness`
- `outline-opacity`
- `corners`
- `opacity`
- `padding`
- `position`
- `left`
- `top`
- `right`
- `bottom`
- `min-width`
- `max-width`
- `min-height`
- `max-height`
- `layout`
- `gap`
- `align`
- `justify`
- `grow`
- `shrink`
- `basis`
- `font-color`
- `line-height`
- `letter-spacing`
- `word-spacing`
- `text-transform`
- `text-decoration`
- `text-overflow`
- `text-wrap`
- `overflow`
- `overflow-x`
- `overflow-y`
- `scrollbar-width`
- `scrollbar-color`
- `scrollbar-thumb`
- `scrollbar-thumb-width`
- `scrollbar-thumb-height`
- `scrollbar-thumb-corners`
- `scrollbar-thumb-color`
- `scrollbar-thumb-opacity`
- `scrollbar-track`
- `scrollbar-track-corners`
- `scrollbar-track-color`
- `scrollbar-track-opacity`
- `rotation`
- `clip`
- `text-align`
- `text-align-x`
- `text-align-y`
- `visible`
- `points`
- `shadow`
- `z`
- `src`
- `font-family`
- `font-size`
- `text`

Box-based shapes use `x`, `y`, `width`, and `height`. They can also use `xy="(10,20)"` as a convenience alias for setting `x="10"` and `y="20"` together, plus `w="40"` and `h="20"` as aliases for `width="40"` and `height="20"`. If an alias is present, it wins over its long-form field for that element. The scene root can also use `w` and `h` instead of `width` and `height`. That includes `<rectangle>`, `<ellipse>`, `<semiellipse>`, `<triangle>`, `<capsule>`, `<image>`, and text boxes. Width and height on child elements may be numbers or percentages; percentages resolve against the parent content box after padding. Ellipse and semiellipse size comes from resolved `width` and `height`; do not add `radius`, `radius-x`, or `radius-y`.

Rectangles can use `corners` for CSS-like border radius:

```xml
<rectangle width="160" height="64" corners="12" />
<rectangle width="160" height="64" corners="8 16" />
<rectangle width="160" height="64" corners="8 12 16" />
<rectangle width="160" height="64" corners="8 12 16 20" />
```

The values map like CSS shorthand: one value applies to all corners; two values apply top-left/bottom-right and top-right/bottom-left; three values apply top-left, top-right/bottom-left, and bottom-right; four values apply top-left, top-right, bottom-right, and bottom-left. Values are numeric pixels. Oversized radii are scaled down to fit the rectangle. Rectangle fill, outline, hit testing, and shadow masks all use the same rounded shape.

`<button>` uses the same geometry, label, layout, and drawing behavior as `<rectangle>`, but it has button-oriented defaults and automatic pointer-state fill changes:

```xml
<button width="96" height="32">Save</button>
<button width="96" height="32" fill="#203040" color-event-mode="lighter">Save</button>
```

Button defaults are `fill="rgb(246,248,250)"`, `outline="rgb(209,217,224)"`, `outline-thickness="1"`, `corners="6"`, `padding="8"`, `font-size="14"`, and `font-color="rgb(36,41,47)"`. `color-event-mode` accepts only `darker` or `lighter`; the default is `darker`. The canvas event layer derives hover and pressed fill colors from the button's current base fill; pressed is intentionally stronger than hover. Application event handlers still run after the automatic state update, so manual `setAttribute` or `setAttributes` calls can override the calculated fill.

Responsive bounds use numeric or percentage lengths:

- `min-width`
- `max-width`
- `min-height`
- `max-height`

These clamp resolved `width` and `height` during scene normalization. Percentages on the min/max fields also resolve against the parent content box.

Positioning is deterministic and intentionally smaller than CSS:

- `position="relative"` ignores `x`, `y`, `xy`, `left`, `top`, `right`, and `bottom`; the parent layout decides placement. This is the default for child elements.
- `position="absolute"` places the element inside the parent content box. Use it for explicit-coordinate scenes where `x`, `y`, `xy`, `left`, `top`, `right`, or `bottom` should control placement.
- `position="fixed"` places the element against the scene viewport instead of the parent.

For `absolute` and `fixed` elements, `x` / `y` or `xy` can still be used. `left`, `top`, `right`, and `bottom` are also supported. If both sides of an axis are present and size is omitted, the size is stretched between those offsets.

The scene root and any visual parent element can use `layout="none"`, `layout="row"`, or `layout="column"`. The default is `column`, so children stack top to bottom unless the parent says otherwise. `none` disables flow layout but does not make children absolute; explicit-coordinate children should use `position="absolute"`. `row` places relative children left to right. `column` places relative children top to bottom. Parent layout attributes are:

- `gap`
- `padding`
- `align="start|center|end|stretch"`
- `justify="start|center|end|space-between|space-around|space-evenly"`

Relative children in a row or column can use:

- `grow`
- `shrink`
- `basis`

`basis` is the child main-axis starting size. Positive free space is distributed by `grow`; shortage is distributed by `shrink`. Absolute and fixed children are excluded from row/column flow.

`outline-opacity` controls only outline/stroke alpha and defaults to `1`. It is separate from the fill color alpha and from the general `opacity` field. It applies to outline-driven drawing such as rectangles, ellipses, semiellipses, capsules, triangles, polygons, polylines, and lines.

Visual shape elements can carry inner text as a built-in label:

```xml
<rectangle x="56" y="150" width="420" height="132" fill="#253342" outline="#6de7ff" outline-thickness="2" shadow="12 16 10 4 rgba(0,0,0,0.55)" padding="12" font-color="#ffffff" font-family="default" font-size="18" z="1">Jayess Canvas Window</rectangle>
```

The `text` attribute remains available, but child text is preferred for readable scene markup. The label is rendered inside the element's resolved bounds after the shape fill and outline. `padding` is a single numeric inset applied on all sides of the label box. `font-color` controls only the label color; it does not change the shape `fill`. If `font-color` is omitted, shape labels default to white. `<text>` elements keep using `fill` as their text color, with `font-color` accepted as a more explicit override.

Shape labels are centered by default. Use `text-align-x="left|center|right"` and `text-align-y="top|middle|bottom"` to control label placement. `text-align` is a shorthand where the first value is horizontal and the optional second value is vertical:

```xml
<rectangle width="180" height="64" text-align="left top">Top left</rectangle>
<rectangle width="180" height="64" text-align-x="right" text-align-y="bottom">Bottom right</rectangle>
```

Text layout attributes apply to labels and `<text>` elements:

- `line-height` sets explicit line advance in pixels.
- `letter-spacing` adds pixels after each glyph.
- `word-spacing` adds extra pixels after spaces.
- `text-transform="none|uppercase|lowercase"` transforms text before measuring and drawing.
- `text-decoration="none|underline|overline|line-through"` draws a simple one-pixel decoration line.
- `text-overflow="overflow|clip|ellipsis"` controls text that exceeds the label box. The default is `overflow`, meaning text stays in normal wrapped flow and can make the text content larger than its box. The separate `overflow`, `overflow-x`, and `overflow-y` attributes decide whether that overflow is visible, clipped, or represented with scrollbar indicators. `ellipsis` truncates the first rendered line with `...`.
- `text-wrap="wrap|nowrap"` controls line wrapping inside a text-backed shape. The default is `wrap`. Use `nowrap` with `overflow-x="auto"` or `overflow-x="scroll"` when the element should behave like a horizontal text scroll pane.
- `overflow="visible|hidden|auto|scroll"` controls clipping for text boxes.
- `overflow-x` and `overflow-y` override one axis.

Use scrollbars as a visual overflow indicator for element text:

```xml
<rectangle
  width="220"
  height="80"
  overflow="auto"
  scrollbar-width="10"
  scrollbar-color="#888888 #f1f1f1">Long label text...</rectangle>
```

`scrollbar-color` uses `thumb track` order. `scrollbar-thumb` and `scrollbar-track` may name image handles supplied through render options or local image paths. Image thumbs can use `scrollbar-thumb-width` and `scrollbar-thumb-height` to draw custom artwork at a fixed size while the computed thumb position still follows the scroll range.

Root scene scrolling and element text scrolling use retained canvas state. The root scene keeps a cached scrollable backing image for non-fixed content and presents the current viewport from that cache during ordinary wheel scrolling. `position="fixed"` elements and the root scrollbar are painted after the cached content so overlays stay viewport-relative. Text-backed element scroll panes keep their measured text layout and rendered text bitmap cache, copy already-visible pixels for small single-axis scrolls, then repaint only the newly exposed strip and scrollbar area. Large jumps, diagonal scrolls, invalid regions, resized panes, changed attributes, and changed render options fall back to a full repaint of the affected area.

The manual probe at `custom-test/canvas-window` includes an automated smoke mode for scroll-performance checks. Run the built executable from its `dist` directory with `JAYESS_CANVAS_WINDOW_SMOKE=1` to exercise root scrolling, nested pane scrolling, fixed overlay hit testing, hover/click routing, and render counters without entering the native window loop.

For CPU-friendly scenes, keep long scrolling content in root flow or in a small number of scroll panes, avoid changing text or image attributes during every wheel event, prefer stable image handles through render options, and keep fixed overlays compact. Application code should still batch its own high-frequency input work and present once per frame where practical.

`<group>` is a deterministic container for nested shape elements. A group can use shared attributes such as `id`, `x`, `y`, `xy`, and `visible`. Its resolved `x` and `y` are added to descendant shape coordinates during scene normalization; it does not introduce CSS inheritance, transforms, or browser-style DOM behavior.

Point-list shapes use `points`, for example:

```xml
<polygon x="100" y="50" points="(10,10), (30,20), (60,90)" fill="#44aa88" />
```

Point tuples are relative offsets from the element's resolved `x` and `y`, including coordinates supplied through `xy`. In the example above, the absolute points are `(110,60)`, `(130,70)`, and `(160,140)`.

Do not add alternate point attributes such as `x1`, `y1`, `x2`, `y2`, `x3`, or `y3`. Lines, triangles, polygons, and polylines all use `points`.

Points are normalized after `x`, `y`, `xy`, `width`, `height`, `w`, and `h` are parsed for the element. Width and height do not implicitly scale the point tuple values; the tuple values are added to the resolved `x` and `y`.

For box-shaped elements such as `<rectangle>`, `<ellipse>`, `<semiellipse>`, and `<capsule>`, omitted `points` renders once at the element's `x` and `y`. When `points` is present, each resolved point is an anchor where the same `width` and `height` are rendered. This gives repeatable positioned copies without adding `x1`, `y1`, radius, or alternate coordinate attributes.

`z` controls sibling drawing order. Lower `z` values draw first, higher `z` values draw later, and equal values preserve XML order. Groups sort their own direct children the same way after group offsets are normalized.

Use `shadow="offsetX offsetY [blur] [spread] color"` for CSS-like shadows. Examples:

```xml
<rectangle x="40" y="40" width="120" height="60" fill="#3366ff" shadow="8 10 6 2 rgba(0,0,0,0.45)" />
<text x="40" y="140" text="Glow" font-size="24" fill="#ffffff" shadow="0 0 8 0 #44ccff" />
```

The renderer treats shadows as alpha-mask effects, not as transparent duplicate rectangles. It creates a local alpha mask for the source shape, expands the mask by the spread radius, applies a native image blur to the alpha channel, tints the blurred alpha with the shadow color, then alpha-blits the shadow behind the original shape with the requested offset. The temporary shadow bitmap includes padding for spread and blur so soft edges are not clipped.

Keep shadow styling in the single `shadow` attribute for now. Do not add separate `shadow-x`, `shadow-y`, `shadow-opacity`, `shadow-gradient`, `shadow-angle`, or `shadow-blur-angle` attributes.

Set root `antialias="2"` to smooth diagonal stair-step edges after normal rasterization. Missing `antialias` or `antialias="0"` disables anti-aliasing. Values from `2` to `4` increase selective edge passes; `1` is accepted but behaves the same as off because it cannot smooth edges. The pass is intentionally not a whole-image blur: flat fills, straight horizontal and vertical edges, and text interiors should remain crisp. It applies to diagonal edges from XML-rendered shapes, outlines, shadows, polygons, polylines, and text. The same behavior can be enabled from code with `renderScene(xml, { antialias: 2 })`.

The first parser slice accepts numeric attributes through `jayess:number`, colors through `jayess:color`, booleans as `true` or `false`, and IDs/text as ordinary XML string attributes. Unsupported elements, unknown attributes, missing root size (`width`/`height` or `w`/`h`), malformed points, invalid colors, invalid numeric values, negative sizes, and forbidden geometry attributes raise focused Jayess diagnostics.

## Canvas APIs

The primitive canvas API should use explicit draw/fill names:

- `drawPixel`
- `drawLine`
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
- `drawPolyline`
- `drawPolygon`
- `fillPolygon`

Do not keep legacy aliases such as `line`, `strokeRect`, `strokeEllipse`, `fillCircle`, `strokeCircle`, `polyline`, or `strokePolygon`.

Scene helpers should be layered over those primitives:

- `parseScene(xmlText, options?)`
- `sceneSize(scene)`
- `sceneBackground(scene)`
- `sceneTitle(scene)`
- `drawScene(canvas, scene)`
- `renderScene(xmlText, options?)`
- `findElement(canvas, id)`
- `setAttribute(canvas, id, name, value)`
- `setAttributes(canvas, id, attributes)`
- `hitElement(canvas, x, y)`
- `hitElements(canvas, x, y)`
- `addEventListener(canvas, name, callback)`
- `dispatchEvent(canvas, event)`
- `packXml(path)`
- `packImage(path)`

`parseScene` normalizes XML nodes into a stable Jayess scene tree. The parser adapter is implemented without importing `jayess:gui` or `jayess:window`. `drawScene` renders a normalized tree into an existing canvas, and `renderScene` creates a canvas from root scene dimensions, draws the tree, and returns the canvas.

`renderScene(xmlText, options?)` accepts `backend: "auto" | "cpu" | "gpu"`. Missing `backend` defaults to `"auto"`, which currently records an automatic request and uses the portable CPU renderer as the actual backend. `backend: "cpu"` selects the same renderer explicitly. `backend: "gpu"` is reserved until XML scene rendering has a real GPU draw path; it reports a focused runtime diagnostic rather than pretending that the existing CPU image buffer is GPU-rendered. Use `requestedBackend(canvas)` and `actualBackend(canvas)` to inspect the selected path.

`renderScene` also attaches the normalized scene tree to the returned canvas for runtime updates. `setAttribute(canvas, id, name, value)` mutates one existing element attribute by `id` and redraws the canvas buffer immediately. `setAttributes(canvas, id, attributes)` batches several attribute updates into one redraw and is the preferred event-handler path. `hitElement(canvas, x, y)` returns the topmost visible ID-bearing element at a canvas coordinate, using shape-aware geometry for ellipses, capsules, triangles, and polygons. `hitElements(canvas, x, y)` returns all visible ID-bearing elements at that coordinate, ordered topmost first. `dispatchEvent(canvas, windowEvent)` derives first-slice canvas events from window input; currently `mouseMove` can emit `mouseover` and `mouseout`. Apps still decide when to feed window events into canvas and when to present the updated canvas.

Use `packXml("./scene.xml")` when a scene should be embedded into the generated C++ instead of read from disk at runtime. Use `packImage("./icon.png")` or another supported local image path to embed small local image assets for XML `<image>` maps or direct drawing code. Packed `.ppm`, `.pgm`, `.bmp`, `.png`, `.jpeg`, `.jpg`, `.psd`, `.gif`, and `.webp` assets decode at runtime from embedded bytes.

First-slice rendering supports:

- nested `<group>` elements that offset and contain child shapes
- filled and outlined `<rectangle>` from `x`, `y`, `width`, and `height`, with `xy`, `w`, and `h` aliases available
- inner labels on visual shapes through child text or `text`, plus `padding`, `font-color`, `font-family`, and `font-size`
- `<line>` from exactly two relative point tuples
- `<pixel>` from `x`, `y`, and optional `fill`
- filled and outlined `<ellipse>` from `x`, `y`, `width`, and `height`, with `xy`, `w`, and `h` aliases available
- filled and outlined `<semiellipse>` from `x`, `y`, `width`, and `height`, with `xy`, `w`, and `h` aliases available
- filled and outlined `<triangle>` from three relative point tuples or the default box-derived triangle
- filled and outlined `<polygon>` from at least three relative point tuples
- `<polyline>` from at least two relative point tuples
- filled and outlined `<capsule>` from `x`, `y`, `width`, and `height`, with `xy`, `w`, and `h` aliases available
- `<text>` through the existing canvas text/font helpers
- `<image>` through explicit image handles supplied as `renderScene(xml, { images: { name: image } })`, keyed by `src` first and then by `id`

When no explicit handle is supplied, the default canvas loader supports local `.ppm`, `.pgm`, `.bmp`, `.tga`, `.png`, `.jpeg`, `.jpg`, `.psd`, `.gif`, and `.webp` paths through `jayess:image`. A caller can supply `loadImage(src)` in render options to integrate a project-owned local asset policy. Hidden network fetching is not part of the canvas renderer; developers should fetch, decode, cache, and pass remote image handles explicitly in application code.

Example:

```xml
<scene layout="none" w="160" h="100" background="#000000" title="Shapes" antialias="2">
  <rectangle position="absolute" id="panel" x="8" y="8" w="48" h="24" fill="#202040" outline="#ffffff" outline-opacity="0.75" padding="3" font-color="#ffffff">Panel</rectangle>
  <rectangle position="absolute" width="12" height="12" points="(8,40), (24,40), (40,40)" fill="#3355ff" />
  <ellipse position="absolute" xy="(68,8)" w="32" h="24" fill="#44aa88" />
  <line position="absolute" x="0" y="0" points="(12,56), (80,56)" outline="#ffcc00" outline-thickness="2" />
  <polygon position="absolute" points="(96,48), (132,48), (140,76), (104,84)" fill="#8844ff" />
  <text position="absolute" x="12" y="72" text="Jayess" fill="#ffffff" font-size="7" z="2" />
</scene>
```

Responsive layout example:

```xml
<scene w="320" h="180" background="#101820">
  <group x="16" y="16" w="288" h="80" layout="row" padding="12" gap="8" align="center">
    <rectangle w="30%" h="40" fill="#3355ff">Left</rectangle>
    <rectangle basis="60" grow="1" h="40" fill="#44aa88">Grow</rectangle>
    <rectangle position="absolute" right="12" bottom="12" w="24" h="24" fill="#ffcc00" />
  </group>
  <rectangle position="fixed" right="16" bottom="16" w="80" h="24" fill="#253342">Fixed</rectangle>
</scene>
```

## Window Relationship

XML scenes are canvas-rendered drawing trees. Apps can present the resulting canvas through `jayess:window` and can use scene IDs or normalized bounds for their own app-level hit testing. There is no shipped `jayess:gui` standard-library module for now.

The current runtime interaction surface stays inside `jayess:canvas`: mutate existing XML elements with `setAttribute` or batched `setAttributes`, derive pointer transitions with `dispatchEvent`, and present the updated buffer through `jayess:window`. It does not create buttons, a DOM, HTML/CSS compatibility, or a separate GUI module.

## Migration Note

`custom-test/window-canvas-html` should be retargeted in place after XML scene rendering lands. Keep the probe directory, but change its source assets and generated output to exercise XML scenes over `jayess:canvas` and presentation through `jayess:window`.

`jayess:html` remains a server/string helper module only. It should not be used as the GUI renderer.

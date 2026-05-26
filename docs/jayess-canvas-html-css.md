# `jayess:canvas` HTML/CSS Renderer

`jayess:canvas` owns the first Jayess HTML/CSS renderer. It is a deterministic renderer over Jayess canvas, color, image, font, and layout primitives. It is not a browser engine.

## Surface

- `parseHtml(html, options)`
- `parseCss(css, options)`
- `createHtmlDocument(html, css, options)`
- `layoutHtml(document, bounds)`
- `hitTestHtml(document, x, y)`
- `drawHtml(canvas, document)`

`jayess:gui` consumes canvas-rendered documents through:

- `attachHtmlDocument(windowState, document)`
- `updateHtmlDocument(windowState, events)`
- `drawHtmlDocument(windowState, canvas)`

## Supported HTML

The first element subset is:

- `div`
- `span`
- `p`
- `button`
- `input`
- `form`
- `label`
- `img`
- `ul`
- `ol`
- `li`

HTML parsing returns a plain render tree, not a browser DOM. Text nodes are plain objects. Element nodes carry `tagName`, `attributes`, `children`, `style`, and `layout`. Stable interaction targets use `id` first, then `name` where an element has no `id`.

## Supported CSS

Selectors:

- element selectors such as `button`
- class selectors such as `.primary`
- id selectors such as `#save`
- simple descendant selectors such as `div .primary`
- inline `style` attributes

Properties:

- `display`
- `width`
- `height`
- `min-width`
- `max-width`
- `min-height`
- `max-height`
- `margin`
- `padding`
- `background-color`
- `color`
- `font-size`
- `border-width`
- `border-color`
- `border-radius`
- `text-align`
- `gap`
- `overflow`

Lengths are numeric pixels. Color values use `jayess:color` parsing. `margin` and `padding` accept one to four CSS-like numeric values and expose per-side layout metadata (`marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`). A uniform shorthand also preserves the compact `margin` or `padding` metadata value for callers that only need the old scalar shape.

`overflow` currently accepts `visible` and `hidden`. `hidden` clips canvas painting for that render-tree box through the normal canvas clip stack; it does not add browser scrolling or CSS overflow layout behavior.

## Layout And Paint

`layoutHtml(document, bounds)` assigns deterministic layout boxes under the provided bounds. The first layout model is intentionally small and block-oriented, with focused inline text wrapping for simple text runs and adjacent inline children. Box metadata includes content coordinates, content width, min/max constrained dimensions, margin, padding, per-side box values, border width, disabled state, overflow mode, wrapped text lines, and line height so paint and hit testing share the same computed bounds.

`drawHtml(canvas, document)` paints backgrounds, borders, wrapped text lines, and explicit image handles through existing canvas primitives, so active canvas clip/state behavior applies to document painting as it does to other drawing commands. Image elements are limited to explicit Jayess image handles or source objects carried by the element attributes. The renderer does not load network images.

`hitTestHtml(document, x, y)` returns focused render-tree hit metadata:

```js
{ type: "htmlHit", tagName, role, targetId, disabled, bounds }
```

The role is currently `"button"`, `"input"`, or `"node"`. Hit testing uses the computed layout boxes and returns the topmost matching render node. It does not expose a browser DOM node API.

## GUI Bridge

`jayess:gui` can attach a canvas HTML document to a window state. The bridge routes normalized `jayess:window` mouse events into hit-tested document nodes and queues actions:

- `htmlClick` for buttons
- `htmlSubmit` for submit buttons, including the nearest form id when available
- `htmlInputFocus` for inputs
- `htmlInput` for focused input text edits
- `htmlChange` for focused input commit through enter

Window state, invalidation, action queues, and presentation remain GUI responsibilities. Parsing, style resolution, layout, and painting remain canvas responsibilities.

Canvas-rendered `<input>` elements use their `value` attribute as editable text. GUI updates that attribute in the attached render tree. Disabled buttons and inputs expose disabled hit/layout metadata and do not queue click, focus, input, or submit actions. This is a small render-tree interaction model, not browser form state or DOM mutation compatibility.

## Non-Goals

- browser DOM compatibility
- JavaScript execution inside HTML
- CSS animations
- broad flexbox/grid compatibility
- full CSS cascade, specificity, inheritance, or layout compatibility
- DOM mutation APIs
- network loading
- GPU dependency

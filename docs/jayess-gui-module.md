# `jayess:gui` Module

`jayess:gui` is the first Jayess-owned GUI toolkit slice over `jayess:layout`, `jayess:canvas`, `jayess:font`, and normalized `jayess:window` events.

HTML/CSS rendering belongs to `jayess:canvas`. GUI uses canvas-rendered document surfaces for interaction, invalidation, action queues, and live window presentation rather than owning a separate browser DOM or renderer. Canvas document layout owns the focused CSS box details such as min/max dimensions and `overflow: hidden` clipping.

The HTML/CSS bridge is deliberately small. `attachHtmlDocument(...)` stores a canvas document on the window state, `updateHtmlDocument(...)` routes normalized mouse and key events into hit-tested document nodes, and `drawHtmlDocument(...)` lays out and paints the document through `jayess:canvas`.

## Surface

- `createApplication()`
- `createWindowState(options)`
- `setRoot(windowState, widget)`
- `invalidate(windowState)`
- `needsRedraw(windowState)`
- `drainActions(windowState)`
- `createLabel(options)`
- `createButton(options)`
- `createTextInput(options)`
- `createCheckbox(options)`
- `createRadio(options)`
- `value(widget)`
- `setValue(widget, text)`
- `checked(widget)`
- `setChecked(widget, value)`
- `formState(rootWidget)`
- `createPanel(options, children)`
- `createStack(options, children)`
- `createColumn(options, children)`
- `createRow(options, children)`
- `layout(windowState)`
- `update(windowState, events)`
- `draw(windowState, canvas)`
- `runGuiFrame(window, windowState, canvas, callback, args)`
- `attachHtmlDocument(windowState, document)`
- `updateHtmlDocument(windowState, events)`
- `drawHtmlDocument(windowState, canvas)`
- `htmlRenderer(options)`
- `showHtmlRenderer(renderer)`
- `updateHtmlRenderer(renderer)`
- `reloadHtmlRenderer(renderer, html, css)`
- `runHtmlRenderer(renderer)`
- `shouldCloseHtmlRenderer(renderer)`
- `closeHtmlRenderer(renderer)`
- `drainHtmlRendererActions(renderer)`

## Object Roles

- `createApplication()` returns a small top-level owner object for toolkit windows.
- `createWindowState(options)` returns the per-window toolkit state. The first slice tracks size, background, root widget, action queue, and redraw/layout flags.
- `setRoot(...)` replaces the widget tree and marks layout/redraw dirty.

## Widgets

`createLabel(options)` creates a non-interactive text node.

Supported label options:

- `text`
- `align`
- `padding`
- `color`
- `background`
- optional `width`
- optional `height`

`createButton(options)` creates the first interactive widget.

Supported button options:

- `id`
- `text`
- `align`
- `padding`
- `color`
- `background`
- `hoverBackground`
- `pressedBackground`
- `borderColor`
- optional `width`
- optional `height`

`createTextInput(options)` creates the first focused text-entry widget. It is canvas-rendered and consumes normalized keyboard events through `update(windowState, events)`.

Supported text input options:

- `id`
- `value`
- `placeholder`
- `padding`
- `color`
- `placeholderColor`
- `background`
- `focusedBackground`
- `borderColor`
- `focusBorderColor`
- optional `width`
- optional `height`

`value(widget)` reads the current text value. `setValue(widget, text)` updates the value and keeps the cursor within the new text bounds. `selection(widget)` returns collapsed text-selection metadata shaped as `{ start, end }` for the current text input cursor. This is render-toolkit metadata, not a browser selection API.

`createCheckbox(options)` and `createRadio(options)` create focused first-slice form controls. They are canvas-rendered widgets, not browser form elements.

Supported checkbox/radio options:

- `id`
- `name`
- `value`
- `text`
- `checked`
- `padding`
- `color`
- `background`
- `borderColor`
- optional `width`
- optional `height`

`checked(widget)` reads the current checked state. `setChecked(widget, value)` updates it directly. `formState(rootWidget)` walks the widget tree and returns a plain object containing checked checkbox values by `name`, the selected radio value by group `name`, and text input values by `id`.

`accessibility(widget)` returns plain metadata for supported widgets:

```js
{ role, label, disabled, checked, focused, value }
```

This metadata is meant for Jayess tooling and app-level inspection. It does not expose platform accessibility APIs in this slice.

`createPanel(options, children)` creates a container. The first public layout wrappers are:

- `createStack(...)`
- `createColumn(...)`
- `createRow(...)`

Supported panel options:

- `layout`
- `padding`
- `gap`
- `background`
- optional `width`
- optional `height`

## Event Dispatch

`update(windowState, events)` consumes normalized window events such as:

- `resize`
- `mouseMove`
- `mouseDown`
- `mouseUp`
- `keyDown`

The first slice records toolkit actions rather than invoking user callbacks directly. A successful button click queues:

```js
{ type: "click", targetId }
```

Text input focus is explicit. A left mouse down inside a text input focuses it. A left mouse down outside it blurs it. Focused text inputs consume `keyDown` events for single-character text, backspace, delete, left, right, home, end, and enter.

Text edits queue:

```js
{ type: "input", targetId, value }
```

Committing with enter or blurring after edits queues:

```js
{ type: "change", targetId, value }
```

Checkbox and radio activation queues:

```js
{ type: "change", targetId, name, value, checked }
```

Radio widgets with the same `name` behave as one group. Selecting one radio clears the others in that group. `Tab` performs focused traversal across buttons, text inputs, checkboxes, and radios in widget-tree order.

Use `drainActions(windowState)` to retrieve and clear the queued actions.

## HTML Document Interaction

`updateHtmlDocument(windowState, events)` consumes the same normalized event shape as the widget update path for the focused HTML/CSS document bridge:

- `mouseUp` queues `{ type: "htmlClick", targetId, role: "button" }` for canvas-rendered buttons.
- `mouseUp` on a submit button also queues `{ type: "htmlSubmit", targetId, formId }`.
- `mouseUp` on an input queues `{ type: "htmlInputFocus", targetId, value }` and stores the focused input target.
- `keyDown` while an HTML input is focused edits that render-tree input value and queues `{ type: "htmlInput", targetId, value }`.
- `Enter` while an HTML input is focused queues `{ type: "htmlChange", targetId, value }`.

Disabled HTML buttons and inputs expose disabled metadata and do not queue click, focus, input, change, or submit actions. This interaction layer edits the attached canvas render tree. It is not a browser DOM, does not run JavaScript, and does not submit forms over the network or navigate.

## HTML Renderer Facade

`jayess:gui/html-renderer` provides `htmlRenderer(options)` for a browser-window-style GUI surface over existing Jayess modules. It creates the native window, canvas, parsed HTML/CSS document, and first rendered surface. It belongs to the `jayess:gui` module family because it owns live GUI orchestration, event polling, resize relayout, presentation, reload actions, and close handling.

Supported first-slice options include:

- `title`
- `width`
- `height`
- `background`
- `html`
- `css` as one string or an array of strings
- `resizeDelay`

`runHtmlRenderer(renderer)` shows the window and runs the simple blocking event loop. `updateHtmlRenderer(renderer)` runs one event/render/present frame for apps that own their loop. `reloadHtmlRenderer(renderer, html, css)` replaces the renderer's HTML/CSS strings when non-null values are provided, recreates the canvas HTML document, relayouts, and repaints. `css` may be one string or an array of stylesheet strings; arrays are joined in order. `drainHtmlRendererActions(renderer)` returns queued HTML actions and clears the queue.

The renderer deliberately accepts HTML/CSS text instead of filenames. Callers choose the source:

```js
import { loadHtml, loadCss } from "jayess:canvas";
import { htmlRenderer } from "jayess:gui/html-renderer";

var renderer = htmlRenderer({
  html: loadHtml("../src/window.html"),
  css: [
    loadCss("../src/base.css"),
    loadCss("../src/window.css")
  ]
});
```

Compile-time packed assets can use the same renderer shape by passing `packHtml(...)` as `html` and one or more `packCss(...)` results as `css`.

## Layout And Paint

`layout(windowState)` assigns widget bounds from the current window size.

The first layout policy is intentionally small:

- labels and buttons have intrinsic size on the primary axis
- `column` and `row` distribute remaining space across flexible children
- `stack` overlays children across the same content bounds

`draw(windowState, canvas)` is the first paint pass. It:

1. runs the pending layout pass when needed
2. clears the target canvas with the window-state background
3. paints the widget tree
4. clears the redraw flag

`runGuiFrame(window, windowState, canvas, callback, args)` is a one-frame helper over `jayess:window`. It polls events, updates the GUI state, calls `callback(window, windowState, events, ...args)`, draws and presents only when redraw is needed and the window remains open, and reports deterministic frame metadata:

```js
{ scheduled, done, handle, state, rendered, presented, closed, queuedActions, result }
```

## Invalidation

`invalidate(windowState)` marks repaint required after a user state mutation.

`needsRedraw(windowState)` reports whether a pending layout or repaint exists.

The intended flow is explicit:

```js
var events = pollEvents(window);
update(windowState, events);

var actions = drainActions(windowState);
// apply app-specific state changes here
invalidate(windowState);

if (needsRedraw(windowState)) {
  draw(windowState, canvas);
  present(window, canvas);
}
```

## Boundaries

- The first slice is software-canvas only.
- HTML/CSS parsing, style resolution, layout, and painting are canvas-rendering responsibilities.
- GUI can attach canvas-rendered HTML/CSS documents to window state and route normalized window events into hit-tested buttons and inputs.
- It does not depend on `jayess:gpu`.
- It is not a browser DOM layer.
- It is not Node.js GUI compatibility.
- It does not hide the host event loop.
- Text input is a focused canvas widget, not a native OS text control.

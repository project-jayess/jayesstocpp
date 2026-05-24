# `jayess:gui` Module

`jayess:gui` is the first Jayess-owned GUI toolkit slice over `jayess:layout`, `jayess:canvas`, `jayess:font`, and normalized `jayess:window` events.

## Surface

- `createApplication()`
- `createWindowState(options)`
- `setRoot(windowState, widget)`
- `invalidate(windowState)`
- `needsRedraw(windowState)`
- `drainActions(windowState)`
- `createLabel(options)`
- `createButton(options)`
- `createPanel(options, children)`
- `createStack(options, children)`
- `createColumn(options, children)`
- `createRow(options, children)`
- `layout(windowState)`
- `update(windowState, events)`
- `draw(windowState, canvas)`

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

`text input` is not part of the shipped surface yet.

## Event Dispatch

`update(windowState, events)` consumes normalized window events such as:

- `resize`
- `mouseMove`
- `mouseDown`
- `mouseUp`

The first slice records toolkit actions rather than invoking user callbacks directly. A successful button click queues:

```js
{ type: "click", targetId }
```

Use `drainActions(windowState)` to retrieve and clear the queued actions.

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
- It does not depend on `jayess:gpu`.
- It is not a browser DOM layer.
- It is not Node.js GUI compatibility.
- It does not hide the host event loop.

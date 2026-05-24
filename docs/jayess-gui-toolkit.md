# Jayess GUI Toolkit Direction

Jayess's default GUI direction is its own toolkit over `jayess:image`, `jayess:canvas`, and `jayess:window`. It is not a browser DOM layer and not Node.js GUI compatibility.

The first toolkit slice stays small:

- a pure Jayess-owned module surface
- software-canvas rendering only
- explicit update/layout/draw responsibilities
- normalized window events consumed as input
- explicit invalidation before redraw

## Object Model

The first toolkit object model is split deliberately:

- application: a top-level owner for one or more toolkit window states
- window state: size, root widget, invalidation state, and drained toolkit actions
- widget tree: immutable-by-shape UI structure composed from label, button, and panel/layout nodes
- layout pass: assigns widget bounds from the current window size
- paint pass: draws the widget tree into a `jayess:canvas`
- event dispatch: consumes normalized `jayess:window` events and records toolkit actions

The toolkit does not hide the host window loop. Real code still owns:

1. `pollEvents(window)`
2. `update(windowState, events)`
3. drain toolkit actions and mutate state
4. `invalidate(windowState)` when a state mutation requires repaint
5. `draw(windowState, canvas)`
6. `present(window, canvas)`

## First Widget Slice

The first approved toolkit slice is:

- `label`
- `button`
- `panel`
- `stack` layout
- `column` layout
- `row` layout

The first shipped toolkit module implements those pieces only.

`text input` remains a later separate slice. It is intentionally not mixed into the first toolkit implementation.

## Rendering Policy

The first toolkit rendering path is purely canvas-based:

- widgets paint into `jayess:canvas`
- `jayess:canvas` paints into `jayess:image`
- `jayess:window` presents the software canvas buffer

The first toolkit slice does not depend on `jayess:gpu`.

## Invalidation And Repaint

The first repaint path is intentionally narrow:

- event dispatch records toolkit actions
- user code applies state changes explicitly
- `invalidate(windowState)` marks repaint required
- `needsRedraw(windowState)` reports whether layout or repaint work is pending
- `draw(windowState, canvas)` performs any pending layout pass, repaints the canvas, and clears the redraw flag

That keeps repaint behavior deterministic and keeps presentation under explicit user control.

## Current Module Surface

The current first-slice module is `jayess:gui`.

See [jayess-gui-module.md](./jayess-gui-module.md) for the shipped API shape.

## Non-Goals For This Slice

- browser DOM compatibility
- HTML/CSS layout emulation
- implicit global application loop
- GPU-backed default rendering
- native text-input/editor behavior
- broad widget catalogs

The toolkit should grow through small focused slices instead of one large framework pass.

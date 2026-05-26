# Jayess GUI Toolkit Direction

Jayess's default GUI direction is its own toolkit over `jayess:image`, `jayess:canvas`, and `jayess:window`. It is not a browser DOM layer and not Node.js GUI compatibility.

Focused HTML/CSS rendering belongs to `jayess:canvas`. The GUI toolkit should consume canvas-rendered documents for interactive windowed UI, not implement a separate HTML/CSS engine in `jayess:gui`. The canvas renderer owns deterministic box-model layout, min/max size constraints, overflow clipping, simple descendant selectors, wrapped text-line metadata, paint, and hit-test bounds.

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
- `text input`
- `panel`
- `stack` layout
- `column` layout
- `row` layout

The text input slice keeps editing local to the widget and records explicit `input` / `change` actions. It also exposes collapsed `{ start, end }` selection metadata for the focused cursor. It does not invoke hidden callbacks, use native OS text controls, or expose browser selection APIs.

## Rendering Policy

The first toolkit rendering path is purely canvas-based:

- widgets paint into `jayess:canvas`
- focused HTML/CSS documents are rendered by `jayess:canvas`
- `jayess:gui` may attach, update, hit-test, edit focused inputs, and draw those documents as window-state surfaces
- `jayess:canvas` paints into `jayess:image`
- `jayess:window` presents the software canvas buffer
- `jayess:window` provides `runFrame(window, state, callback, args)` for one explicit frame step without hiding event polling
- `jayess:gui` provides `runGuiFrame(window, windowState, canvas, callback, args)` for one explicit GUI frame that passes polled events to the callback, updates GUI state, draws when needed, presents only while open, and reports `{ rendered, presented, closed, queuedActions }`

The first toolkit slice does not depend on `jayess:gpu`.

## Invalidation And Repaint

The first repaint path is intentionally narrow:

- event dispatch records toolkit actions
- focused text input edits record `input` actions and commit through `change` actions
- checkbox and radio controls queue explicit `change` actions and expose plain form state through `formState(rootWidget)`
- supported widgets expose plain `{ role, label, disabled, checked, focused, value }` accessibility-style metadata for Jayess-level inspection
- canvas-rendered HTML buttons queue `htmlClick` actions
- canvas-rendered HTML submit buttons queue explicit `htmlSubmit` action metadata
- canvas-rendered disabled HTML controls expose disabled metadata and skip click, focus, input, change, and submit action queues
- canvas-rendered HTML inputs queue `htmlInputFocus`, `htmlInput`, and `htmlChange` actions
- user code applies state changes explicitly
- `invalidate(windowState)` marks repaint required
- `needsRedraw(windowState)` reports whether layout or repaint work is pending
- `draw(windowState, canvas)` performs any pending layout pass, repaints the canvas, and clears the redraw flag
- `runGuiFrame(...)` combines one event/update/callback/draw/present step without taking ownership of the outer application loop

That keeps repaint behavior deterministic and keeps presentation under explicit user control.

## Current Module Surface

The current first-slice module is `jayess:gui`.

See [jayess-gui-module.md](./jayess-gui-module.md) for the shipped API shape.

## Non-Goals For This Slice

- browser DOM compatibility
- JavaScript execution in HTML
- implicit global application loop
- GPU-backed default rendering
- native text-input/editor behavior
- broad widget catalogs

The toolkit should grow through small focused slices instead of one large framework pass.

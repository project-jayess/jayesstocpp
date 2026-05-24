# Jayess `jayess:dialog` Module

`jayess:dialog` is the Jayess-owned native dialog surface for common platform file-picking and message-box tasks. It is not ambient browser DOM UI, and it is not Node.js Electron compatibility.

## First Approved Surface

The first approved export set is intentionally small:

- `openFile(options)`
- `saveFile(options)`
- `openDirectory(options)`
- `message(options)`

The first slice is for one-shot native dialogs only. It does not introduce long-lived dialog handles, embedded views, menu APIs, tray APIs, or generic window composition primitives.

## Cross-Platform Boundary

The public Jayess API must stay host-neutral even though adapters will differ internally:

- Windows uses platform-native open/save/directory/message APIs. This is the first shipped host-backed adapter slice.
- macOS uses platform-native open/save/directory/message APIs. The first shipped slice uses a narrow dynamically loaded `libobjc` / `AppKit` path around `NSOpenPanel`, `NSSavePanel`, and `NSAlert`.
- Linux uses a separate no-default-third-party adapter path and must not silently depend on browser, Electron, GTK, Qt, or bundled toolkit shims unless the repository explicitly chooses that later. The first approved Linux family is the `xdg-desktop-portal` path, kept separate from `jayess:window`'s X11 and Wayland adapters.

If a host adapter is unavailable, the runtime should fail with one deliberate Jayess diagnostic family rather than leaking platform-specific exceptions or partial host objects.

In the current shipped slice:

- Windows has the first full host-backed picker/message path.
- macOS has the first full host-backed picker/message path.
- Linux owns only the focused `xdg-desktop-portal` adapter family boundary so far; when that host path cannot be used, the runtime reports the normalized unavailable-host diagnostic instead of falling back to toolkit-specific binaries.

The first slice is for synchronous-looking Jayess async operations that resolve to plain Jayess values. User code must not receive raw host pointers, OS handles, toolkit objects, or platform event tokens.

## Result Shapes

The first approved normalized result shapes are:

### `openFile(options)`

Returns one of:

- a string absolute or host-native path when the user picks a file
- `null` when the user cancels

The first slice is single-file selection only. Multi-select remains a later separate task.

### `saveFile(options)`

Returns one of:

- a string absolute or host-native path when the user confirms a save target
- `null` when the user cancels

The dialog does not write file contents itself. It only returns the selected save target path.

### `openDirectory(options)`

Returns one of:

- a string absolute or host-native path when the user picks a directory
- `null` when the user cancels

### `message(options)`

Returns one normalized string action result:

- `"ok"`
- `"cancel"`
- `"yes"`
- `"no"`

The first slice should support only the button sets that can normalize cleanly to those values. Broader host-specific button shapes remain later work.

## Cancellation Behavior

The first slice treats user dismissal as a normal result, not an exception:

- picker dialogs return `null` on cancellation
- message dialogs return the normalized dismissed action such as `"cancel"` when that button set exists

Unavailable-host failures, invalid option shapes, and adapter errors are exceptional and should throw focused Jayess diagnostics.

The first slice does not define external cancellation tokens, dialog abortion handles, or programmatic close of an in-flight host dialog. Those remain separate later tasks.

## First Approved Options

The first options direction is also intentionally narrow.

### Shared title/placement shape

The public surface may accept:

- `title`
- `message`
- `defaultPath`

Only options that can normalize honestly across hosts should be added in the first slice.

### `openFile(options)` and `saveFile(options)`

The first approved option family is:

- `title`
- `defaultPath`
- `filters`

`filters` should normalize to plain Jayess data such as:

```js
[
  { name: "Images", extensions: ["png", "jpg"] },
  { name: "Text", extensions: ["txt", "md"] }
]
```

If a host cannot represent a filter exactly, the adapter should either lower it conservatively or reject it with a focused diagnostic. It must not silently reinterpret the filter into unrelated host behavior.

### `openDirectory(options)`

The first approved option family is:

- `title`
- `defaultPath`

### `message(options)`

The first approved option family is:

- `title`
- `message`
- `detail`
- `kind`
- `buttons`

The first approved `kind` values are:

- `"info"`
- `"warning"`
- `"error"`
- `"question"`

The first approved `buttons` values are:

- `"ok"`
- `"okCancel"`
- `"yesNo"`
- `"yesNoCancel"`

These normalize to the message result strings described above.

## Deliberate Non-Goals For The First Slice

The first `jayess:dialog` slice does not yet claim:

- multi-file selection
- non-blocking dialog handles
- progress dialogs
- custom accessory views or embedded widgets
- font/color/theme customization
- drag-and-drop integration
- menu bar integration
- browser DOM or Electron compatibility
- raw host handle access

## Runtime Direction

The preferred layering is:

- a small Jayess wrapper module under `stdlib/jayess/dialog/`
- a focused platform-neutral runtime/bridge fragment for option validation, normalized result construction, and unavailable-host diagnostics
- separate adapter fragments for Windows, macOS, and Linux

Dialog support must not be folded into `jayess:window`. File pickers and message boxes are related to GUI work, but they should remain a separate Jayess-owned host module with its own normalized result policy.

## Example Direction

```js
import { openFile, message } from "jayess:dialog";

var filename = await openFile({
  title: "Open Image",
  filters: [
    { name: "Images", extensions: ["png", "jpg", "bmp"] }
  ]
});

if (filename === null) {
  await message({
    title: "No File",
    message: "The operation was cancelled.",
    kind: "info",
    buttons: "ok"
  });
}
```

This document defines the approved first surface only. Keep diagnostics explicit until the runtime and platform adapters actually land.

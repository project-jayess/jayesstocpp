# `jayess:window` Module

`jayess:window` owns live native window presentation for Jayess rendering. It is separate from `jayess:canvas`: canvas keeps portable CPU/off-screen rendering, while window owns host windows, presentation, and input event polling.

## Surface

- `create(options)`
- `show(window)`
- `close(window)`
- `shouldClose(window)`
- `requestClose(window)`
- `pollEvents(window)`
- `requestFrame(window, callback, args)`
- `cancelFrame(handle)`
- `runFrame(window, state, callback, args)`
- `present(window, canvas)`
- `width(window)`
- `height(window)`
- `setTitle(window, title)`

`create` accepts an options object with:

- `title`: window title string
- `width`: positive integer
- `height`: positive integer

## Event Shape

`pollEvents(window)` returns an array and drains the window event queue. Platform adapters should push normalized event objects with these stable shapes:

- `{ type: "close" }`
- `{ type: "resize", width, height }`
- `{ type: "keyDown", key, code, pressed: true }`
- `{ type: "keyUp", key, code, pressed: false }`
- `{ type: "textInput", text }`
- `{ type: "mouseMove", x, y }`
- `{ type: "mouseDown", button, x, y, pressed: true }`
- `{ type: "mouseUp", button, x, y, pressed: false }`

Keys normalize letters to lowercase and preserve digits, arrows, escape, enter, tab, space, backspace, shift, control, alt, and meta. Unknown keys use `"unknown"`.

`textInput` is emitted after a `keyDown` event when the normalized key maps to one focused text character. This is intentionally small: it covers deterministic printable text input for the first window adapters, while composition, IME pre-edit text, dead keys, and clipboard insertion remain outside the first window slice. GUI text widgets consume `textInput` for character insertion and keep special keys such as `Backspace` on the key-event path.

Mouse buttons normalize to `"left"`, `"middle"`, `"right"`, or `"unknown"`.

`requestClose(window)` records close intent and queues a normalized close event without destroying the host window handle. `shouldClose(window)` reports whether the handle has been closed or a close request has been queued.

`requestFrame(window, callback, args)` is the first narrow Jayess-owned event-loop helper. It is built on `jayess:timers` and schedules one zero-delay callback tick associated with a window. The callback still owns `pollEvents(window)` explicitly; the helper does not hide event draining or create a broad implicit app loop. If `shouldClose(window)` is already true when the scheduled frame tick runs, the callback is skipped and the frame handle resolves to `null`.

`cancelFrame(handle)` cancels a scheduled frame handle through the same underlying timer-cancellation path as `jayess:timers`.

`runFrame(window, state, callback, args)` is the first ergonomic app-loop helper over `requestFrame(...)`. It returns a deterministic record:

```js
{ scheduled, done, handle, state }
```

When `shouldClose(window)` is already true, `scheduled` is `false`, `done` and `handle` are `null`, and the callback is not scheduled. Otherwise, the helper schedules one frame tick and calls `callback(window, state, ...args)`. The callback still owns `pollEvents(window)` explicitly.

`jayess:gui` adds `runGuiFrame(window, windowState, canvas, callback, args)` for the common canvas GUI case. It is still a one-frame helper, not a hidden app loop. The callback contract receives the polled events explicitly as `callback(window, windowState, events, ...args)`. The helper updates GUI state from those events, runs the callback, draws and presents only when redraw is needed and the window is still open, and returns deterministic frame records with `rendered`, `presented`, `closed`, and `queuedActions` fields.

The current platform-neutral lifecycle invariants are explicit:

- `show(window)` is idempotent for an already shown open window
- `requestClose(window)` does not queue duplicate close events once close intent is already recorded
- `close(window)` preserves already queued events, appends one final normalized close event when needed, marks the handle closed, and clears the shown state
- `present(window, canvas)` records the presented software-buffer dimensions through the neutral runtime layer before the platform adapter uploads pixels
- `requestFrame(window, callback, args)` shares the timer scheduler with `jayess:timers` but keeps `pollEvents(window)` explicit in user callback code
- `runFrame(window, state, callback, args)` keeps the same explicit polling model while giving GUI loops a stable per-frame state/callback record
- `jayess:gui` `runGuiFrame(window, windowState, canvas, callback, args)` keeps events visible in the callback contract while handling GUI update/draw/present for one frame

## Platform Boundary

The module is cross-platform by shape, but host support lives behind focused platform adapters. Runtime files should stay split by responsibility:

- platform-neutral window handle validation and public primitives
- Windows adapter
- macOS adapter
- Linux adapter
- Linux/Wayland registry, input, and software-buffer helpers split by responsibility

The current host-backed adapters are:

- Windows/Win32 through a narrow dynamically loaded `user32` / `gdi32` path
- macOS/Cocoa through a narrow dynamically loaded `libobjc` / `AppKit` path
- Linux/X11 through a narrow dynamically loaded X11 path
- Linux/Wayland through a narrow dynamically loaded `libwayland-client` path with `xdg-shell` surface/toplevel setup

The Linux adapter boundary is now explicit in the project contract:

- `x11` is one shipped Linux host-backed path
- `wayland` is a separate shipped Linux adapter family with its own runtime fragment and host requirements

That separation is deliberate. The public `jayess:window` API does not expose protocol-specific Wayland object names, registry details, surfaces, buffers, or seats. Those details stay inside focused Wayland runtime fragments rather than leaking into Jayess source or into the shared neutral window layer. The current Wayland implementation keeps protocol setup, input listeners, and software-buffer upload in separate generated-runtime source fragments:

- `src/cpp/runtime-window-wayland-source.js` for shared Wayland types, loader setup, host lifetime, and public adapter entry points
- `src/cpp/runtime-window-wayland-registry-source.js` for registry discovery, required-global checks, and xdg-shell listener wiring
- `src/cpp/runtime-window-wayland-input-source.js` for `wl_seat`, pointer, keyboard, close, and resize normalization
- `src/cpp/runtime-window-wayland-buffer-source.js` for shared-memory upload buffer allocation and cleanup

The shipped adapters share the same public queue shape for close, resize, keyboard, text input, mouse movement, and mouse button events. The Cocoa adapter polls `NSEvent` values for keyboard down/up, mouse movement, and mouse button down/up, then records the same normalized event objects as Win32 and X11. The Wayland adapter binds `wl_seat` when the compositor advertises it, creates pointer and keyboard listeners for advertised input capabilities, maps focused evdev-style key codes and pointer buttons, and records normalized Jayess events through the same queue helpers. Focus/minimize events stay deferred until all shipped adapters can expose deterministic, testable shapes without leaking platform-specific state. If the required host libraries, display/session path, compositor globals, input-seat capabilities, or shared-memory upload path are unavailable, the normalized unavailable diagnostic is used.

The current automated executable checks cover two layers:

- deterministic normalized unavailable diagnostics plus platform-neutral lifecycle/event-queue behavior on every host
- a host-conditional Win32 runtime probe for real create/show/present/resize/close behavior plus keyboard, text input, and mouse event normalization when a Win32 adapter is available
- a host-conditional Cocoa runtime probe for real create/show/present/close/title/poll behavior when a Cocoa adapter is available, plus output checks for normalized Cocoa keyboard and mouse bridge emission
- a host-conditional Linux/X11 runtime probe for real create/show/present/resize/close behavior plus keyboard, text input, and mouse event normalization when an X11 adapter and display are actually available
- a host-conditional Linux/Wayland runtime probe for real create/show/present/rename/close behavior when a Wayland compositor, `WAYLAND_DISPLAY`, and required input-seat capability path are actually available, plus output checks for normalized Wayland keyboard and pointer bridge emission

Hosts without Win32, Cocoa, X11, or Wayland support, or without an available display/session/input path, report those adapter-specific probes as clean skipped-host runtime checks rather than transpiler regressions.

Generated runtime metadata now lists `win32`, `cocoa`, `x11`, and `wayland` as distinct `jayess:window` adapter families. The current linked-library hints include the shipped Win32/X11 path plus the first Wayland client requirement through `wayland-client`.

The same metadata also records the normalized event families compiled into the generated project: `close`, `resize`, `key`, `text-input`, `pointer`, and `mouse-button`. This is capability metadata for the adapter-neutral queue shape, not a promise that every local host can open every adapter at runtime.

For generated Linux projects, the metadata now reports the compiled adapter set explicitly:

- `linux: ["x11", "wayland"]`

It also reports the current Linux selection policy:

- prefer `wayland` when `WAYLAND_DISPLAY` is set and the Wayland client path is available
- otherwise fall back to `x11` when the X11 client path is available

Unsupported hosts, missing host libraries, display-open failures, or unimplemented adapters throw:

```text
Jayess window host adapter is not available on this platform
```

The message keeps that stable prefix but now adds deliberate host detail where the runtime knows more, for example:

- `... (Windows Win32 adapter is not available on this host: CreateWindowExA failed)`
- `... (macOS Cocoa adapter is not available on this host: NSWindow allocation failed)`
- `... (Linux X11 adapter is not available on this host: XOpenDisplay failed)`
- `... (Linux Wayland adapter is not available on this host: wl_display_connect failed)`
- `... (Linux Wayland adapter is not available on this host: wl_compositor global was not advertised)`
- `... (Linux Wayland adapter is not available on this host: wl_shm global was not advertised)`
- `... (Linux Wayland adapter is not available on this host: xdg_wm_base global was not advertised)`
- `... (Linux Wayland adapter is not available on this host: wl_seat global was not advertised for input event support)`
- `... (Linux Wayland adapter is not available on this host: wl_seat did not advertise pointer or keyboard input capabilities)`
- `... (Linux Wayland adapter is not available on this host: shared-memory upload file creation failed)`
- `... (Linux Wayland adapter is not available on this host: wl_buffer creation failed)`
- `... (Linux window support requires a usable X11 or Wayland adapter on this host)`

## Presentation

`present(window, canvas)` validates that the second argument is a `jayess:canvas` object with a software image buffer, records the presented dimensions, and routes presentation through the platform adapter boundary. It should not make `jayess:canvas` depend on native windows or GPU APIs.

The Windows adapter creates, shows, renames, closes, and polls a native Win32 window through dynamically loaded `user32` functions, then uploads the software RGBA canvas buffer through a narrow GDI DIB path. The Cocoa adapter creates, shows, renames, closes, and presents through dynamically loaded `libobjc` / `AppKit` message sends, using `NSWindow`, `NSImageView`, `NSBitmapImageRep`, and `NSImage` for the first software-buffer slice. The Linux adapter now has two separate host-backed paths: X11 and Wayland. The Wayland path keeps compositor/registry/surface/buffer/seat details inside its own runtime fragment, uses a shared-memory software buffer, and normalizes close, resize, keyboard, text input, pointer movement, and pointer button events through the same Jayess queue shape. Canvas presentation uploads the software RGBA canvas buffer through the adapter-specific upload path, records the presented canvas dimensions, and flushes or updates the host window. If the required host libraries, display/session path, upload functions, compositor protocol support, input-seat capabilities, or host window are unavailable, `present` reports the normalized host-unavailable diagnostic.

## Boundaries

This module is not a browser DOM, not Node.js GUI compatibility, and not a GPU API. GPU acceleration belongs in a later `jayess:gpu` layer.

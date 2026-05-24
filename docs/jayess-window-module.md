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
- `{ type: "mouseMove", x, y }`
- `{ type: "mouseDown", button, x, y, pressed: true }`
- `{ type: "mouseUp", button, x, y, pressed: false }`

Keys normalize letters to lowercase and preserve digits, arrows, escape, enter, tab, space, shift, control, alt, and meta. Unknown keys use `"unknown"`.

Mouse buttons normalize to `"left"`, `"middle"`, `"right"`, or `"unknown"`.

`requestClose(window)` records close intent and queues a normalized close event without destroying the host window handle. `shouldClose(window)` reports whether the handle has been closed or a close request has been queued.

`requestFrame(window, callback, args)` is the first narrow Jayess-owned event-loop helper. It is built on `jayess:timers` and schedules one zero-delay callback tick associated with a window. The callback still owns `pollEvents(window)` explicitly; the helper does not hide event draining or create a broad implicit app loop. If `shouldClose(window)` is already true when the scheduled frame tick runs, the callback is skipped and the frame handle resolves to `null`.

`cancelFrame(handle)` cancels a scheduled frame handle through the same underlying timer-cancellation path as `jayess:timers`.

The current platform-neutral lifecycle invariants are explicit:

- `show(window)` is idempotent for an already shown open window
- `requestClose(window)` does not queue duplicate close events once close intent is already recorded
- `close(window)` preserves already queued events, appends one final normalized close event when needed, marks the handle closed, and clears the shown state
- `present(window, canvas)` records the presented software-buffer dimensions through the neutral runtime layer before the platform adapter uploads pixels
- `requestFrame(window, callback, args)` shares the timer scheduler with `jayess:timers` but keeps `pollEvents(window)` explicit in user callback code

## Platform Boundary

The module is cross-platform by shape, but host support lives behind focused platform adapters. Runtime files should stay split by responsibility:

- platform-neutral window handle validation and public primitives
- Windows adapter
- macOS adapter
- Linux adapter

The current host-backed adapters are:

- Windows/Win32 through a narrow dynamically loaded `user32` / `gdi32` path
- macOS/Cocoa through a narrow dynamically loaded `libobjc` / `AppKit` path
- Linux/X11 through a narrow dynamically loaded X11 path
- Linux/Wayland through a narrow dynamically loaded `libwayland-client` path with `xdg-shell` surface/toplevel setup

The Linux adapter boundary is now explicit in the project contract:

- `x11` is one shipped Linux host-backed path
- `wayland` is a separate shipped Linux adapter family with its own runtime fragment and host requirements

That separation is deliberate. The public `jayess:window` API does not expose protocol-specific Wayland object names, registry details, surfaces, buffers, or seats. Those details must stay inside a later focused Wayland runtime fragment rather than leaking into Jayess source or into the shared neutral window layer.

The shipped adapters share the same public queue shape for close, resize, keyboard, mouse movement, and mouse button events. The current Cocoa slice is intentionally narrower than the Win32 and X11 slices: it provides real create/show/close/title/present behavior and focused NSEvent polling through the same normalized surface, while fuller host-backed parity is still a later refinement slice. The first Wayland slice is intentionally narrower than the X11 slice too: it covers create/show/close, title updates, resize/close normalization, and software-buffer presentation, but not keyboard/mouse normalization yet. If the required host libraries or display/session path are unavailable, the normalized unavailable diagnostic is used.

The current automated executable checks cover two layers:

- deterministic normalized unavailable diagnostics plus platform-neutral lifecycle/event-queue behavior on every host
- a host-conditional Win32 runtime probe for real create/show/present/resize/close behavior plus keyboard and mouse event normalization when a Win32 adapter is available
- a host-conditional Cocoa runtime probe for real create/show/present/close/title/poll behavior when a Cocoa adapter is available
- a host-conditional Linux/X11 runtime probe for real create/show/present/resize/close behavior plus keyboard and mouse event normalization when an X11 adapter and display are actually available
- a host-conditional Linux/Wayland runtime probe for real create/show/present/rename/close behavior when a Wayland compositor and `WAYLAND_DISPLAY` are actually available

Hosts without Win32, Cocoa, or X11 support, or without an available X11 display/session path, report those adapter-specific probes as clean skipped-host runtime checks rather than transpiler regressions.

Generated runtime metadata now lists `win32`, `cocoa`, `x11`, and `wayland` as distinct `jayess:window` adapter families. The current linked-library hints include the shipped Win32/X11 path plus the first Wayland client requirement through `wayland-client`.

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
- `... (Linux window support requires a usable X11 or Wayland adapter on this host)`

## Presentation

`present(window, canvas)` validates that the second argument is a `jayess:canvas` object with a software image buffer, records the presented dimensions, and routes presentation through the platform adapter boundary. It should not make `jayess:canvas` depend on native windows or GPU APIs.

The Windows adapter creates, shows, renames, closes, and polls a native Win32 window through dynamically loaded `user32` functions, then uploads the software RGBA canvas buffer through a narrow GDI DIB path. The Cocoa adapter creates, shows, renames, closes, and presents through dynamically loaded `libobjc` / `AppKit` message sends, using `NSWindow`, `NSImageView`, `NSBitmapImageRep`, and `NSImage` for the first software-buffer slice. The Linux adapter now has two separate host-backed paths: X11 and Wayland. The Wayland path keeps compositor/registry/surface/buffer details inside its own runtime fragment, uses a shared-memory software buffer, and normalizes close plus resize events through the same Jayess queue shape. Canvas presentation uploads the software RGBA canvas buffer through the adapter-specific upload path, records the presented canvas dimensions, and flushes or updates the host window. If the required host libraries, display/session path, upload functions, compositor protocol support, or host window are unavailable, `present` reports the normalized host-unavailable diagnostic.

## Boundaries

This module is not a browser DOM, not Node.js GUI compatibility, and not a GPU API. GPU acceleration belongs in a later `jayess:gpu` layer.

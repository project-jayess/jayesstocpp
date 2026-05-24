# `jayess:window` Module

`jayess:window` owns live native window presentation for Jayess rendering. It is separate from `jayess:canvas`: canvas keeps portable CPU/off-screen rendering, while window owns host windows, presentation, and input event polling.

## First Surface

- `create(options)`
- `show(window)`
- `close(window)`
- `shouldClose(window)`
- `requestClose(window)`
- `pollEvents(window)`
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

## Platform Boundary

The module is cross-platform by shape, but host support lives behind focused platform adapters. Runtime files should stay split by responsibility:

- platform-neutral window handle validation and public primitives
- Windows adapter
- macOS adapter
- Linux adapter

The first host-backed adapter is Linux/X11 loaded dynamically at runtime. It polls close, resize, keyboard, mouse movement, and mouse button events through dynamically loaded X11 event functions. If X11 is unavailable, or if the display cannot be opened, the normalized unavailable diagnostic is used. Windows and macOS adapters keep the same guarded boundary until their native host implementations are filled in.

Unsupported hosts, missing host libraries, display-open failures, or unimplemented adapters throw:

```text
Jayess window host adapter is not available on this platform
```

## Presentation

`present(window, canvas)` validates that the second argument is a `jayess:canvas` object with a software image buffer, records the presented dimensions, and routes presentation through the platform adapter boundary. It should not make `jayess:canvas` depend on native windows or GPU APIs.

The Linux adapter creates, shows, renames, closes, and flushes a native X11 window. Canvas presentation uploads the software RGBA canvas buffer through dynamically loaded X11 image functions, records the presented canvas dimensions, and flushes the host window. If X11, a display, image upload functions, or the host window are unavailable, `present` reports the normalized host-unavailable diagnostic.

## Boundaries

This module is not a browser DOM, not Node.js GUI compatibility, and not a GPU API. GPU acceleration belongs in a later `jayess:gpu` layer.

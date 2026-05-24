# Jayess Native GUI And Rendering

Jayess should provide cross-platform native rendering through Jayess-owned standard-library modules instead of ambient browser APIs or Node.js GUI packages.

The planned module family is:

- `jayess:color` for color values, parsing, conversion, blending, and palette helpers.
- `jayess:image` for pixel buffers, image dimensions, pixel access, and simple image file output.
- `jayess:canvas` for off-screen 2D drawing operations over image buffers.
- `jayess:window` for live native windows, frame presentation, input events, and event-loop integration.
- `jayess:gui` for the Jayess-owned default widget toolkit over layout, canvas, and normalized window events.
- `jayess:gpu` for optional GPU devices, surfaces, buffers, textures, shaders, pipelines, and draw commands.

The current implemented rendering path is off-screen plus a guarded window presentation boundary: `jayess:canvas` draws into a `jayess:image` software pixel buffer and `savePpm` writes that buffer to a file. `jayess:window` owns live screen presentation through platform adapters.

## Design Goals

- Keep the public API under `jayess:*`.
- Keep portable software rendering available without external GUI libraries.
- Keep live native window rendering cross-platform by isolating platform adapters.
- Keep GPU acceleration optional and isolated behind explicit backend adapters.
- Keep rendering runtime files small and split by responsibility.
- Keep generated project metadata explicit about native window, GPU backend, and platform adapter requirements.

## Layering

`jayess:color` is the lowest layer. It should produce deterministic color values that can be consumed by image and canvas helpers.

`jayess:image` owns raster image buffers. It supports pixel access, dimensions, simple transformations, metadata reads, deterministic file output such as PPM/PGM/BMP/TGA, and PPM byte encode/decode before more complex encoders are added.

`jayess:canvas` owns higher-level drawing. The current slice supports dimensions, pixel reads, deep copies, clipped image/canvas blits, a focused clip-stack state layer for clip-aware helpers, rectangles, alpha rectangle blending, circles, lines, polylines, polygons, text boxes, and image output over `jayess:image` buffers. Bitmap text alignment is provided by `jayess:font` over the same canvas surface.

`jayess:image` still owns image-buffer manipulation as data: deterministic file formats, bytes helpers, crop/subimage/resize/flip/rotate, and image-level bulk rectangle/blit operations. `jayess:canvas` should sit above that layer rather than duplicate it.

`jayess:window` should own live native window behavior. It should create/show/close windows, track close requests, poll normalized input events, expose window size and title state, and present a validated `jayess:canvas` image buffer to the screen.

`jayess:gui` should own Jayess's default GUI toolkit direction. The first slice is intentionally small: application/window state, widget tree, layout pass, paint pass, action-queue event dispatch, and a narrow label/button/panel plus row/column/stack layout surface. It stays purely canvas-based and consumes `jayess:window` events explicitly instead of hiding the host loop.

`jayess:gpu` should own accelerated rendering behavior. It should not replace `jayess:canvas`; it should provide a separate optional API for GPU resources and draw commands that can present into a `jayess:window` surface when a backend is available.
The current `jayess:gpu` slices provide the public module, handle shape, guarded backend boundary, backend capability metadata on runtime handles, deterministic command validation, frame lifecycle checks, and normalized backend-unavailable diagnostics.
The currently shipped executable backends are:

- the always-available `validation` backend for deterministic clear/draw/end-frame execution and testing
- the first host-backed Win32 `direct3d` surface-present slice
- the first host-backed Cocoa `metal` surface-present slice

Those host-backed slices stay deliberately narrow: they bind GPU frames to real native window surfaces and complete a focused present path without widening yet into a full cross-platform shader/swapchain/resource model.

## Runtime Shape

The preferred implementation is:

- Jayess wrappers in `stdlib/jayess/color/`, `stdlib/jayess/image/`, and `stdlib/jayess/canvas/`.
- Focused C++ runtime fragments where native storage or platform behavior is needed, such as `runtime-image-source.js`.
- A focused `stdlib/jayess/window/` module and `runtime-window-source.js` when live window support is implemented.
- A focused `stdlib/jayess/gpu/` module and `runtime-gpu-source.js` when GPU support is implemented.
- Platform-window adapter files split by operating system when live rendering requires host APIs.
- GPU backend adapter files split by graphics API and platform when accelerated rendering requires host APIs.

The first `jayess:window` slices provide the public module, handle shape, guarded adapter boundary, normalized platform-unavailable diagnostics, Win32/Cocoa/Linux software-buffer presentation, and focused host-event polling. The Windows adapter creates and manages a Win32 window through dynamically loaded `user32` / `gdi32` symbols, uploads validated `jayess:canvas` pixel buffers through a DIB/GDI path, and converts host events through the same adapter boundary. The Cocoa adapter creates and manages an `NSWindow` through dynamically loaded `libobjc` / `AppKit` symbols and presents software buffers through `NSImageView` / `NSBitmapImageRep` / `NSImage` without changing the generated-file model. The Linux runtime now emits separate X11 and Wayland adapter paths: X11 owns the fuller first event slice, while Wayland owns the first create/show/close/title/present plus resize/close normalization slice through a narrow `libwayland-client` + `xdg-shell` client path.
The event queue shape is stable across adapters: close, resize, keyboard, mouse movement, and mouse button events use the same object fields on every host.
The current automated runtime checks cover deterministic unavailable diagnostics plus platform-neutral lifecycle and event-queue behavior on every host, then add host-conditional real lifecycle/present/event verification for Win32, focused lifecycle/title/present/poll verification for Cocoa, full lifecycle/present/event verification for Linux/X11 when that adapter and display are available, and focused lifecycle/present verification for Linux/Wayland when a compositor and `WAYLAND_DISPLAY` are available.
The first shared event-loop helper remains explicit and Jayess-owned: `jayess:window` layers `requestFrame(window, callback, args)` over `jayess:timers` instead of introducing a separate hidden platform loop. Real apps still call `pollEvents(window)` in their frame/update callback when they want to drain host events.

The first `jayess:gui` slice keeps that same explicit model. Toolkit code still owns:

- `pollEvents(window)`
- `update(windowState, events)`
- `drainActions(windowState)`
- explicit state mutation plus `invalidate(windowState)`
- `draw(windowState, canvas)`
- `present(window, canvas)`

The Linux host boundary is intentionally split in project metadata and runtime structure:

- `x11` for one shipped Linux adapter
- `wayland` for a separate shipped Linux adapter family

That split exists so Linux windowing does not collapse into one mixed adapter bucket. The public Jayess API should stay protocol-neutral even though the generated runtime now contains both adapter families.

Generated metadata now reports that Linux projects compile both adapter families and records the current selection order: prefer Wayland when `WAYLAND_DISPLAY` is set and the Wayland client path is available, otherwise fall back to X11 when available.

Do not place a full GUI stack into one runtime source file.

## Window Adapter Direction

Live screen rendering should be added by small platform adapters, not by folding every host API into `jayess:canvas`.

The preferred no-default-third-party path is:

- Windows: Win32 window creation plus a DIB/GDI presentation path for the first software-buffer slice.
- macOS: Cocoa adapter isolated in a focused runtime file, with Objective-C runtime calls kept behind a narrow dynamic bridge.
- Linux: X11 and Wayland as separate adapter families rather than one generic Linux adapter.

The first live-window surface should stay small:

- `create(options)`
- `show(window)`
- `close(window)`
- `shouldClose(window)`
- `requestClose(window)`
- `pollEvents(window)`
- `present(window, canvas)`
- `width(window)` and `height(window)`
- `setTitle(window, title)`

Unsupported host platforms should fail with clear platform-unavailable diagnostics.

## GPU Adapter Direction

Jayess can expose a Jayess-owned GPU API, but generated native code still has to use operating-system and driver graphics APIs. User programs should import `jayess:gpu`; they should not be forced to write directly against backend-specific C++ APIs for ordinary accelerated drawing.

The first `jayess:gpu` surface should stay explicit and small:

- `createDevice(options)`
- `createSurface(window)`
- `createBuffer(device, options)`
- `createTexture(device, options)`
- `createShader(device, source)`
- `createPipeline(device, options)`
- `beginFrame(surface)`
- `clear(frame, color)`
- `draw(frame, pipeline, resources)`
- `endFrame(frame)`

Backend adapters should stay isolated, for example:

- Windows: Direct3D adapter first.
- macOS: Metal adapter first.
- Linux: OpenGL adapter first, with Vulkan kept as a later separate slice.

Vulkan is a good Windows/Linux backend candidate, but it is not native on macOS without a compatibility layer such as MoltenVK. If the no-default-third-party policy is kept, macOS GPU support should use Metal directly.

The Linux first-slice choice is now explicit: OpenGL lands before Vulkan so the first Linux host-backed GPU milestone stays bounded to one truthful clear/draw/present path instead of expanding immediately into swapchain and synchronization-heavy Vulkan setup.

The first real host-backed slice is now tracked separately in [gpu-backend-slice.md](./gpu-backend-slice.md) so resource lifetime, texture format, shader policy, pipeline shape, and presentation model remain independent implementation tasks instead of collapsing into one umbrella GPU milestone. The current emitted metadata now records that Windows compiles `validation` plus `direct3d`, macOS compiles `validation` plus `metal`, and Linux still compiles `validation` plus the later `opengl` / `vulkan` backend families.

## Dependency Policy

The first portable slice should not depend on a copied third-party GUI toolkit. It should provide software rendering and image output with the standard C++ runtime support already used by Jayess.

Live window rendering should use platform-native adapters first. GPU rendering should use explicit backend adapters behind `jayess:gpu`. Later explicit backend modules such as `jayess:glfw`, `jayess:webview`, `jayess:vulkan`, or `jayess:metal` can exist, but those dependencies must be visible in generated metadata and isolated from pure image rendering.

## Example Direction

```js
import { create as createCanvas, fillRect, savePpm } from "jayess:canvas";
import { rgb } from "jayess:color";

var canvas = createCanvas(640, 480, { title: "Jayess" });
fillRect(canvas, 20, 20, 160, 80, rgb(40, 120, 220));
savePpm(canvas, "frame.ppm");
```

This document describes the feature direction. Keep diagnostics explicit until each module slice is implemented.

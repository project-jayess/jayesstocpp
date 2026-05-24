# Jayess Native GUI And Rendering

Jayess should provide cross-platform native rendering through Jayess-owned standard-library modules instead of ambient browser APIs or Node.js GUI packages.

The planned module family is:

- `jayess:color` for color values, parsing, conversion, blending, and palette helpers.
- `jayess:image` for pixel buffers, image dimensions, pixel access, and simple image file output.
- `jayess:canvas` for off-screen 2D drawing operations over image buffers.
- `jayess:window` for live native windows, frame presentation, input events, and event-loop integration.
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

`jayess:canvas` owns higher-level drawing. The current slice supports dimensions, pixel reads, deep copies, clipped image/canvas blits, rectangles, alpha rectangle blending, circles, lines, polylines, polygons, text boxes, and image output over `jayess:image` buffers. Bitmap text alignment is provided by `jayess:font` over the same canvas surface.

`jayess:window` should own live native window behavior. It should create/show/close windows, track close requests, poll normalized input events, expose window size and title state, and present a validated `jayess:canvas` image buffer to the screen.

`jayess:gpu` should own accelerated rendering behavior. It should not replace `jayess:canvas`; it should provide a separate optional API for GPU resources and draw commands that can present into a `jayess:window` surface when a backend is available.
The current `jayess:gpu` slices provide the public module, handle shape, guarded backend boundary, backend capability metadata on runtime handles, deterministic command validation, frame lifecycle checks, and normalized backend-unavailable diagnostics.

## Runtime Shape

The preferred implementation is:

- Jayess wrappers in `stdlib/jayess/color/`, `stdlib/jayess/image/`, and `stdlib/jayess/canvas/`.
- Focused C++ runtime fragments where native storage or platform behavior is needed, such as `runtime-image-source.js`.
- A focused `stdlib/jayess/window/` module and `runtime-window-source.js` when live window support is implemented.
- A focused `stdlib/jayess/gpu/` module and `runtime-gpu-source.js` when GPU support is implemented.
- Platform-window adapter files split by operating system when live rendering requires host APIs.
- GPU backend adapter files split by graphics API and platform when accelerated rendering requires host APIs.

The first `jayess:window` slices provide the public module, handle shape, guarded adapter boundary, normalized platform-unavailable diagnostics, Linux/X11 software-buffer presentation, and Linux/X11 event polling. The Linux adapter creates and manages an X11 window through dynamically loaded host symbols when available, uploads validated `jayess:canvas` pixel buffers, and converts host events through the same adapter boundary.
The event queue shape is stable across adapters: close, resize, keyboard, mouse movement, and mouse button events use the same object fields on every host.

Do not place a full GUI stack into one runtime source file.

## Window Adapter Direction

Live screen rendering should be added by small platform adapters, not by folding every host API into `jayess:canvas`.

The preferred no-default-third-party path is:

- Windows: Win32 window creation plus a DIB/GDI presentation path for the first software-buffer slice.
- macOS: Cocoa/CoreGraphics adapter isolated in an Objective-C++ or platform-specific runtime file.
- Linux: X11 adapter first, with Wayland as a later adapter when the build story is explicit.

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
- Linux: Vulkan or OpenGL adapter depending on the selected first slice.

Vulkan is a good Windows/Linux backend candidate, but it is not native on macOS without a compatibility layer such as MoltenVK. If the no-default-third-party policy is kept, macOS GPU support should use Metal directly.

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

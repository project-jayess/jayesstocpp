# `jayess:gpu` Module

`jayess:gpu` owns optional accelerated rendering handles for Jayess. It is separate from `jayess:canvas`: canvas remains portable CPU rendering, while GPU support is explicit and backend-scoped.

## Surface

- `createDevice(options)`
- `createSurface(window)`
- `createBuffer(device, options)`
- `createTexture(device, options)`
- `uploadImage(texture, image)`
- `createShader(device, source)`
- `createPipeline(device, options)`
- `beginFrame(surface)`
- `clear(frame, color)`
- `draw(frame, pipeline, resources)`
- `endFrame(frame)`

`createDevice` accepts an options object with:

- `backend`: `"host"`, `"validation"`, `"direct3d"`, `"metal"`, `"vulkan"`, or `"opengl"`

`"host"` currently selects the deterministic `validation` backend. That backend is always available and exists so frame lifecycle, clear/draw command validation, and executable runtime tests do not depend entirely on host GPU APIs.

Current handles are still intentionally narrow and validation-oriented:

- device
- surface
- buffer
- texture
- shader
- pipeline
- frame

They validate argument shape and frame lifecycle, but they do not yet expose a wide real-backend resource model.

The runtime handle layout is now intentionally grouped into small stable buckets instead of one growing ad hoc state object:

- `backend`
- `capabilities` for availability plus clear/draw support
- `surface` metadata for window-backed surfaces
- `texture` metadata for texture handles
- `frame` state for open/ended lifecycle, recorded commands, and the validated clear color

That keeps later backend slices from depending on unrelated top-level fields.

## Backend Boundary

Backend code stays isolated from user imports and from `jayess:canvas`:

- Validation adapter
- Direct3D adapter
- Metal adapter
- Vulkan adapter
- OpenGL adapter

The shipped distinction is:

- `validation`: real deterministic command path, no host acceleration
- `direct3d`: first host-backed Windows surface-present path
- `metal`: first host-backed macOS surface-present path
- `vulkan`, `opengl`: explicit later host backend families, still guarded placeholders

Unsupported or unimplemented backends throw:

```text
Jayess GPU backend is not available: <backend>
```

## Frame Commands

`clear(frame, color)` records the frame clear color using the `jayess:color` object shape. It validates `red`, `green`, `blue`, and `alpha` consistently before wider host-backed drawing exists. `draw(frame, pipeline, resources)` validates frame and pipeline handles and accepts resources as an object, array, or `null`. Both helpers record deterministic frame commands so backend adapters can consume the same command list later.

Frame commands require an active frame created by `beginFrame(surface)`. Calling `clear`, `draw`, or `endFrame` with the wrong handle kind or after `endFrame` raises a focused runtime diagnostic.

`endFrame(frame)` routes recorded clear commands through the selected backend adapter boundary when the frame is backed by an available backend. For the current shipped `validation` backend, this path completes deterministically without host GPU APIs. For the current `direct3d` and `metal` slices, the adapter completes a narrow window-surface present path by binding the active frame to a real native window surface and recording presented dimensions through that host-backed boundary. Unavailable host backends keep reporting the normalized backend-unavailable diagnostic.

`createSurface(window)` now selects the first host-backed backend where one exists:

- Windows: `direct3d`
- macOS: `metal`
- Linux and other hosts: `validation`

That selection is intentionally surface-only for now. `createDevice({ backend: "host" })` still selects `validation`, so real host-backed execution remains explicit until the wider backend resource and pipeline slices are more mature.

`createTexture(device, options)` now records only the current minimal stable texture metadata the Jayess layer needs:

- `width`
- `height`
- `format`

The current format is fixed to `rgba8unorm` for the deterministic validation path.

`uploadImage(texture, image)` is the first narrow resource-upload path. It copies RGBA pixels from a `jayess:image` handle into a GPU texture handle without making `jayess:canvas` depend on GPU APIs.

Current `uploadImage` rules are explicit:

- the first argument must be a texture handle created by `createTexture`
- the second argument must be a `jayess:image` handle
- image dimensions must match the target texture exactly
- the copied pixels stay in deterministic validation-backend storage for now

This slice is intentionally image-only. It does not add generic buffer uploads, staging resources, readback, or canvas-to-GPU coupling.

## First Real Backend Slice

The first real host-backed backend slice is defined separately in [gpu-backend-slice.md](./gpu-backend-slice.md). It keeps these concerns separate instead of landing one broad GPU umbrella:

- resource lifetime
- texture format subset
- shader source policy
- pipeline shape
- presentation model

That backend plan now also fixes the first Linux host-backed implementation order explicitly:

- `opengl` first
- `vulkan` later as a separate slice

## Current Executable Verification

The current executable verification layers are:

- deterministic validation-backend command execution and backend-unavailable diagnostics on every host
- focused Win32 `direct3d` surface clear/draw/present verification when the Win32 window adapter and the local executable-test toolchain are both available
- focused Cocoa `metal` surface clear/draw/present verification when the Cocoa window adapter is available

Linux host-backed GPU verification remains a later slice.

## Role

The current shipped surface establishes handles for devices, surfaces, buffers, textures, shaders, pipelines, and frames. It also validates buffer, texture, shader, pipeline, frame lifecycle, and command resource shapes, includes a deterministic validation backend for executable testing, and now includes first host-backed Win32/Cocoa surface presentation slices behind the `direct3d` and `metal` adapter boundaries. Linux host-backed drawing still needs to land inside the focused backend adapters without changing the Jayess import surface.

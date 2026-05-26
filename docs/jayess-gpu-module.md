# `jayess:gpu` Module

`jayess:gpu` owns optional accelerated rendering handles for Jayess. It is separate from `jayess:canvas`: canvas remains portable CPU rendering, while GPU support is explicit and backend-scoped.

## Surface

- `createDevice(options)`
- `createSurface(window)`
- `createBuffer(device, options)`
- `createTexture(device, options)`
- `uploadBuffer(buffer, data)`
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

They validate argument shape, resource metadata, and frame lifecycle, but they do not expose a wide real-backend descriptor model.

The runtime handle layout is now intentionally grouped into small stable buckets instead of one growing ad hoc state object:

- `backend`
- `capabilities` for availability plus clear/draw support
- `surface` metadata for window-backed surfaces
- `buffer` metadata for byte uploads and usage
- `texture` metadata for texture handles
- `frame` state for open/ended lifecycle, recorded commands, validated resource bindings, and the validated clear color
- `shader` metadata for stage and source
- `pipeline` metadata for shader pair and primitive shape

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
- `opengl`: first Linux host-backed slice using a guarded dynamic `libGL` path for clear and image texture upload
- `vulkan`: guarded Linux loader and instance-probe slice using `libvulkan.so.1`

Unsupported or unimplemented backends throw:

```text
Jayess GPU backend is not available: <backend>
```

## Frame Commands

`clear(frame, color)` records the frame clear color using the `jayess:color` object shape. It validates `red`, `green`, `blue`, and `alpha` consistently before wider host-backed drawing exists. `draw(frame, pipeline, resources)` validates frame and pipeline handles and accepts resources as an object, array, or `null`. Backends without draw support, including the current Vulkan slice, report the existing focused unsupported-draw diagnostic instead of pretending to execute a real graphics pipeline. Supported draw paths record deterministic `draw:<primitive>` frame commands so backend adapters can consume the same command list later.

The first descriptor-backed resource shape is validation-only and intentionally small:

```js
draw(frame, pipeline, {
  vertexBuffers: [{ slot: 0, buffer }],
  textures: [{ slot: 1, texture }]
});
```

`vertexBuffers` must be an array of objects with a `buffer` handle created by `createBuffer(...)`; the buffer must use `usage: "vertex"`. `textures` must be an array of objects with a `texture` handle created by `createTexture(...)`; the texture must be initialized with `uploadImage(...)` before drawing. `slot` is optional and defaults to the descriptor index. Resource backends must match the active frame backend. The legacy `{ buffer, texture }` object form remains accepted and is normalized through the same validation path.

Validated bindings are recorded on the frame as stable metadata such as `vertexBuffer:0:4` and `texture:1:1x1`, and the validation backend records matching `bind:<metadata>` commands after the draw command. Host-backed draw-capable backends also convert those validated descriptors into backend-owned `hostBind:<backend>:<metadata>` command records. The first conversion slice is still descriptor metadata conversion; it does not add broad shader compilation, swapchain, render-pass, or backend-native descriptor APIs.

Frame commands require an active frame created by `beginFrame(surface)`. Calling `clear`, `draw`, or `endFrame` with the wrong handle kind or after `endFrame` raises a focused runtime diagnostic.

`endFrame(frame)` routes recorded clear commands through the selected backend adapter boundary when the frame is backed by an available backend. For the current shipped `validation` backend, this path completes deterministically without host GPU APIs. For the current `direct3d` and `metal` slices, the adapter completes a narrow window-surface present path by binding the active frame to a real native window surface and recording presented dimensions through that host-backed boundary. On Linux, `vulkan` first dynamically probes `libvulkan.so.1`, `vkGetInstanceProcAddr`, and a minimal `vkCreateInstance` path before selecting compatible X11 or Wayland window handles. The current Vulkan clear path is still intentionally narrow: it validates the backend and records the window-present boundary without adding swapchains, command buffers, shaders, or resource ownership. If Vulkan is unavailable, the Linux `opengl` slice dynamically probes `libGL.so.1`, selects an X11-backed `jayess:window` surface when the host window exposes an X11 display/window pair, and routes clear through `glClearColor` plus `glClear`. Unavailable host backends keep reporting the normalized backend-unavailable diagnostic.

`createSurface(window)` now selects the first host-backed backend where one exists:

- Windows: `direct3d`
- macOS: `metal`
- Linux/X11 or Linux/Wayland: `vulkan` when the guarded Vulkan loader and instance probe are available
- Linux/X11: `opengl` when Vulkan is unavailable and the X11 window handle and dynamic OpenGL functions are available
- other Linux and unsupported hosts: `validation`

That selection is intentionally surface-only for now. `createDevice({ backend: "host" })` still selects `validation`, so real host-backed execution remains explicit until the wider backend resource and pipeline slices are more mature.

`createTexture(device, options)` now records only the current minimal stable texture metadata the Jayess layer needs:

- `width`
- `height`
- `format`
- `host_texture` for backend-owned texture upload state

The current format is fixed to `rgba8unorm` for the deterministic validation path.

`createBuffer(device, options)` records a deterministic buffer allocation:

- `size`: positive integer, default `1`
- `usage`: `"vertex"`, `"index"`, `"uniform"`, or `"storage"`, default `"vertex"`

`uploadBuffer(buffer, data)` accepts either a `jayess:bytes` value or a numeric array of byte values. Numeric array items must be integers from `0` through `255`, and uploaded data must fit within the declared buffer size. Short uploads zero-fill the remaining deterministic buffer storage.

`uploadImage(texture, image)` is the first narrow resource-upload path. It copies RGBA pixels from a `jayess:image` handle into a GPU texture handle without making `jayess:canvas` depend on GPU APIs.

Current `uploadImage` rules are explicit:

- the first argument must be a texture handle created by `createTexture`
- the second argument must be a `jayess:image` handle
- image dimensions must match the target texture exactly
- the copied pixels stay in deterministic storage on every backend
- the Linux `opengl` slice also uploads the same RGBA bytes through the guarded `glTexImage2D` path when OpenGL is available

Texture upload is intentionally image-only. It does not add staging resources, readback, or implicit `jayess:canvas` coupling.

The current shader policy is deliberately small:

- `createShader(device, "source")` keeps the existing string form and treats it as a vertex shader.
- `createShader(device, { stage, source })` accepts `stage: "vertex"` or `stage: "fragment"` with non-empty source text.

`createPipeline(device, options)` accepts a minimal descriptor:

- `vertexShader`: optional vertex shader handle
- `fragmentShader`: optional fragment shader handle
- `primitive`: `"triangles"` or `"lines"`, default `"triangles"`

The legacy `{ shader }` form remains accepted for a vertex shader. This keeps old code compiling while making the validation resource model explicit.

## First Real Backend Slice

The first real host-backed backend slice is defined separately in [gpu-backend-slice.md](./gpu-backend-slice.md). It keeps these concerns separate instead of landing one broad GPU umbrella:

- resource lifetime
- texture format subset
- shader source policy
- pipeline shape
- presentation model

That backend plan now keeps Linux backend responsibilities explicit:

- `opengl` owns the first Linux texture-upload path
- `vulkan` owns a guarded loader, surface-compatibility, and clear-present probe path

## Current Executable Verification

The current executable verification layers are:

- deterministic validation-backend command execution and backend-unavailable diagnostics on every host
- focused Win32 `direct3d` surface clear/draw/present verification when the Win32 window adapter and the local executable-test toolchain are both available
- focused Cocoa `metal` surface clear/draw/present verification when the Cocoa window adapter is available
- focused Linux `opengl` availability, X11-surface selection, clear-frame, and image texture upload verification when dynamic OpenGL is available
- focused Linux `vulkan` availability, X11/Wayland-compatible surface selection, and clear-present verification when dynamic Vulkan is available

## Role

The current shipped surface establishes handles for devices, surfaces, buffers, textures, shaders, pipelines, and frames. It also validates buffer, texture, shader, pipeline, descriptor-backed draw resources, frame lifecycle, and command resource shapes, includes a deterministic validation backend for executable testing, and now includes host-backed Win32/Cocoa/Linux surface presentation slices behind the `direct3d`, `metal`, `vulkan`, and `opengl` adapter boundaries. Vulkan stays narrow so the Linux backend path does not absorb a full swapchain/resource implementation in one pass.

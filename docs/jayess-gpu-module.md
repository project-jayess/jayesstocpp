# `jayess:gpu` Module

`jayess:gpu` owns optional accelerated rendering handles for Jayess. It is separate from `jayess:canvas`: canvas remains portable CPU rendering, while GPU support is explicit and backend-backed.

## First Surface

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

`createDevice` accepts an options object with:

- `backend`: `"host"`, `"direct3d"`, `"metal"`, `"vulkan"`, or `"opengl"`

`"host"` selects the host default backend. The guarded implementation exposes the API and backend boundary, records backend capability metadata on runtime handles, validates command shapes deterministically, and reports backend-unavailable diagnostics until real adapters are implemented.

## Backend Boundary

Backend code stays isolated from user imports and from `jayess:canvas`:

- Direct3D adapter
- Metal adapter
- Vulkan adapter
- OpenGL adapter

Unsupported or unimplemented backends throw:

```text
Jayess GPU backend is not available: <backend>
```

## Frame Commands

`clear(frame, color)` records the frame clear color using the `jayess:color` object shape. It validates `red`, `green`, `blue`, and `alpha` consistently before backend drawing exists. `draw(frame, pipeline, resources)` validates frame and pipeline handles and accepts resources as an object, array, or `null`. Both helpers record deterministic frame commands so backend adapters can consume the same command list later.

Frame commands require an active frame created by `beginFrame(surface)`. Calling `clear`, `draw`, or `endFrame` with the wrong handle kind or after `endFrame` raises a focused runtime diagnostic.

`endFrame(frame)` routes recorded clear commands through the selected backend adapter boundary when the frame is backed by an available backend. Unavailable backends keep reporting the normalized backend-unavailable diagnostic.

## Role

The first slices establish handles for devices, surfaces, buffers, textures, shaders, pipelines, and frames. They also validate buffer, texture, shader, pipeline, frame lifecycle, and command resource shapes. Real accelerated drawing should be added inside backend adapters without changing the Jayess import surface.

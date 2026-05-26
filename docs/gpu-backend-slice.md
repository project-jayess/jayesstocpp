# GPU Backend Slice

This document defines the first real host-backed `jayess:gpu` slice separately from the already shipped validation backend.

The shipped validation backend exists for deterministic command execution and executable-runtime tests. It is not treated as a host-accelerated backend.

## Current Shipped State

- `validation` is always available and executes the current clear/draw/end-frame command path without depending on host graphics APIs.
- `direct3d`, `metal`, `vulkan`, and `opengl` remain explicit backend families behind focused adapter files.
- The public Jayess import surface stays stable while host-backed execution is still being built.
- The validation path now records deterministic buffer bytes, shader metadata, pipeline metadata, texture pixels, and frame commands before those resources are widened into backend-specific handles.

## First Real Backend Scope

The first real host-backed backend slice should stay narrow and explicit:

- resource lifetime
- texture format subset
- shader source policy
- pipeline shape
- presentation model

Each one is a separate implementation task.

## Resource Lifetime

The first real backend should support only:

- device
- surface
- buffer
- texture
- shader
- pipeline
- frame

Buffers, sampler state, staging resources, and descriptor-heavy binding models stay later slices unless a chosen backend needs one tiny internal upload buffer path.

All runtime handles should stay Jayess-owned wrappers over backend-local state. The first real backend should not expose backend-native pointers, opaque IDs, or descriptor objects to Jayess code.

The current runtime handle boundary already groups the minimal stable internal metadata into focused buckets:

- `capabilities`
- `buffer`
- `texture`
- `frame`
- `shader`
- `pipeline`

Later host-backed slices should extend those buckets carefully instead of putting more unrelated top-level fields onto `gpu_state`.

## Texture Format Subset

The first real backend should support one deterministic color texture format only:

- `rgba8unorm`

That keeps upload, clear, and present behavior aligned with `jayess:image` and `jayess:canvas` software pixel buffers.

Depth textures, compressed textures, multisample textures, and storage textures stay out of the first slice.

## Shader Source Policy

The first real backend should accept only Jayess-owned plain string shader source or the current minimal shader descriptor and treat the source as backend-specific source text for now.

The first shipped host-backed slice should support:

- one vertex shader entry point
- one fragment/pixel shader entry point

The Jayess validation path already accepts `createShader(device, { stage, source })` for `stage: "vertex"` or `stage: "fragment"` and keeps the legacy string source form as a vertex shader. The pipeline should reject empty source, unsupported stages, and mismatched backend shader text with explicit backend diagnostics instead of inventing a cross-backend shader language in this slice.

## Pipeline Shape

The first real backend pipeline should stay fixed-function-light and minimal:

- one shader pair
- one color target
- triangle-list or line-list draw
- no user-configurable blend state yet
- no user-configurable depth/stencil state yet

The current Jayess layer already treats `draw(frame, pipeline, resources)` as a narrow command and records `draw:<primitive>` on the validation backend. It now validates a minimal descriptor resource shape for `vertexBuffers` and `textures`, records stable validation metadata, and converts those descriptors into backend-owned `hostBind:<backend>:<metadata>` records for draw-capable host backends. The first host-backed slice keeps that narrow shape rather than widening into large descriptor or render-pass objects.

## Presentation Model

The first real backend should present only into a `jayess:window` surface created through `createSurface(window)`.

The first shipped host-backed draw path should prove only:

- begin frame
- clear color
- one draw call
- end frame / present

Off-screen GPU render targets, readback, and GPU-backed canvas integration stay later slices.

## Preferred Order

The current repository direction is:

1. keep `validation` as the deterministic always-available backend
2. land one real backend per host family behind isolated adapter files
3. keep Linux backend choice explicit instead of mixing Vulkan and OpenGL in one pass
4. keep one narrow `jayess:image` texture upload path wired through each backend before adding broader resource APIs

## Linux Backend Slices

The first Linux host-backed paths are split by responsibility so each adapter stays reviewable.

The focused OpenGL path provides:

- dynamic `libGL.so.1` probing
- X11-backed `jayess:window` surface selection when the current host window exposes an X11 display/window pair
- `clear(frame, color)` through `glClearColor` and `glClear`
- image texture upload through the existing `uploadImage(texture, image)` path and guarded `glTexImage2D`

The focused Vulkan path provides:

- dynamic `libvulkan.so.1` probing
- `vkGetInstanceProcAddr` lookup without requiring Vulkan headers in generated projects
- a minimal `vkCreateInstance` probe before the backend is considered available
- X11 or Wayland compatible-window detection through `jayess:window` adapter metadata
- `clear(frame, color)` routing through the Vulkan backend boundary and window-present bookkeeping
- focused unsupported-draw diagnostics until a later Vulkan pipeline/command-buffer slice exists

The reason for keeping Vulkan narrow is pragmatic rather than aspirational:

- the current `jayess:window` runtime already has cross-platform software presentation paths that align naturally with a narrow immediate host graphics slice
- `opengl` remains the smaller no-default-third-party Linux texture-upload path
- full Vulkan swapchains, synchronization, and explicit resource management remain separate future slices

This choice is only about implementation order. It does not mean the public Jayess GPU API becomes OpenGL-shaped or Vulkan-shaped.

## Current Upload Boundary

Two narrow upload paths are now shipped ahead of the first host-backed backend:

- `uploadBuffer(buffer, data)`
- `uploadImage(texture, image)`

`uploadBuffer` accepts explicit byte data from numeric arrays or `jayess:bytes` and stores it in deterministic validation memory with bounds checks. `uploadImage` copies a `jayess:image` RGBA buffer into deterministic texture storage. On Linux/OpenGL it also uploads the same RGBA bytes through the guarded texture path when the backend is available. Vulkan keeps texture upload unsupported in this slice and continues through the deterministic storage path until a separate Vulkan resource slice defines image memory, staging, and synchronization.

The current upload boundary stays intentionally small:

- explicit byte buffer uploads only, not mapped buffers or staging resources
- image texture upload only, not implicit canvas uploads
- exact dimension match required
- no readback

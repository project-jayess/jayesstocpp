# GPU Backend Slice

This document defines the first real host-backed `jayess:gpu` slice separately from the already shipped validation backend.

The shipped validation backend exists for deterministic command execution and executable-runtime tests. It is not treated as a host-accelerated backend.

## Current Shipped State

- `validation` is always available and executes the current clear/draw/end-frame command path without depending on host graphics APIs.
- `direct3d`, `metal`, `vulkan`, and `opengl` remain explicit backend families behind focused adapter files.
- The public Jayess import surface stays stable while host-backed execution is still being built.

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
- texture
- shader
- pipeline
- frame

Buffers, sampler state, staging resources, and descriptor-heavy binding models stay later slices unless a chosen backend needs one tiny internal upload buffer path.

All runtime handles should stay Jayess-owned wrappers over backend-local state. The first real backend should not expose backend-native pointers, opaque IDs, or descriptor objects to Jayess code.

The current runtime handle boundary already groups the minimal stable internal metadata into focused buckets:

- `capabilities`
- `texture`
- `frame`

Later host-backed slices should extend those buckets carefully instead of putting more unrelated top-level fields onto `gpu_state`.

## Texture Format Subset

The first real backend should support one deterministic color texture format only:

- `rgba8unorm`

That keeps upload, clear, and present behavior aligned with `jayess:image` and `jayess:canvas` software pixel buffers.

Depth textures, compressed textures, multisample textures, and storage textures stay out of the first slice.

## Shader Source Policy

The first real backend should accept only Jayess-owned plain string shader source and treat it as backend-specific source text for now.

The first shipped host-backed slice should support:

- one vertex shader entry point
- one fragment/pixel shader entry point

The pipeline should reject empty source and mismatched backend shader text with explicit backend diagnostics instead of inventing a cross-backend shader language in this slice.

## Pipeline Shape

The first real backend pipeline should stay fixed-function-light and minimal:

- one shader pair
- one color target
- triangle-list draw only
- no user-configurable blend state yet
- no user-configurable depth/stencil state yet

The current Jayess layer already treats `draw(frame, pipeline, resources)` as a narrow command. The first host-backed slice should keep that narrow shape rather than widening into large descriptor or render-pass objects.

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
4. add one narrow `jayess:image` or `jayess:bytes` texture upload path only after the first host-backed clear/draw/present path is stable

## Linux First Slice

The first real Linux backend slice is now fixed explicitly:

- `opengl` first
- `vulkan` later

The reason for that ordering is pragmatic rather than aspirational:

- the current `jayess:window` runtime already has cross-platform software presentation paths that align naturally with a narrow immediate host graphics slice
- `opengl` is the smaller no-default-third-party Linux host-backed path for one focused clear/draw/present milestone
- `vulkan` would force a much larger first slice around swapchain, synchronization, and explicit resource management before the repository has even landed one truthful real host-backed draw path

This choice is only about first implementation order. It does not mean the public Jayess GPU API becomes OpenGL-shaped.

## Current Upload Boundary

One narrow upload path is now shipped ahead of the first host-backed backend:

- `uploadImage(texture, image)`

That path copies a `jayess:image` RGBA buffer into GPU texture validation storage. It exists to keep texture/resource plumbing reviewable and deterministic before host-backed adapters widen the resource model.

The current upload boundary stays intentionally small:

- image only, not generic bytes or buffer uploads
- exact dimension match required
- no readback
- no implicit `jayess:canvas` coupling

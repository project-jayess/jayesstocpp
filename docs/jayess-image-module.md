# `jayess:image` Module

`jayess:image` is the raster image buffer module for Jayess native rendering. It provides deterministic software pixel buffers that can be used without a live window system.

## First Surface

- `create(width, height, background)`
- `width(image)`
- `height(image)`
- `metadata(image)`
- `metadataFromFile(path)`
- `getPixel(image, x, y)`
- `setPixel(image, x, y, color)`
- `fill(image, color)`
- `copy(image)`
- `savePpm(image, path)`
- `saveBmp(image, path)`
- `savePgm(image, path)`
- `saveTga(image, path)`
- `loadPpm(path)`
- `loadBmp(path)`
- `loadPgm(path)`
- `loadTga(path)`
- `encodePpm(image)`
- `decodePpm(bytes)`
- `crop(image, x, y, width, height)`
- `resizeNearest(image, width, height)`
- `blit(target, source, x, y)`
- `flipHorizontal(image)`
- `flipVertical(image)`
- `rotate90(image)`
- `transparentBlit(target, source, x, y)`
- `isImage(value)`

`background` and pixel colors use the `jayess:color` object shape: `{ red, green, blue, alpha }`.

`metadata(image)` returns currently available in-memory image metadata: `{ width, height }`. `metadataFromFile(path)` reads supported file headers and returns `{ width, height, format }`.

The first file formats are ASCII PPM (`P3`), ASCII PGM (`P2`), uncompressed 24-bit BMP, and uncompressed 24-bit TGA. PPM and PGM keep rendering testable and easy to inspect; BMP and TGA provide dependency-free files that common image viewers can open. `encodePpm` and `decodePpm` bridge PPM data through `jayess:bytes` without touching the filesystem.

## Role

This module should own pixel buffers and deterministic image output. It sits above `jayess:color` and below `jayess:canvas`.

The current implementation stores RGBA pixels in a focused runtime handle. `savePpm`, `saveBmp`, `savePgm`, and `saveTga` write deterministic file data and ignore alpha for output files except for in-memory blending operations.

`loadPpm` supports focused ASCII P3 PPM input with max value `255`. `loadPgm` supports focused ASCII P2 PGM input with max value `255` and expands grayscale pixels to RGB. `loadBmp` supports focused uncompressed 24-bit BMP input with positive dimensions. `loadTga` supports focused uncompressed 24-bit TGA input.

`crop`, `resizeNearest`, `flipHorizontal`, `flipVertical`, and `rotate90` return new images. `blit` copies source pixels into the target with clipping and returns the target image. `transparentBlit` blends source pixels over the target using the source alpha channel and also returns the target image.

## Implementation Direction

Pixel storage, simple file handling, metadata reads, crop, nearest-neighbor resize, transforms, and clipped blitting live in focused C++ runtime primitives. Higher-level rendering operations should remain in Jayess source when they stay small and reviewable.

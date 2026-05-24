# `jayess:image` Module

`jayess:image` is the raster image buffer module for Jayess native rendering. It provides deterministic software pixel buffers that can be used without a live window system.

## Surface

- `create(width, height, background)`
- `width(image)`
- `height(image)`
- `metadata(image)`
- `metadataFromFile(path)`
- `getPixel(image, x, y)`
- `setPixel(image, x, y, color)`
- `fill(image, color)`
- `fillRect(image, x, y, width, height, color)`
- `fillRectAlpha(image, x, y, width, height, color)`
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
- `encodePgm(image)`
- `decodePgm(bytes)`
- `crop(image, x, y, width, height)`
- `subimage(image, x, y, width, height)`
- `resizeNearest(image, width, height)`
- `blit(target, source, x, y)`
- `flipHorizontal(image)`
- `flipVertical(image)`
- `rotate90(image)`
- `transparentBlit(target, source, x, y)`
- `isImage(value)`

`background` and pixel colors use the `jayess:color` object shape: `{ red, green, blue, alpha }`.

`metadata(image)` returns currently available in-memory image metadata: `{ width, height }`. `metadataFromFile(path)` reads supported file headers and returns `{ width, height, format }`.

## Supported File Formats

The current shipped file formats are intentionally small and explicit:

| Format | Save | Load | Metadata | Bytes Encode/Decode | Notes |
| --- | --- | --- | --- | --- | --- |
| ASCII PPM (`P3`) | `savePpm` | `loadPpm` | `metadataFromFile` | `encodePpm` / `decodePpm` | Text-based RGB format, deterministic and easy to inspect in tests |
| ASCII PGM (`P2`) | `savePgm` | `loadPgm` | `metadataFromFile` | `encodePgm` / `decodePgm` | Grayscale file format expanded to RGB in memory on load |
| Uncompressed 24-bit BMP | `saveBmp` | `loadBmp` | `metadataFromFile` | no | File output ignores alpha; load path accepts only the focused uncompressed 24-bit slice |
| Uncompressed 24-bit TGA | `saveTga` | `loadTga` | `metadataFromFile` | no | File output ignores alpha; load path accepts only the focused uncompressed 24-bit slice |

PPM and PGM keep rendering testable and easy to inspect. BMP and TGA provide dependency-free files that common image viewers can open. The current bytes-first helpers are limited to those deterministic text formats: `encodePpm` / `decodePpm` and `encodePgm` / `decodePgm`. BMP and TGA remain filesystem-only in the current slice.

## Role

This module should own pixel buffers and deterministic image output. It sits above `jayess:color` and below `jayess:canvas`.

The current implementation stores RGBA pixels in a focused runtime handle. `savePpm`, `saveBmp`, `savePgm`, and `saveTga` write deterministic file data. Alpha stays part of the in-memory image buffer and is used by operations such as `transparentBlit`, but the shipped file writers save RGB/grayscale output only.

`loadPpm` supports focused ASCII P3 PPM input with max value `255`. `loadPgm` supports focused ASCII P2 PGM input with max value `255` and expands grayscale pixels to RGB. `loadBmp` supports focused uncompressed 24-bit BMP input with positive dimensions. `loadTga` supports focused uncompressed 24-bit TGA input. `metadataFromFile(path)` reads the same shipped format set; it is not a general-purpose image sniffing layer.

Malformed or incomplete image files are rejected deliberately. The current loaders fail on truncated headers, zero or unsupported dimensions, unsupported BMP/TGA format variants outside the shipped 24-bit uncompressed slice, invalid channel values, and image dimensions that would exceed the supported in-memory storage size. The in-memory image buffer is intentionally capped to a bounded storage size so hostile width/height values fail before very large allocations.

`fillRect` writes one clipped solid-color rectangle into the target image and returns the same image. `fillRectAlpha` does the same but blends one source color over the destination rectangle using the source alpha channel. Both helpers accept non-negative integer widths and heights, clip against the image bounds, and treat zero-sized rectangles as no-ops.

`crop`, `subimage`, `resizeNearest`, `flipHorizontal`, `flipVertical`, and `rotate90` return new images. `subimage` is intentionally a copy-based helper, not a live mutable view: it preserves the familiar “subimage” concept while avoiding aliasing and lifetime surprises between parent and child image regions. `blit` copies source pixels into the target with clipping and returns the target image. `transparentBlit` blends source pixels over the target using the source alpha channel and also returns the target image.

## Implementation Direction

Pixel storage, simple file handling, metadata reads, crop, nearest-neighbor resize, transforms, clipped blitting, and small bulk pixel-region helpers live in focused C++ runtime primitives. Higher-level rendering operations should remain in Jayess source when they stay small and reviewable.

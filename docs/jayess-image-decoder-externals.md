# Jayess Image Decoder Externals

Jayess supports PNG, JPEG/JPG, BMP, PSD, and GIF through bundled STB source under `/externals/stb`. WebP is supported through a focused portable libwebp decoder slice copied from `/externals/libwebp`.

The active layout is:

```text
externals/
  stb/
    stb_image.h
    LICENSE
  libwebp/
    COPYING
    src/
```

The Jayess runtime must not call host tools such as Python, ImageMagick, browser APIs, or Node image packages to decode assets. `transpileFile()` should produce generated C++ that can decode packed assets and local files through the same runtime adapter path.

## Runtime Boundary

The STB-backed adapter reads encoded bytes and normalizes successful decodes to RGBA pixels:

```cpp
struct jayess_decoded_image {
  int width;
  int height;
  std::vector<unsigned char> rgba;
};

jayess_decoded_image jayess_decode_image_bytes(
  const std::vector<unsigned char>& bytes,
  const std::string& format
);
```

The current STB path accepts PNG, JPEG/JPG, BMP, PSD, and GIF bytes. Existing dependency-free PPM, PGM, and TGA helpers stay in their focused runtime files. WebP uses libwebp's decoder API and returns the same Jayess RGBA image handle shape.

## Public Surface

`jayess:image` exposes:

- `loadPng(path)`
- `loadJpeg(path)`
- `loadJpg(path)`
- `loadPsd(path)`
- `loadGif(path)`
- `loadWebp(path)`
- `loadImage(path)`
- `decodePng(bytes)`
- `decodeJpeg(bytes)`
- `decodePsd(bytes)`
- `decodeGif(bytes)`
- `decodeWebp(bytes)`
- `decodeImage(bytes)`

`loadImage(path)` dispatches by extension across `.ppm`, `.pgm`, `.bmp`, `.tga`, `.png`, `.jpeg`, `.jpg`, `.psd`, `.gif`, and `.webp`.

`jayess:canvas` XML loading uses `loadImage(path)` for local `<image src="...">`, `scrollbar-thumb`, and `scrollbar-track` sources. Explicit image handles passed through `renderScene(xml, { images })` remain the preferred path for application-managed assets.

## `packImage(path)`

`packImage(path)` accepts `.ppm`, `.pgm`, `.bmp`, `.png`, `.jpeg`, `.jpg`, `.psd`, `.gif`, and `.webp`.

Packed complex formats embed the original encoded bytes into generated C++ and decode at runtime through the same adapter used by file loading. This keeps transpilation deterministic and avoids relying on developer-machine codecs.

## License Packaging

When the generated project retains the image runtime, `transpileFile()` copies:

- `externals/stb/stb_image.h` to `native/stb_image.h`
- `externals/stb/LICENSE` to `licenses/stb/LICENSE`
- focused `externals/libwebp/src` decoder C sources and headers to `native/libwebp/src`
- generated portable `native/libwebp/src/webp/config.h`
- `externals/libwebp/COPYING` to `licenses/libwebp/COPYING`
- `externals/libwebp/PATENTS` to `licenses/libwebp/PATENTS`
- `externals/libwebp/AUTHORS` to `licenses/libwebp/AUTHORS`

The build hints include copied license artifacts so distribution tooling can package them beside the executable or generated C++ project.

## Diagnostics

Diagnostics should be explicit when:

- a file extension is unsupported
- the relevant decoder source is missing from `/externals`
- the encoded image is malformed or unsupported by the chosen decoder
- image dimensions exceed Jayess image storage limits
- a compiler cannot build the selected external decoder source

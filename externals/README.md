# Externals

This directory contains third-party source used by Jayess development and generated-project runtime support.

Each third-party source is under their own license.

Current decoder layout:

- `stb/`: `stb_image.h` and `LICENSE`. Generated projects that retain `jayess:image` copy these into `native/stb_image.h` and `licenses/stb/LICENSE`.
- `libwebp/`: focused decoder source for WebP. Generated projects that retain `jayess:image` copy the portable decoder C sources, public/internal headers, generated config, `COPYING`, `PATENTS`, and `AUTHORS`.

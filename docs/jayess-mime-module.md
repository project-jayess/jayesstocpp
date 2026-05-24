# `jayess:mime` Module

`jayess:mime` provides a compact, deterministic MIME helper table for common web and text files.

## Surface

- `lookup(pathOrExtension)` returns a MIME type.
- `extension(type)` returns the preferred extension for a MIME type.
- `isText(type)` checks text-like types.
- `charset(type)` returns a lower-case `charset=` value or an empty string.

## Supported Mappings

- HTML: `.html`, `.htm`
- CSS: `.css`
- JavaScript: `.js`, `.mjs`
- JSON: `.json`
- Text-like config: `.txt`, `.md`, `.csv`, `.toml`, `.ini`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`
- WebAssembly: `.wasm`

Unknown extensions return `application/octet-stream`. Unknown MIME types return an empty extension.

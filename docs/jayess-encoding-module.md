# Jayess `jayess:encoding` Module

`jayess:encoding` is a Jayess-owned standard module for text and binary encoding helpers.

The module works with ordinary Jayess strings and `jayess:bytes` values. It does not add ambient browser or Node.js encoding globals.

```js
import { fromUtf8 } from "jayess:bytes";
import { asciiEncode, base64Encode, hexEncode, uriEncode, utf16Encode } from "jayess:encoding";
```

## Exports

- `base64Encode(bytes)`
- `base64Decode(text)`
- `hexEncode(bytes)`
- `hexDecode(text)`
- `asciiEncode(text)`
- `asciiDecode(bytes)`
- `utf16Encode(text)`
- `utf16Decode(bytes)`
- `uriEncode(text)`
- `uriDecode(text)`

## Semantics

- `base64Encode(bytes)` requires bytes and returns padded base64 text.
- `base64Decode(text)` requires padded base64 text and returns bytes.
- `hexEncode(bytes)` requires bytes and returns lowercase hexadecimal text.
- `hexDecode(text)` requires even-length hexadecimal text and returns bytes.
- `asciiEncode(text)` returns bytes and rejects non-ASCII text.
- `asciiDecode(bytes)` returns text and rejects non-ASCII bytes.
- `utf16Encode(text)` returns little-endian UTF-16 bytes for the focused ASCII code-unit slice.
- `utf16Decode(bytes)` returns text from little-endian UTF-16 bytes and rejects odd byte lengths or non-ASCII code units in this slice.
- `uriEncode(text)` percent-encodes string bytes except URI unreserved characters.
- `uriDecode(text)` decodes percent escapes back into a string.

Malformed decode input throws a focused runtime error. Decode helpers do not silently repair malformed text.

## Generated Output

The first encoding slice is split across:

- `stdlib/jayess/encoding/index.js`
- `stdlib/jayess/encoding/encoding-primitives.hpp`
- `src/cpp/runtime-encoding-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.

## Related Modules

- [jayess:bytes](./jayess-bytes-module.md)
- [jayess:crypto](./jayess-crypto-module.md)

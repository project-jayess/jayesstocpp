# Jayess `jayess:buffer` Module

`jayess:buffer` is a Jayess-owned higher-level byte buffer module. It treats explicit mutable `jayess:bytes` values as buffer handles and adds range-checked buffer operations.

```js
import { fromArray } from "jayess:bytes";
import { create, read, toBytes, write } from "jayess:buffer";

var buffer = create(4);
write(buffer, 1, fromArray([65, 66]));
var middle = read(buffer, 1, 2);
var bytes = toBytes(buffer);
```

## Exports

- `create(size)` creates a zero-filled mutable buffer.
- `fromBytes(bytes)` validates and returns an existing `jayess:bytes` value as a buffer handle.
- `toBytes(buffer)` returns the current backing `jayess:bytes` value.
- `length(buffer)` returns the backing byte length.
- `read(buffer, offset, size)` returns a `jayess:bytes` slice.
- `write(buffer, offset, bytes)` writes bytes at `offset` and returns the same buffer handle.
- `concat(buffers)` returns a new buffer containing each buffer's bytes in order.

`fromBytes(bytes)` and `toBytes(buffer)` do not copy the underlying storage. Writing through a buffer mutates the same backing `jayess:bytes` value. `read(buffer, offset, size)` returns a new `jayess:bytes` slice rather than a live view into the buffer.

## Diagnostics

The module throws Jayess runtime errors for:

- non-buffer handles passed to buffer operations
- non-`jayess:bytes` payloads passed to byte operations
- negative sizes, offsets, or reads/writes outside the buffer bounds

## Implementation

- Jayess wrappers live in `stdlib/jayess/buffer/index.js`.
- The module builds on `jayess:bytes` and does not add a separate C++ runtime fragment.
- Importing `jayess:buffer` includes its `jayess:bytes` dependency in the transpiled module graph.

# Jayess `jayess:thread` Module

`jayess:thread` provides explicit native-thread helpers backed by portable C++ standard-library threading.

## Exports

- `spawn(callback, args)`
- `join(handle)`
- `sleep(milliseconds)`
- `hardwareConcurrency()`
- `currentId()`

## Current Semantics

- `spawn(callback, args)` requires a callable callback and an array of arguments.
- worker arguments are transferred across the thread boundary.
- transferable values are `null`, numbers, booleans, strings, channel handles, arrays of transferable values, and plain objects containing transferable values.
- non-transferable values throw focused diagnostics before a worker is launched.
- `join(handle)` waits for a thread and returns the worker result.
- joining the same handle more than once is invalid.
- worker-thrown Jayess values are rethrown by `join(handle)`.
- `sleep(milliseconds)` requires a non-negative integer.
- `hardwareConcurrency()` returns the host concurrency count with a deterministic fallback of `1`.
- `currentId()` returns a stable string representation of the current native thread id.

## Ownership Split

The module is split across:

- `stdlib/jayess/thread/index.js`
- `stdlib/jayess/thread/thread-primitives.hpp`
- `src/cpp/runtime-thread-source.js`

Threading is explicit module behavior. Jayess does not expose ambient worker globals or shared mutable state in the current shipped surface.

Related coordination helpers live in:

- [jayess-channel-module.md](./jayess-channel-module.md)
- [jayess-workqueue-module.md](./jayess-workqueue-module.md)

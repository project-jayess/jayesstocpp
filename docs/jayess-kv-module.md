# `jayess:kv` Module

`jayess:kv` provides a small file-backed key/value store built from Jayess-owned filesystem, JSON, path, and string helpers.

It is a pure Jayess standard-library module. It does not introduce a native database runtime or ambient Node.js storage API.

## Exports

- `open(root, options)`
- `get(store, key)`
- `getSync(store, key)`
- `set(store, key, value)`
- `setSync(store, key, value)`
- `has(store, key)`
- `hasSync(store, key)`
- `deleteKey(store, key)`
- `deleteKeySync(store, key)`
- `keys(store)`
- `keysSync(store)`

## Storage Shape

`open(root, options)` returns a store descriptor. Values are stored as JSON files under `root`, one file per key.

Keys are intentionally narrow:

- non-empty strings
- no `/`
- no `\`
- no `..`
- no drive-style `:`

This keeps storage paths deterministic and prevents traversal outside the store root.

## Async And Sync

The default helpers use `jayess:fs` async-by-default names. `Sync` helpers use the matching synchronous filesystem operations.

`get` and `getSync` return `null` when a key does not exist.

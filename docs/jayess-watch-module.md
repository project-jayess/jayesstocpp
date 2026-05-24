# `jayess:watch` Module

`jayess:watch` provides deterministic filesystem watcher handles.

## Surface

- `watch(path, options)`
- `poll(watcher)`
- `close(watcher)`
- `isWatcher(value)`

The first implementation uses portable filesystem polling. `watch(path, options)` snapshots a file or one directory level.

`poll(watcher)` returns event objects with:

- `type`: `create`, `modify`, or `remove`
- `path`: normalized watched entry path

`close(watcher)` closes the handle. Polling a closed watcher reports a closed-handle diagnostic.

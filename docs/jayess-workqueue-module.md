# `jayess:workqueue` Module

`jayess:workqueue` provides a small worker helper surface layered over `jayess:thread`.

## Surface

- `run(callback, args)` spawns one worker and returns a thread handle.
- `runAll(jobs)` spawns one worker for each `{ callback, args }` job object.
- `joinAll(handles)` joins every worker and returns an array of results.

## Rules

The module is explicit and handle-based. It does not create a hidden JavaScript-style event loop or promise queue.

Arguments and results follow the same thread-boundary transfer rules as `jayess:thread`.

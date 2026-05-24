# `jayess:subprocess` Module

`jayess:subprocess` is the Jayess-owned subprocess module. It provides native process execution without adopting ambient Node.js `child_process` compatibility.

## Imports

```js
import { run, runText, runBytes, runJson, runWithCancellation, runWithTimeout, runWithTimeoutAndCancellation, spawn, spawnPipeline, join, kill, stdout, stderr, ok, requireSuccess } from "jayess:subprocess";
```

## First Slice

The first slice exposes four focused helpers:

- `run(command, args, options)` starts a command and returns a Jayess async handle for completion data.
- `runWithCancellation(command, args, options, token)` composes `run` with a cancellation token.
- `runWithTimeout(command, args, options, milliseconds)` composes `run` with a Jayess async timeout.
- `runWithTimeoutAndCancellation(command, args, options, milliseconds, token)` composes `run` with both timeout and cancellation.
- `runText(command, args, options)` runs a command and resolves with successful stdout text.
- `runBytes(command, args, options)` runs a command and resolves with successful stdout as `jayess:bytes`.
- `runJson(command, args, options)` runs a command and parses successful stdout as JSON.
- `spawn(command, args, options)` starts a command and returns an explicit process handle.
- `spawnPipeline(commands, options)` runs executable-plus-args stages in deterministic left-to-right order, passing each successful stdout text as the next stage stdin.
- `join(handle)` waits for a process handle and returns completion data with `stdout`, `stderr`, `exitCode`, `killed`, and `timedOut`.
- `kill(handle)` terminates an explicit process handle.
- `stdout(handle)` opens a `jayess:stream` read stream for captured stdout.
- `stderr(handle)` opens a `jayess:stream` read stream for captured stderr.
- `ok(result)` returns true when completion data has exit code `0` and was not killed.
- `requireSuccess(result)` returns successful completion data and throws stderr text otherwise.

Output streams must be opened before `join(handle)`. When an output stream is opened, `join(handle)` still returns captured completion text and leaves that output file available for the stream reader.

Convenience helpers are layered over `run`, `requireSuccess`, `jayess:bytes`, and `jayess:json`. They do not add shell-by-default behavior.

## Execution Model

Commands are executable-plus-args by default:

```js
const result = await run("tool", ["--version"], {});
```

The module does not run commands through a shell by default. Ordinary argument handling stays portable and predictable because the command is passed as an executable name plus an args array.

## Options

The first slice keeps options object-shaped and explicit:

- `cwd` selects a child working directory.
- `env` passes per-child environment values.
- `stdin` passes optional input text.
- `stdinBytes` passes optional `jayess:bytes` input.
- `timeoutMillis` caps child execution time.

`env` options should not mutate the current Jayess process environment.

Current native support is implemented through a focused POSIX adapter. Hosts without that adapter report a Jayess subprocess runtime diagnostic.

When `timeoutMillis` terminates a child process, completion data reports both `killed: true` and `timedOut: true`. Manual `kill(handle)` reports `killed: true` and keeps `timedOut: false`.

## Diagnostics

The module fails with focused diagnostics for:

- non-string command values
- non-array args values
- unsupported option keys or option value types
- invalid process handles passed to `join` or `kill`
- invalid process handles passed to `stdout` or `stderr`
- output stream access after a process handle has already been joined
- invalid pipeline stage objects
- subprocess startup failures

## Boundaries

`node:child_process` imports remain unsupported. The public API should stay under `jayess:subprocess`, and native C++ support should stay behind small adapter primitives.

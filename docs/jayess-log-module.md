# `jayess:log` Module

`jayess:log` provides small structured logging helpers layered over `jayess:console`.

## Surface

- `debug(message)` writes a debug line to standard output.
- `info(message)` writes an info line to standard output.
- `warn(message)` writes a warning line to standard error.
- `error(message)` writes an error line to standard error.
- `withLevel(level, message)` writes with an explicit level.
- `formatJson(level, value)` returns a JSON log string.

## Rules

Text helpers format messages as `[level] message`.

`formatJson` uses `jayess:json` for the `value` payload and does not write to output.

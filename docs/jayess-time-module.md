# Jayess Time Module

`jayess:time` is the Jayess-owned monotonic time and duration helper module. It is separate from `jayess:date`, which handles wall-clock date values.

## Surface

- `millis()` returns a monotonic millisecond timestamp as a number.
- `seconds(value)` converts a numeric second count to milliseconds.
- `minutes(value)` converts a numeric minute count to milliseconds.
- `elapsed(start)` returns elapsed milliseconds since a monotonic timestamp returned by `millis()`.
- `formatDuration(milliseconds)` returns a compact duration string using minutes, seconds, and milliseconds.

## Rules

Duration values are explicit milliseconds. Helpers reject non-numeric or non-finite inputs instead of coercing strings or objects.

`millis()` uses a monotonic runtime clock and is intended for measuring elapsed time. Use `jayess:date` for wall-clock timestamps or calendar formatting.

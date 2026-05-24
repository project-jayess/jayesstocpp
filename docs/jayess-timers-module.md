# Jayess `jayess:timers` Module

`jayess:timers` is a Jayess-owned timer helper module built on the existing Jayess async scheduler. It does not add ambient JavaScript globals.

```js
import { clearTimeout, setTimeout, sleep } from "jayess:timers";

await sleep(10);

var timer = setTimeout(function (value) {
  return value + 1;
}, 10, [41]);

clearTimeout(timer);
```

## Exports

- `sleep(milliseconds)` returns a Jayess async handle that resolves with `null` after a non-negative duration.
- `setTimeout(callback, milliseconds, args)` returns a timer handle. The handle has a `done` async handle that resolves to the callback result or `null` if cancelled.
- `clearTimeout(handle)` cancels a timer handle and returns `null`.

## Diagnostics

The module throws Jayess runtime errors for:

- negative durations
- invalid args arrays
- invalid timer handles

## Implementation

- Jayess wrappers live in `stdlib/jayess/timers/index.js`.
- The module builds on `jayess:async` and does not add a separate C++ runtime fragment.
- Timer helpers are explicit imports from `jayess:timers`, not JavaScript globals.

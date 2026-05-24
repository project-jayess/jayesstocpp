# Jayess `jayess:timers` Module

`jayess:timers` is a Jayess-owned timer helper module built on the Jayess async scheduler plus a small timer primitive layer. It does not add ambient JavaScript globals.

```js
import { clearTimeout, clearInterval, setInterval, setTimeout, sleep } from "jayess:timers";

await sleep(10);

var timer = setTimeout(function (value) {
  return value + 1;
}, 10, [41]);

clearTimeout(timer);

var interval = setInterval(function (value) {
  return value + 1;
}, 10, [41]);

clearInterval(interval);
```

## Exports

- `sleep(milliseconds)` returns a Jayess async handle that resolves with `null` after a non-negative duration.
- `setTimeout(callback, milliseconds, args)` returns a timer handle. The handle has a `done` async handle that resolves to the callback result or `null` if cancelled.
- `clearTimeout(handle)` cancels a timer handle and returns `null`.
- `setInterval(callback, milliseconds, args)` returns a timer handle. The handle has a `done` async handle that resolves to the last callback result once the interval is cleared, or `null` if no tick completed before cancellation.
- `clearInterval(handle)` cancels an interval handle and returns `null`.

## Diagnostics

The module throws Jayess runtime errors for:

- negative durations
- invalid args arrays
- invalid timer handles

## Implementation

- Jayess wrappers live in `stdlib/jayess/timers/index.js`.
- The public module wrapper lives in `stdlib/jayess/timers/index.js`.
- The narrow timer bridge lives in `stdlib/jayess/timers/timers-primitives.hpp`.
- The runtime timer helpers live in `src/cpp/runtime-timers-source.js`.
- The minimal native timer machinery still builds on the shared async scheduler support:
  - `async_sleep(milliseconds)`
  - `async_timeout(handle, milliseconds)`
  - `timer_schedule_once(callback, milliseconds, args, handle)`
  - `timer_schedule_interval(callback, milliseconds, args, handle)`
  - the scheduler queue/timer records inside the async runtime
- Timer helpers are explicit imports from `jayess:timers`, not JavaScript globals.

## Shared Event-Loop Layer

The first shared window/timer scheduling path is intentionally small. `jayess:window` now layers `requestFrame(window, callback, args)` and `cancelFrame(handle)` on top of this module's timeout machinery.

That means:

- frame scheduling reuses the same async scheduler and timer-handle shape as `setTimeout`
- `jayess:window` does not get a separate hidden native event loop for this first slice
- window callbacks still call `pollEvents(window)` explicitly when they want to drain host events

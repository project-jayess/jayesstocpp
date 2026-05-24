import { sleep as asyncSleep } from "jayess:async";

function fail(message) {
  throw message;
}

function requireDuration(milliseconds) {
  if (milliseconds < 0) {
    fail("jayess:timers duration must be non-negative");
  }
}

function requireArgs(args) {
  if (args.length < 0) {
    fail("jayess:timers args must be an array");
  }
}

function requireTimer(handle) {
  if (handle.cancelled !== true && handle.cancelled !== false) {
    fail("jayess:timers expected a timer handle");
  }
}

async function runTimer(handle, callback, milliseconds, args) {
  await asyncSleep(milliseconds);
  if (handle.cancelled) {
    return null;
  }
  return callback(...args);
}

export function sleep(milliseconds) {
  requireDuration(milliseconds);
  return asyncSleep(milliseconds);
}

export function setTimeout(callback, milliseconds, args) {
  requireDuration(milliseconds);
  requireArgs(args);

  var handle = {
    cancelled: false,
    done: null
  };
  handle.done = runTimer(handle, callback, milliseconds, args);
  return handle;
}

export function clearTimeout(handle) {
  requireTimer(handle);
  handle.cancelled = true;
  return null;
}

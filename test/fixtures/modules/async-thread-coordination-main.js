import {
  cancel,
  cancellationReason,
  createCancellationToken,
  isCancelled,
  resolved,
  sleepWithCancellation,
  whenCancelled,
  withCancellation,
  withTimeout,
  timeoutWithCancellation
} from "jayess:async";
import { close, create, isClosed, receive, send } from "jayess:channel";
import { joinAll, run } from "jayess:workqueue";

export async function runAsync() {
  var token = createCancellationToken();
  var waiting = whenCancelled(token);
  cancel(token, "stop");
  var reason = await waiting;
  var active = createCancellationToken();
  var value = await withCancellation(resolved("ok"), active);
  var timed = await withTimeout(resolved("soon"), 1000);
  var nested = await timeoutWithCancellation(resolved("nested"), 1000, active);
  var cancelled = false;
  try {
    await sleepWithCancellation(0, token);
  } catch (error) {
    cancelled = error === "stop";
  }
  return [isCancelled(token), cancellationReason(token), reason, value, cancelled, timed, nested];
}

export function runSync() {
  var channel = create();
  send(channel, "value");
  var first = receive(channel);
  var second = receive(channel);
  close(channel);
  var handle = run(function(value) {
    return value + 1;
  }, [41]);
  var results = joinAll([handle]);
  return [first, second, isClosed(channel), results[0]];
}

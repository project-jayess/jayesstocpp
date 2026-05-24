import { cancelFrame, pollEvents, requestFrame, shouldClose } from "jayess:window";

export function scheduleFrame(window) {
  var handle = requestFrame(window, function (currentWindow, label) {
    var events = pollEvents(currentWindow);
    return [shouldClose(currentWindow), events.length, label];
  }, ["frame"]);
  return handle.done;
}

export async function cancelScheduledFrame(window) {
  var handle = requestFrame(window, function () {
    return "ran";
  }, []);
  cancelFrame(handle);
  return await handle.done;
}

import { getAsyncCoreRuntimeCppFragment, getAsyncCoreRuntimeHeaderFragment, getAsyncHelpersRuntimeCppFragment, getAsyncHelpersRuntimeHeaderFragment } from "./runtime-async-source.js";
import { getArchiveRuntimeCppFragment, getArchiveRuntimeHeaderFragment } from "./runtime-archive-source.js";
import { getArrayRuntimeCppFragment, getArrayRuntimeHeaderFragment } from "./runtime-array-source.js";
import { getBytesRuntimeCppFragment, getBytesRuntimeHeaderFragment } from "./runtime-bytes-source.js";
import { getChannelRuntimeCppFragment, getChannelRuntimeHeaderFragment } from "./runtime-channel-source.js";
import { getClipboardRuntimeCppFragment, getClipboardRuntimeHeaderFragment } from "./runtime-clipboard-source.js";
import { getClassRuntimeCppFragment, getClassRuntimeHeaderFragment } from "./runtime-class-source.js";
import { getCompressRuntimeCppFragment, getCompressRuntimeHeaderFragment } from "./runtime-compress-source.js";
import { getConsoleRuntimeCppFragment, getConsoleRuntimeHeaderFragment } from "./runtime-console-source.js";
import { getCryptoRuntimeCppFragment, getCryptoRuntimeHeaderFragment } from "./runtime-crypto-source.js";
import { getDateRuntimeCppFragment, getDateRuntimeHeaderFragment } from "./runtime-date-source.js";
import { getDialogRuntimeCppFragment, getDialogRuntimeHeaderFragment } from "./runtime-dialog-source.js";
import { getEncodingRuntimeCppFragment, getEncodingRuntimeHeaderFragment } from "./runtime-encoding-source.js";
import { getEventsRuntimeCppFragment, getEventsRuntimeHeaderFragment } from "./runtime-events-source.js";
import { getFsRuntimeCppFragment, getFsRuntimeHeaderFragment } from "./runtime-fs-source.js";
import { getGeneratorRuntimeCppFragment, getGeneratorRuntimeHeaderFragment } from "./runtime-generator-source.js";
import { getGpuRuntimeCppFragment, getGpuRuntimeHeaderFragment } from "./runtime-gpu-source.js";
import { getHttpRuntimeCppFragment, getHttpRuntimeHeaderFragment } from "./runtime-http-source.js";
import { getImageRuntimeCppFragment, getImageRuntimeHeaderFragment } from "./runtime-image-source.js";
import { getIterRuntimeCppFragment, getIterRuntimeHeaderFragment } from "./runtime-iter-source.js";
import { getJsonRuntimeCppFragment, getJsonRuntimeHeaderFragment } from "./runtime-json-source.js";
import { getMapRuntimeCppFragment, getMapRuntimeHeaderFragment } from "./runtime-map-source.js";
import { getMathRuntimeCppFragment, getMathRuntimeHeaderFragment } from "./runtime-math-source.js";
import { getNetRuntimeCppFragment, getNetRuntimeHeaderFragment } from "./runtime-net-source.js";
import { getNumberRuntimeCppFragment, getNumberRuntimeHeaderFragment } from "./runtime-number-source.js";
import { getObjectRuntimeCppFragment, getObjectRuntimeHeaderFragment } from "./runtime-object-source.js";
import { getOsRuntimeCppFragment, getOsRuntimeHeaderFragment } from "./runtime-os-source.js";
import { getPathRuntimeCppFragment, getPathRuntimeHeaderFragment } from "./runtime-path-source.js";
import { getPrivateRuntimeCppFragment, getPrivateRuntimeHeaderFragment } from "./runtime-private-source.js";
import { getRegexRuntimeCppFragment, getRegexRuntimeHeaderFragment } from "./runtime-regex-source.js";
import { getSetRuntimeCppFragment, getSetRuntimeHeaderFragment } from "./runtime-set-source.js";
import { getStringRuntimeCppFragment, getStringRuntimeHeaderFragment } from "./runtime-string-source.js";
import { getStreamRuntimeCppFragment, getStreamRuntimeHeaderFragment } from "./runtime-stream-source.js";
import { getSubprocessRuntimeCppFragment, getSubprocessRuntimeHeaderFragment } from "./runtime-subprocess-source.js";
import { getSystemRuntimeCppFragment, getSystemRuntimeHeaderFragment } from "./runtime-system-source.js";
import { getTerminalRuntimeCppFragment, getTerminalRuntimeHeaderFragment } from "./runtime-terminal-source.js";
import { getTimeRuntimeCppFragment, getTimeRuntimeHeaderFragment } from "./runtime-time-source.js";
import { getTimersRuntimeCppFragment, getTimersRuntimeHeaderFragment } from "./runtime-timers-source.js";
import { getThreadRuntimeCppFragment, getThreadRuntimeHeaderFragment } from "./runtime-thread-source.js";
import { getUrlRuntimeCppFragment, getUrlRuntimeHeaderFragment } from "./runtime-url-source.js";
import { getValidateRuntimeCppFragment, getValidateRuntimeHeaderFragment } from "./runtime-validate-source.js";
import { getWatchRuntimeCppFragment, getWatchRuntimeHeaderFragment } from "./runtime-watch-source.js";
import { getWindowRuntimeCppFragment, getWindowRuntimeHeaderFragment } from "./runtime-window-source.js";

export const RUNTIME_FRAGMENT_DEFINITIONS = [
  // Fragment dependencies stay here so pruning remains deterministic and reviewable.
  { key: "async-core", header: getAsyncCoreRuntimeHeaderFragment, cpp: getAsyncCoreRuntimeCppFragment },
  { key: "async-helpers", header: getAsyncHelpersRuntimeHeaderFragment, cpp: getAsyncHelpersRuntimeCppFragment, requires: ["async-core"] },
  { key: "archive", header: getArchiveRuntimeHeaderFragment, cpp: getArchiveRuntimeCppFragment, requires: ["bytes"] },
  { key: "array", header: getArrayRuntimeHeaderFragment, cpp: getArrayRuntimeCppFragment },
  { key: "bytes", header: getBytesRuntimeHeaderFragment, cpp: getBytesRuntimeCppFragment },
  { key: "channel", header: getChannelRuntimeHeaderFragment, cpp: getChannelRuntimeCppFragment },
  { key: "clipboard", header: getClipboardRuntimeHeaderFragment, cpp: getClipboardRuntimeCppFragment },
  { key: "class", header: getClassRuntimeHeaderFragment, cpp: getClassRuntimeCppFragment },
  { key: "compress", header: getCompressRuntimeHeaderFragment, cpp: getCompressRuntimeCppFragment, requires: ["bytes"] },
  { key: "console", header: getConsoleRuntimeHeaderFragment, cpp: getConsoleRuntimeCppFragment },
  { key: "crypto", header: getCryptoRuntimeHeaderFragment, cpp: getCryptoRuntimeCppFragment },
  { key: "date", header: getDateRuntimeHeaderFragment, cpp: getDateRuntimeCppFragment },
  { key: "dialog", header: getDialogRuntimeHeaderFragment, cpp: getDialogRuntimeCppFragment, requires: ["async-core"] },
  { key: "encoding", header: getEncodingRuntimeHeaderFragment, cpp: getEncodingRuntimeCppFragment },
  { key: "events", header: getEventsRuntimeHeaderFragment, cpp: getEventsRuntimeCppFragment },
  { key: "fs", header: getFsRuntimeHeaderFragment, cpp: getFsRuntimeCppFragment },
  { key: "generator", header: getGeneratorRuntimeHeaderFragment, cpp: getGeneratorRuntimeCppFragment },
  { key: "gpu", header: getGpuRuntimeHeaderFragment, cpp: getGpuRuntimeCppFragment, requires: ["window"] },
  { key: "http", header: getHttpRuntimeHeaderFragment, cpp: getHttpRuntimeCppFragment, requires: ["async-core", "bytes"] },
  { key: "image", header: getImageRuntimeHeaderFragment, cpp: getImageRuntimeCppFragment },
  { key: "iter", header: getIterRuntimeHeaderFragment, cpp: getIterRuntimeCppFragment, requires: ["generator"] },
  { key: "json", header: getJsonRuntimeHeaderFragment, cpp: getJsonRuntimeCppFragment },
  { key: "map", header: getMapRuntimeHeaderFragment, cpp: getMapRuntimeCppFragment },
  { key: "math", header: getMathRuntimeHeaderFragment, cpp: getMathRuntimeCppFragment },
  { key: "net", header: getNetRuntimeHeaderFragment, cpp: getNetRuntimeCppFragment, requires: ["async-core", "bytes"] },
  { key: "number", header: getNumberRuntimeHeaderFragment, cpp: getNumberRuntimeCppFragment },
  { key: "object", header: getObjectRuntimeHeaderFragment, cpp: getObjectRuntimeCppFragment },
  { key: "os", header: getOsRuntimeHeaderFragment, cpp: getOsRuntimeCppFragment },
  { key: "path", header: getPathRuntimeHeaderFragment, cpp: getPathRuntimeCppFragment },
  { key: "regex", header: getRegexRuntimeHeaderFragment, cpp: getRegexRuntimeCppFragment },
  { key: "set", header: getSetRuntimeHeaderFragment, cpp: getSetRuntimeCppFragment },
  { key: "string", header: getStringRuntimeHeaderFragment, cpp: getStringRuntimeCppFragment, requires: ["regex"] },
  { key: "stream", header: getStreamRuntimeHeaderFragment, cpp: getStreamRuntimeCppFragment, requires: ["async-core", "bytes"] },
  { key: "subprocess", header: getSubprocessRuntimeHeaderFragment, cpp: getSubprocessRuntimeCppFragment, requires: ["async-core", "stream"] },
  { key: "system", header: getSystemRuntimeHeaderFragment, cpp: getSystemRuntimeCppFragment, requires: ["path"] },
  { key: "terminal", header: getTerminalRuntimeHeaderFragment, cpp: getTerminalRuntimeCppFragment },
  { key: "time", header: getTimeRuntimeHeaderFragment, cpp: getTimeRuntimeCppFragment },
  { key: "timers", header: getTimersRuntimeHeaderFragment, cpp: getTimersRuntimeCppFragment, requires: ["async-core"] },
  { key: "thread", header: getThreadRuntimeHeaderFragment, cpp: getThreadRuntimeCppFragment },
  { key: "url", header: getUrlRuntimeHeaderFragment, cpp: getUrlRuntimeCppFragment },
  { key: "validate", header: getValidateRuntimeHeaderFragment, cpp: getValidateRuntimeCppFragment },
  { key: "watch", header: getWatchRuntimeHeaderFragment, cpp: getWatchRuntimeCppFragment },
  { key: "window", header: getWindowRuntimeHeaderFragment, cpp: getWindowRuntimeCppFragment, requires: ["image"] },
  { key: "private", header: getPrivateRuntimeHeaderFragment, cpp: getPrivateRuntimeCppFragment, requires: ["class"] }
];

const definitionsByKey = new Map(RUNTIME_FRAGMENT_DEFINITIONS.map((fragment) => [fragment.key, fragment]));

export function allRuntimeFragmentKeys() {
  return RUNTIME_FRAGMENT_DEFINITIONS.map((fragment) => fragment.key);
}

export function resolveRuntimeFragmentKeys(features = "all") {
  if (features === "all" || features == null) {
    return allRuntimeFragmentKeys();
  }

  const selected = new Set(["async-core", "class"]);
  for (const key of features) {
    selected.add(key);
  }

  for (let changed = true; changed;) {
    changed = false;
    for (const key of [...selected]) {
      const definition = definitionsByKey.get(key);
      if (definition == null) {
        throw new Error(`Unknown Jayess runtime fragment '${key}'`);
      }
      for (const dependency of definition.requires ?? []) {
        if (!selected.has(dependency)) {
          selected.add(dependency);
          changed = true;
        }
      }
    }
  }

  return RUNTIME_FRAGMENT_DEFINITIONS
    .map((fragment) => fragment.key)
    .filter((key) => selected.has(key));
}

export function selectRuntimeFragments(features = "all") {
  const keys = new Set(resolveRuntimeFragmentKeys(features));
  return RUNTIME_FRAGMENT_DEFINITIONS.filter((fragment) => keys.has(fragment.key));
}

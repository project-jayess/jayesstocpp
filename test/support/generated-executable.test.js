import test from "node:test";
import assert from "node:assert/strict";
import { runtimeHostSkipMessage } from "./generated-executable.js";

test("runtimeHostSkipMessage includes module, adapter, capability, and host", () => {
  assert.equal(
    runtimeHostSkipMessage({
      moduleName: "jayess:gpu",
      adapter: "vulkan",
      capability: "surface probe",
      host: "linux"
    }),
    "jayess:gpu vulkan surface probe is unavailable on this host (linux)"
  );
});

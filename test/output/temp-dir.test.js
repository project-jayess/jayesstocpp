import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createManagedTempDir } from "../support/temp-dir.js";

test("managed temp dir helper cleans up only its own created directory", () => {
  const afterCallbacks = [];
  const context = {
    after(callback) {
      afterCallbacks.push(callback);
    }
  };

  const tempDir = createManagedTempDir(context, "managed-temp");
  assert.ok(fs.existsSync(tempDir));
  assert.equal(afterCallbacks.length, 1);

  afterCallbacks[0]();
  assert.equal(fs.existsSync(tempDir), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { transpile, transpileFile } from "../../src/index.js";

test("public api exports transpile functions", () => {
  assert.equal(typeof transpile, "function");
  assert.equal(typeof transpileFile, "function");
});

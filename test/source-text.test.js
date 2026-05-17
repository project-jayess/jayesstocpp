import test from "node:test";
import assert from "node:assert/strict";
import { createSourceText, offsetToLineColumn } from "../src/source/source-text.js";

test("source text maps offsets to line and column", () => {
  const sourceText = createSourceText("a\nbc\n");
  assert.deepEqual(offsetToLineColumn(sourceText, 0), { line: 1, column: 1 });
  assert.deepEqual(offsetToLineColumn(sourceText, 2), { line: 2, column: 1 });
});

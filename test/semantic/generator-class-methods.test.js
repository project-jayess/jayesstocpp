import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { createSourceText } from "../../src/source/source-text.js";

test("semantic analysis accepts yield inside generator class methods", () => {
  const sourceText = createSourceText("class Worker { *items(value) { yield value; return value; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps yield rejected inside non-generator class methods", () => {
  const sourceText = createSourceText("class Worker { items(value) { yield value; } }");
  const ast = parse(sourceText);

  assert.throws(
    () => analyzeModule(ast, sourceText),
    /'yield' is only valid inside generator functions/
  );
});

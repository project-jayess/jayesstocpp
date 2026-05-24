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

test("semantic analysis rejects generator array spread containing yield before emission", () => {
  const sourceText = createSourceText("function* run(items) { var copied = [...(yield items)]; return copied; }");
  const ast = parse(sourceText);

  assert.throws(
    () => analyzeModule(ast, sourceText),
    /array spread elements containing 'yield'/
  );
});

test("semantic analysis rejects generator object spread containing yield before emission", () => {
  const sourceText = createSourceText("function* run(record) { var copied = { ...(yield record) }; return copied; }");
  const ast = parse(sourceText);

  assert.throws(
    () => analyzeModule(ast, sourceText),
    /object spread properties containing 'yield'/
  );
});

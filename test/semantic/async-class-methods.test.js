import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { createSourceText } from "../../src/source/source-text.js";

test("semantic analysis accepts await inside async class methods", () => {
  const sourceText = createSourceText("class Worker { async run(value) { return await value; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps await rejected inside non-async class methods", () => {
  const sourceText = createSourceText("class Worker { run(value) { return await value; } }");
  const ast = parse(sourceText);

  assert.throws(
    () => analyzeModule(ast, sourceText),
    /'await' is only valid inside async functions/
  );
});

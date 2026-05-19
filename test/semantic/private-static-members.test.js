import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { createSourceText } from "../../src/source/source-text.js";

test("semantic analysis accepts private static member declarations and class-side access", () => {
  const sourceText = createSourceText("class Box { static #value = 1; static #read() { return Box.#value; } static read() { return Box.#read(); } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis separates private static and instance access", () => {
  const staticSource = createSourceText("class Box { static #value = 1; read(other) { return other.#value; } }");
  const staticAst = parse(staticSource);
  assert.throws(
    () => analyzeModule(staticAst, staticSource),
    /Private static member '#value' must be accessed through the declaring class/
  );

  const instanceSource = createSourceText("class Box { #value = 1; static read() { return Box.#value; } }");
  const instanceAst = parse(instanceSource);
  assert.throws(
    () => analyzeModule(instanceAst, instanceSource),
    /Private instance member '#value' must be accessed through an instance/
  );
});

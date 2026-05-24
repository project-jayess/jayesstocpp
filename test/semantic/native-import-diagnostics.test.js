import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";

test("semantic analysis rejects binding imports from native source artifacts with focused header guidance", () => {
  const sourceText = createSourceText('import { nativeAdd } from "./native/math.cpp";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Native source imports cannot provide Jayess bindings: '\.\/native\/math\.cpp'. Import the matching native header instead/
  );
});

test("semantic analysis rejects binding imports from shared-library artifacts with focused header guidance", () => {
  const sourceText = createSourceText('import { nativeAdd } from "./native/math.dll";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Shared-library imports cannot provide Jayess bindings: '\.\/native\/math\.dll'. Import the matching native header instead/
  );
});

test("semantic analysis rejects shared-library side-effect imports without a matching header import", () => {
  const sourceText = createSourceText('import "./native/math.dll";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Shared-library imports require a matching native header import: '\.\/native\/math\.dll'/
  );
});

test("semantic analysis rejects static-library side-effect imports without a matching header import", () => {
  const sourceText = createSourceText('import "./native/math.lib";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Static-library imports require a matching native header import: '\.\/native\/math\.lib'/
  );
});

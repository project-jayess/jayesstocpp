import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { JayessError } from "../../src/diagnostics.js";

test("semantic analysis rejects const reassignment", () => {
  const sourceText = createSourceText("const x = 1; x = 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    (error) => error instanceof JayessError && /Cannot reassign const/.test(error.diagnostics[0].message)
  );
});

test("semantic analysis enforces block scoped var", () => {
  const sourceText = createSourceText("if (1) { var x = 2; } x;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'x'/
  );
});

test("semantic analysis rejects break and continue outside loops", () => {
  const breakSource = createSourceText("break;");
  const continueSource = createSourceText("continue;");
  assert.throws(
    () => analyzeModule(parse(breakSource), breakSource),
    /break is only valid inside a loop or switch/
  );
  assert.throws(
    () => analyzeModule(parse(continueSource), continueSource),
    /continue is only valid inside a loop/
  );
});

test("semantic analysis scopes for-loop variables to the loop", () => {
  const sourceText = createSourceText("for (var i = 0; i < 1; i = i + 1) { i; } i;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'i'/
  );
});

test("semantic analysis accepts do-while loops and loop control", () => {
  const sourceText = createSourceText("var total = 0; do { total += 1; if (total > 2) { break; } continue; } while (total < 5);");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts switch statements with clause-local bindings", () => {
  const sourceText = createSourceText("function run(value) { switch (value) { case 1: var inside = 1; break; default: break; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps switch-clause bindings local", () => {
  const sourceText = createSourceText("switch (1) { case 1: var inside = 1; break; default: break; } inside;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'inside'/
  );
});

test("semantic analysis accepts compound assignment for mutable bindings and members", () => {
  const sourceText = createSourceText("var total = 1; total += 2; total -= 1; var data = { value: 1, items: [2] }; data.value *= 3; data.items[0] /= 2;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects compound assignment on const bindings", () => {
  const sourceText = createSourceText("const total = 1; total += 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Cannot update const 'total'/
  );
});

test("semantic analysis accepts update expressions for mutable bindings and members", () => {
  const sourceText = createSourceText("var total = 1; ++total; total--; var data = { value: 1, items: [2] }; ++data.value; data.items[0]--;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects update expressions on const and invalid targets", () => {
  const constSource = createSourceText("const total = 1; ++total;");
  const invalidSource = createSourceText("var total = 1; ++(total + 1);");

  assert.throws(
    () => analyzeModule(parse(constSource), constSource),
    /Cannot update const 'total'/
  );
  assert.throws(
    () => analyzeModule(parse(invalidSource), invalidSource),
    /Invalid update target for '\+\+'/
  );
});

test("semantic analysis accepts member assignment for objects and arrays", () => {
  const sourceText = createSourceText('var data = { name: "jayess", values: [1, 2] }; data.name = "updated"; data.values[0] = 3;');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects unsupported assignment targets", () => {
  const sourceText = createSourceText("var data = 1; (data + 1) = 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Invalid assignment target for '='/
  );
});

test("semantic analysis accepts try/catch/finally with catch-scoped bindings", () => {
  const sourceText = createSourceText("function run(values) { try { values.push(1); } catch (err) { return err.toString(); } finally { values.push(2); } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps catch bindings scoped to catch blocks", () => {
  const sourceText = createSourceText("function run(action) { try { action(); } catch (err) { var local = err; } return err; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'err'/
  );
});

test("semantic analysis accepts control-flow statements inside finally blocks", () => {
  const sourceText = createSourceText("function run() { try { return 1; } finally { return 2; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis preserves invalid break diagnostics inside finally blocks", () => {
  const sourceText = createSourceText("function run() { try { return 1; } finally { break; } }");
  const ast = parse(sourceText);
  assert.throws(() => analyzeModule(ast, sourceText), /break is only valid inside a loop or switch/);
});

test("semantic analysis accepts throw statements", () => {
  const sourceText = createSourceText('function run(value) { throw value; }');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects undefined throw expressions", () => {
  const sourceText = createSourceText("function run() { throw missingValue; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'missingValue'/
  );
});

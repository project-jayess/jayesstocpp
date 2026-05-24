import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";
import { JayessError } from "../../src/diagnostics.js";
import { parse } from "../../src/parser/parse.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { createSourceText } from "../../src/source/source-text.js";

function analyzeDiagnostics(source) {
  const sourceText = createSourceText(source);
  const ast = parse(sourceText);
  return analyzeModule(ast, sourceText, { throwOnError: false }).diagnostics;
}

test("semantic diagnostics allow supported generator short-circuit yield before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(flag, value) { return flag && (yield value) || (null ?? (yield flag)); }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics reject generator spread call arguments containing yield before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(use, values) { use(...(yield values)); }");

  assert.match(diagnostics[0].message, /spread call arguments containing 'yield'/);
});

test("semantic diagnostics reject generator calls with any spread when call contains yield", () => {
  const diagnostics = analyzeDiagnostics("function* run(use, args, value) { use(...args, yield value); }");

  assert.match(diagnostics[0].message, /calls that contain 'yield'/);
});

test("semantic diagnostics allow expanded generator statement yield positions before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { do { yield value; } while (false); switch (value) { case 1: yield value; break; default: yield 0; } try { yield value; } catch (error) { return error; } }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics reject unsupported generator try/catch yield shapes before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { yield value; } catch (error) { yield error; } }");

  assert.match(diagnostics[0].message, /single direct catch-body yields/);
});

test("semantic diagnostics allow generator try/finally direct yield shapes before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } finally { value = value + 4; } return value; }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics allow focused generator try/catch setup before final yield", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { value = value + 1; yield value; } catch (error) { return error; } }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics allow generator try/catch with multiple direct try-body yields", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } catch (error) { return error; } return value; }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics reject generator try/catch with nested try-body yields", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { if (value) { yield value; } yield value; } catch (error) { return error; } }");

  assert.match(diagnostics[0].message, /direct try-body yields/);
});

test("semantic diagnostics allow focused generator catch-body direct yield", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { if (value) { throw value; } } catch (error) { value = error; yield value; value = value + 1; } return value; }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics reject generator catch handlers with multiple yields", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { throw value; } catch (error) { yield error; yield value; } }");

  assert.match(diagnostics[0].message, /single direct catch-body yields/);
});

test("semantic diagnostics reject nested generator try/finally yield shapes before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { if (value) { yield value; } yield value; } finally { value = value + 1; } }");

  assert.match(diagnostics[0].message, /direct try\/finally yields/);
});

test("semantic diagnostics reject generator try/finally finalizer yields before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { try { yield value; } finally { yield value; } }");

  assert.match(diagnostics[0].message, /non-yielding surrounding statements/);
});

test("semantic diagnostics reject unsupported generator do while test yields before emission", () => {
  const diagnostics = analyzeDiagnostics("function* run(value) { do { value = value + 1; } while (yield value); }");

  assert.match(diagnostics[0].message, /do\/while tests/);
});

test("semantic diagnostics reject generator condition and for-loop yields before emission", () => {
  assert.match(analyzeDiagnostics("function* run(value) { if (yield value) { return value; } }")[0].message, /if tests/);
  assert.match(analyzeDiagnostics("function* run(value) { while (yield value) { value = value + 1; } }")[0].message, /while tests/);
  assert.match(analyzeDiagnostics("function* run(value) { for (var i = yield value; i < 2; i = i + 1) { yield i; } }")[0].message, /for-loop initializers/);
  assert.match(analyzeDiagnostics("function* run(value) { for (var i = 0; yield value; i = i + 1) { yield i; } }")[0].message, /for-loop tests/);
  assert.match(analyzeDiagnostics("function* run(value) { for (var i = 0; i < 2; i = yield value) { yield i; } }")[0].message, /for-loop updates/);
});

test("semantic diagnostics reject unsupported generator expression-yield positions before emission", () => {
  assert.match(analyzeDiagnostics("function* run(value) { var text = `value ${yield value}`; return text; }")[0].message, /selected expression-yield positions/);
  assert.match(analyzeDiagnostics("function* run(value) { var read = (yield value).name; return read; }")[0].message, /selected expression-yield positions/);
  assert.match(analyzeDiagnostics("function* run(value) { var result = !(yield value); return result; }")[0].message, /selected expression-yield positions/);
  assert.match(analyzeDiagnostics("function* run(source) { var value = 1 + (yield* source); return value; }")[0].message, /'yield\*' only as a direct yield statement/);
});

test("semantic diagnostics reject unsupported generator assignment-yield shapes before emission", () => {
  assert.match(analyzeDiagnostics("function* run(target, value) { target += yield value; }")[0].message, /simple assignments with yield on the right-hand side/);
  assert.match(analyzeDiagnostics("function* run(target, value) { (yield target).value = value; }")[0].message, /simple assignments with yield on the right-hand side/);
});

test("semantic diagnostics reject generator array and object spreads when literals contain yield", () => {
  assert.match(analyzeDiagnostics("function* run(items, value) { return [...items, yield value]; }")[0].message, /arrays that contain 'yield'/);
  assert.match(analyzeDiagnostics("function* run(base, value) { return { ...base, value: yield value }; }")[0].message, /objects that contain 'yield'/);
});

test("semantic diagnostics keep supported generator expression-yield forms valid", () => {
  const diagnostics = analyzeDiagnostics("function* run(value, use, target, flag) { var sum = 1 + (yield value); var items = [yield value, flag ? (yield value) : sum]; var record = { first: yield value, second: items }; use(yield sum); target.value = yield sum; return flag ? record : yield target.value; }");

  assert.equal(diagnostics.length, 0);
});

test("semantic diagnostics reject async generator functions before emission", () => {
  const diagnostics = analyzeDiagnostics("async function* run(value) { yield value; } var make = async function* named(value) { yield value; };");

  assert.ok(diagnostics.some((diagnostic) => /async generator functions/.test(diagnostic.message)));
});

test("semantic diagnostics reject computed super outside derived methods", () => {
  const diagnostics = analyzeDiagnostics("class Point { read(name) { return super[name]; } }");

  assert.match(diagnostics[0].message, /computed 'super\[expr\]' only inside derived instance or static methods/);
});

test("semantic diagnostics reject super property assignment", () => {
  const diagnostics = analyzeDiagnostics("class Base { read() { return 1; } } class Child extends Base { write(value) { super.value = value; } }");

  assert.match(diagnostics[0].message, /assigning to 'super' properties/);
});

test("semantic diagnostics reject bare super before emission", () => {
  const diagnostics = analyzeDiagnostics("class Base {} class Child extends Base { read() { return super; } }");

  assert.match(diagnostics[0].message, /Bare 'super' expressions are not supported/);
});

test("semantic diagnostics reject derived constructors without first-statement super", () => {
  const diagnostics = analyzeDiagnostics("class Base {} class Child extends Base { constructor(value) { this.value = value; super(value); } }");

  assert.match(diagnostics[0].message, /require 'super\(\.\.\.\)' as their first statement/);
});

test("api transpile surfaces remaining unsupported generator diagnostics as JayessError", () => {
  assert.throws(
    () => transpile("function* run(use, values) { use(...(yield values)); }", { moduleName: "generator_diag_case" }),
    (error) =>
      error instanceof JayessError
      && /spread call arguments containing 'yield'/.test(error.diagnostics[0].message)
  );
});

test("api transpile surfaces unsupported super diagnostics as JayessError", () => {
  assert.throws(
    () => transpile("class Base { read() { return 1; } } class Child extends Base { write(value) { super.value = value; } }", { moduleName: "super_diag_case" }),
    (error) =>
      error instanceof JayessError
      && /assigning to 'super' properties/.test(error.diagnostics[0].message)
  );
});

test("api transpile surfaces bare super diagnostics as JayessError", () => {
  assert.throws(
    () => transpile("class Base {} class Child extends Base { read() { return super; } }", { moduleName: "bare_super_diag_case" }),
    (error) =>
      error instanceof JayessError
      && /Bare 'super' expressions are not supported/.test(error.diagnostics[0].message)
  );
});

test("semantic diagnostics keep unsupported-by-design global diagnostics", () => {
  assert.match(analyzeDiagnostics("eval(\"value\");")[0].message, /runtime source evaluation is unsupported by design/);
  assert.match(analyzeDiagnostics("Function(\"return 1\");")[0].message, /runtime source evaluation is unsupported by design/);
});

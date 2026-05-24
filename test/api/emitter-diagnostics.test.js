import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";
import { JayessError } from "../../src/diagnostics.js";

function assertSemanticDiagnostic(source, pattern) {
  assert.throws(
    () => transpile(source, { moduleName: "emitter_diagnostic_case" }),
    (error) =>
      error instanceof JayessError
      && error.diagnostics[0]?.phase === "semantic"
      && pattern.test(error.diagnostics[0].message)
  );
}

test("transpile rejects unsupported generator expression-yield before emission", () => {
  assertSemanticDiagnostic(
    "function* run(value) { var result = !(yield value); return result; }",
    /selected expression-yield positions/
  );
});

test("transpile rejects derived constructors without first-statement super before emission", () => {
  assertSemanticDiagnostic(
    "class Base {} class Child extends Base { constructor(value) { this.value = value; super(value); } }",
    /require 'super\(\.\.\.\)' as their first statement/
  );
});

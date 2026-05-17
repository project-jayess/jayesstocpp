import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createSyntaxDiagnostic } from "../src/diagnostics/syntax-diagnostic.js";
import { createSemanticDiagnostic } from "../src/diagnostics/semantic-diagnostic.js";
import { createModuleDiagnostic } from "../src/diagnostics/module-diagnostic.js";
import { JayessError, throwDiagnostics } from "../src/diagnostics.js";
import { parse } from "../src/parser/parse.js";
import { analyzeModule } from "../src/semantic/analyze.js";
import { buildModuleGraph } from "../src/modules/module-graph.js";
import { createSourceText } from "../src/source/source-text.js";

test("diagnostic helpers create structured diagnostics", () => {
  const sourceText = createSourceText("const x = 1;", "sample.js");
  const syntax = createSyntaxDiagnostic(sourceText, 0, "bad syntax");
  const semantic = createSemanticDiagnostic(sourceText, { start: 6 }, "bad semantic");
  const moduleDiagnostic = createModuleDiagnostic(sourceText, { start: 0 }, "bad module", "./dep.js");

  assert.equal(syntax.phase, "syntax");
  assert.equal(semantic.phase, "semantic");
  assert.equal(moduleDiagnostic.phase, "module-resolution");
  assert.equal(moduleDiagnostic.relatedPath, "./dep.js");
});

test("thrown diagnostics are sorted deterministically", () => {
  const sourceText = createSourceText("const x = 1;\nmissing;\n", "sample.js");

  assert.throws(
    () => {
      throwDiagnostics([
        createSemanticDiagnostic(sourceText, { start: 13 }, "second"),
        createSyntaxDiagnostic(sourceText, 0, "first")
      ]);
    },
    (error) => {
      assert.ok(error instanceof JayessError);
      assert.equal(error.diagnostics[0].line, 1);
      assert.equal(error.diagnostics[0].message, "first");
      assert.equal(error.diagnostics[1].line, 2);
      return true;
    }
  );
});

test("structured diagnostics include filename and source location when available", () => {
  const sourceText = createSourceText("const x = 1;\nmissing;\n", "sample.js");
  const syntax = createSyntaxDiagnostic(sourceText, 0, "bad syntax");
  const semantic = createSemanticDiagnostic(sourceText, { start: 13 }, "bad semantic");
  const moduleDiagnostic = createModuleDiagnostic(sourceText, { start: 13 }, "bad module", "./dep.js");

  assert.deepEqual(
    { filename: syntax.filename, line: syntax.line, column: syntax.column },
    { filename: "sample.js", line: 1, column: 1 }
  );
  assert.deepEqual(
    { filename: semantic.filename, line: semantic.line, column: semantic.column },
    { filename: "sample.js", line: 2, column: 1 }
  );
  assert.deepEqual(
    { filename: moduleDiagnostic.filename, line: moduleDiagnostic.line, column: moduleDiagnostic.column },
    { filename: "sample.js", line: 2, column: 1 }
  );
});

test("parser reports malformed import declarations with specific guidance", () => {
  const sourceText = createSourceText('import { add } "./math.js";', "bad-import.js");
  assert.throws(
    () => parse(sourceText),
    (error) => error instanceof JayessError
      && /Malformed import declaration: expected 'from' before the source string/.test(error.diagnostics[0].message)
      && error.diagnostics[0].filename === "bad-import.js"
  );
});

test("parser reports unsupported export forms with specific guidance", () => {
  const sourceText = createSourceText("export 1;", "bad-export.js");
  assert.throws(
    () => parse(sourceText),
    (error) => error instanceof JayessError
      && /Jayess syntax does not support this export form/.test(error.diagnostics[0].message)
      && error.diagnostics[0].filename === "bad-export.js"
  );
});

test("semantic diagnostics explain unsupported operator targets", () => {
  const sourceText = createSourceText("var total = 1; ++(total + 1);", "bad-update.js");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    (error) => error instanceof JayessError
      && /does not support '\+\+' on this update target/.test(error.diagnostics[0].message)
      && error.diagnostics[0].filename === "bad-update.js"
  );
});

test("module-resolution diagnostics explain missing package entries", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-entry-package.js")),
    (error) => error instanceof JayessError
      && /has no transpileable entry file/.test(error.diagnostics[0].message)
      && /empty-lib/.test(error.diagnostics[0].message)
  );
});

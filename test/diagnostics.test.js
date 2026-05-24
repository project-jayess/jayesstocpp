import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createSyntaxDiagnostic } from "../src/diagnostics/syntax-diagnostic.js";
import { createSemanticDiagnostic } from "../src/diagnostics/semantic-diagnostic.js";
import { createModuleDiagnostic } from "../src/diagnostics/module-diagnostic.js";
import { createDiagnostic, JayessError, throwDiagnostics } from "../src/diagnostics.js";
import { parse } from "../src/parser/parse.js";
import { analyzeModule } from "../src/semantic/analyze.js";
import { buildModuleGraph } from "../src/modules/module-graph.js";
import { transpileFile } from "../src/api/transpile-file.js";
import { createSourceText } from "../src/source/source-text.js";
import { createManagedTempDir } from "./support/temp-dir.js";

test("diagnostic helpers create structured diagnostics", () => {
  const sourceText = createSourceText("const x = 1;", "sample.js");
  const syntax = createSyntaxDiagnostic(sourceText, 0, "bad syntax");
  const semantic = createSemanticDiagnostic(sourceText, { start: 6 }, "bad semantic");
  const moduleDiagnostic = createModuleDiagnostic(sourceText, { start: 0 }, "bad module", "./dep.js");

  assert.equal(syntax.phase, "syntax");
  assert.equal(syntax.category, "parser");
  assert.equal(syntax.code, "JY_PARSE_ERROR");
  assert.equal(semantic.phase, "semantic");
  assert.equal(semantic.category, "semantic");
  assert.equal(semantic.code, "JY_SEMANTIC_ERROR");
  assert.equal(moduleDiagnostic.phase, "module-resolution");
  assert.equal(moduleDiagnostic.category, "module");
  assert.equal(moduleDiagnostic.code, "JY_MODULE_ERROR");
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

test("diagnostic helpers assign emitter and runtime code families", () => {
  const emitter = createDiagnostic({ phase: "cpp-emission", message: "bad emit" });
  const runtime = createDiagnostic({ phase: "runtime", message: "bad runtime" });

  assert.equal(emitter.category, "emitter");
  assert.equal(emitter.code, "JY_EMIT_ERROR");
  assert.equal(runtime.category, "runtime");
  assert.equal(runtime.code, "JY_RUNTIME_ERROR");
  assert.deepEqual(JSON.parse(JSON.stringify(runtime)), runtime);
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

test("parser reports unsupported-by-design dynamic import clearly", () => {
  const sourceText = createSourceText('var loader = import("jayess:date");', "bad-dynamic-import.js");
  assert.throws(
    () => parse(sourceText),
    (error) => error instanceof JayessError
      && /unsupported by design/.test(error.diagnostics[0].message)
      && /dynamic import/.test(error.diagnostics[0].message)
      && error.diagnostics[0].code === "JY_PARSE_DYNAMIC_IMPORT"
      && error.diagnostics[0].category === "parser"
      && error.diagnostics[0].filename === "bad-dynamic-import.js"
  );
});

test("parser rejects runtime package imports through dynamic import", () => {
  const sourceText = createSourceText('var loader = import("#tools");', "bad-runtime-package-import.js");
  assert.throws(
    () => parse(sourceText),
    (error) => error instanceof JayessError
      && /unsupported by design/.test(error.diagnostics[0].message)
      && /dynamic import/.test(error.diagnostics[0].message)
      && error.diagnostics[0].filename === "bad-runtime-package-import.js"
  );
});

test("parser reports unsupported-by-design with statements clearly", () => {
  const sourceText = createSourceText("with (config) { value; }", "bad-with.js");
  assert.throws(
    () => parse(sourceText),
    (error) => error instanceof JayessError
      && /unsupported by design/.test(error.diagnostics[0].message)
      && /'with'/.test(error.diagnostics[0].message)
      && error.diagnostics[0].code === "JY_PARSE_WITH_UNSUPPORTED"
      && error.diagnostics[0].filename === "bad-with.js"
  );
});

test("semantic diagnostics include stable unsupported-by-design codes", () => {
  const evalSource = createSourceText("eval(\"value\");", "bad-eval.js");
  const functionSource = createSourceText("Function(\"return 1\");", "bad-function.js");

  assert.throws(
    () => analyzeModule(parse(evalSource), evalSource),
    (error) => error instanceof JayessError
      && error.diagnostics[0].code === "JY_SEMANTIC_EVAL_UNSUPPORTED"
      && error.diagnostics[0].category === "semantic"
  );
  assert.throws(
    () => analyzeModule(parse(functionSource), functionSource),
    (error) => error instanceof JayessError
      && error.diagnostics[0].code === "JY_SEMANTIC_FUNCTION_CONSTRUCTOR_UNSUPPORTED"
      && error.diagnostics[0].category === "semantic"
  );
});

test("semantic diagnostics explain unsupported operator targets", () => {
  const sourceText = createSourceText("var total = 1; ++(total + 1);", "bad-update.js");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    (error) => error instanceof JayessError
      && /Invalid update target for '\+\+'/.test(error.diagnostics[0].message)
      && error.diagnostics[0].filename === "bad-update.js"
  );
});

test("module-resolution diagnostics explain missing package entries", () => {
  assert.throws(
    () => buildModuleGraph(path.resolve("test/fixtures/package-project/src/missing-entry-package.js")),
    (error) => error instanceof JayessError
      && /has no transpileable entry file/.test(error.diagnostics[0].message)
      && error.diagnostics[0].code === "JY_MODULE_ERROR"
      && error.diagnostics[0].category === "module"
      && /empty-lib/.test(error.diagnostics[0].message)
  );
});

test("transpileFile reports missing native artifact imports as Jayess diagnostics", (t) => {
  for (const [filename, source, kind] of [
    ["missing-header.js", 'import { value } from "./missing.hpp";\nexport function run() { return value; }\n', "native-header"],
    ["missing-source.js", 'import "./missing.cpp";\nexport function run() { return null; }\n', "native-source"],
    ["missing-shared.js", 'import { value } from "./missing.hpp";\nimport "./missing.dll";\nexport function run() { return value; }\n', "shared-library"],
    ["missing-static.js", 'import { value } from "./missing.hpp";\nimport "./missing.lib";\nexport function run() { return value; }\n', "static-library"]
  ]) {
    const root = createManagedTempDir(t, `missing-${kind}`);
    const entry = path.join(root, filename);
    if (kind === "shared-library" || kind === "static-library") {
      fs.writeFileSync(path.join(root, "missing.hpp"), "#pragma once\n", "utf8");
    }
    fs.writeFileSync(entry, source, "utf8");

    assert.throws(
      () => transpileFile(entry, path.join(root, "out"), { runtimeFragments: "all" }),
      (error) => error instanceof JayessError
        && new RegExp(`Cannot copy ${kind} import`).test(error.diagnostics[0].message)
        && error.diagnostics[0].relatedPath != null
    );
  }
});

test("generated runtime diagnostics include invalid standard-library handle categories", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-handle-diagnostics");
  const fixture = path.resolve("test/fixtures/modules/subprocess-main.js");
  transpileFile(fixture, targetDir, { runtimeFragments: "all" });

  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  assert.match(runtimeSource, /Expected Jayess http response handle/);
  assert.match(runtimeSource, /Expected Jayess net socket handle/);
  assert.match(runtimeSource, /Expected Jayess stream handle/);
  assert.match(runtimeSource, /Expected Jayess subprocess handle/);
  assert.match(runtimeSource, /Expected Jayess thread handle/);
});

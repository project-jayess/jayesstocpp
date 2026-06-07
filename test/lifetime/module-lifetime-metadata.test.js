import test from "node:test";
import assert from "node:assert/strict";
import { analyzeEscapes } from "../../src/lifetime/analyze-escapes.js";
import { createModuleLifetimeMetadata } from "../../src/lifetime/module-lifetime-metadata.js";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";

function lifetimeMetadata(source) {
  const sourceText = createSourceText(source);
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  return createModuleLifetimeMetadata(ast, analyzeEscapes(ast));
}

test("module lifetime metadata records local, captured, returned, exported, and stored bindings", () => {
  const metadata = lifetimeMetadata(`
    var moduleValue = seed;
    export var exportedValue = moduleValue;
    function make(input) {
      var local = input;
      var reader = function() {
        return local;
      };
      state.value = reader;
      return reader;
    }
  `);

  assert.equal(metadata.kind, "jayess-module-lifetime");
  assert.deepEqual(metadata.moduleStateBindings, ["make", "moduleValue"]);
  assert.deepEqual(metadata.exportedValues, ["exportedValue"]);
  assert.ok(metadata.localBindings.includes("local"));
  assert.ok(metadata.capturedBindings.includes("local"));
  assert.ok(metadata.returnedValues.includes("reader"));
  assert.ok(metadata.storedBindings.includes("reader"));
  assert.ok(metadata.escapingBindings.includes("reader"));
  assert.equal(metadata.fallback.strategy, "broad-runtime-value-ownership");
});

test("module lifetime metadata records thrown bindings separately from returned values", () => {
  const metadata = lifetimeMetadata(`
    function run(errorValue) {
      if (errorValue) {
        throw errorValue;
      }
      return 0;
    }
  `);

  assert.deepEqual(metadata.thrownValues, ["errorValue"]);
  assert.equal(metadata.returnedValues.includes("errorValue"), false);
  assert.ok(metadata.escapingBindings.includes("errorValue"));
});

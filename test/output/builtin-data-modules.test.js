import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { JayessError } from "../../src/diagnostics.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

function assertGeneratedStdlibModule(result, targetDir, subpath) {
  const modulePath = generatedStdlibCppPath(targetDir, subpath);
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(modulePath));
  return modulePath;
}

function transpileFileWithFullRuntime(fixture, targetDir) {
  return transpileFile(fixture, targetDir, { runtimeFragments: "all" });
}

test("transpileFile resolves built-in Jayess date modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-date-output");
  const fixture = path.resolve("test/fixtures/modules/date-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("date_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_date_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "date-primitives.hpp")));
  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "date-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessDateToIsoString/);
  assert.match(nativeHeader, /jayessDateParseIso/);
  assert.match(moduleSource, /jayessDateToIsoString/);
  assert.match(moduleSource, /jayessDateGetUtcYear/);
  assert.match(moduleSource, /jayessDateAddMillis/);
  assert.match(moduleSource, /jayessDateDiffMillis/);
  assert.match(moduleSource, /jayessDateParseIso/);
});

test("transpileFile resolves built-in Jayess json modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-json-output");
  const fixture = path.resolve("test/fixtures/modules/json-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("json_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_json_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "json-primitives.hpp")));
  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "json-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessJsonStringifyPretty/);
  assert.match(nativeHeader, /jayessJsonValidate/);
  assert.match(moduleSource, /jayessJsonStringifyPretty/);
  assert.match(moduleSource, /jayessJsonValidate/);
});

test("transpileFile resolves built-in Jayess map modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-map-output");
  const fixture = path.resolve("test/fixtures/modules/map-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("map_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_collections_map_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "map-primitives.hpp")));
  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "map-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessMapKeys/);
  assert.match(nativeHeader, /jayessMapEntries/);
  assert.match(nativeHeader, /jayessMapFromEntries/);
  assert.match(nativeHeader, /jayessMapSetAll/);
  assert.match(nativeHeader, /jayessMapDeleteAll/);
  assert.match(moduleSource, /jayessMapKeys/);
  assert.match(moduleSource, /jayessMapValues/);
  assert.match(moduleSource, /jayessMapEntries/);
  assert.match(moduleSource, /jayessMapFromEntries/);
  assert.match(moduleSource, /jayessMapSetAll/);
  assert.match(moduleSource, /jayessMapDeleteAll/);
});

test("transpileFile resolves built-in Jayess set modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-set-output");
  const fixture = path.resolve("test/fixtures/modules/set-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("set_main_js.cpp")));
  const modulePath = result.files.find((file) => file.includes("stdlib_jayess_collections_set_index_js.cpp"));
  assert.ok(modulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "set-primitives.hpp")));
  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "set-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  assert.match(nativeHeader, /jayessSetValues/);
  assert.match(nativeHeader, /jayessSetEntries/);
  assert.match(nativeHeader, /jayessSetFromValues/);
  assert.match(nativeHeader, /jayessSetUnion/);
  assert.match(nativeHeader, /jayessSetIntersection/);
  assert.match(nativeHeader, /jayessSetDifference/);
  assert.match(moduleSource, /jayessSetValues/);
  assert.match(moduleSource, /jayessSetEntries/);
  assert.match(moduleSource, /jayessSetFromValues/);
  assert.match(moduleSource, /jayessSetUnion/);
  assert.match(moduleSource, /jayessSetIntersection/);
  assert.match(moduleSource, /jayessSetDifference/);
});

test("transpileFile resolves built-in Jayess object modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-object-output");
  const fixture = path.resolve("test/fixtures/modules/object-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("object_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_object_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "object-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "object-primitives.hpp"), "utf8");
  assert.match(nativeHeader, /jayessObjectHas/);
  assert.match(nativeHeader, /jayessObjectFromEntries/);
  assert.match(nativeHeader, /jayessObjectAssign/);
});

test("transpileFile resolves built-in Jayess number modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-number-output");
  const fixture = path.resolve("test/fixtures/modules/number-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("number_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_number_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "number-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "number-primitives.hpp"), "utf8");
  assert.match(nativeHeader, /jayessNumberIsInteger/);
  assert.match(nativeHeader, /jayessNumberIsFinite/);
});

test("transpileFile resolves built-in Jayess math modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-math-output");
  const fixture = path.resolve("test/fixtures/modules/math-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("math_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_math_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "math-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "math-primitives.hpp"), "utf8");
  assert.match(nativeHeader, /jayessMathAbs/);
  assert.match(nativeHeader, /jayessMathMin/);
  assert.match(nativeHeader, /jayessMathPow/);
});

test("transpileFile resolves built-in Jayess iterator modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-iter-output");
  const fixture = path.resolve("test/fixtures/modules/iter-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("iter_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_iter_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "iter-primitives.hpp")));

  const nativeHeader = fs.readFileSync(path.join(targetDir, "native", "iter-primitives.hpp"), "utf8");
  assert.match(nativeHeader, /jayessIterNext/);
  assert.match(nativeHeader, /jayessIterToArray/);
  assert.match(nativeHeader, /jayessIterFilter/);
  assert.match(nativeHeader, /jayessIterForEach/);
  assert.match(nativeHeader, /jayessIterReduce/);
  assert.match(nativeHeader, /jayessIterSome/);
  assert.match(nativeHeader, /jayessIterEvery/);
  assert.match(nativeHeader, /jayessIterFind/);
  assert.match(nativeHeader, /jayessIterChain/);
  assert.match(nativeHeader, /jayessIterRange/);
});

test("transpileFile resolves built-in Jayess string modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-string-output");
  const fixture = path.resolve("test/fixtures/modules/string-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("string_main_js.cpp")));
  assertGeneratedStdlibModule(result, targetDir, "string");
  assert.ok(fs.existsSync(path.join(targetDir, "native", "string-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "string-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessStringTrim/);
  assert.match(primitiveSource, /jayessStringSlice/);
  assert.match(primitiveSource, /jayessStringIndexOf/);
  assert.match(primitiveSource, /jayessStringSplit/);
  assert.match(primitiveSource, /jayessStringReplaceFirst/);
  assert.match(primitiveSource, /jayessStringReplaceAll/);
  assert.match(primitiveSource, /jayessStringPadStart/);
  assert.match(primitiveSource, /jayessStringPadEnd/);
  assert.match(primitiveSource, /jayessStringRepeat/);
  assert.match(primitiveSource, /jayessStringToLower/);
  assert.match(primitiveSource, /jayessStringToUpper/);
});

test("transpileFile writes selected stdlib modules under generated stdlib directories", (t) => {
  const cases = [
    ["string", "test/fixtures/modules/string-main.js"],
    ["async", "test/fixtures/modules/async-main.js"],
    ["fs", "test/fixtures/modules/fs-main.js"]
  ];

  for (const [subpath, fixtureName] of cases) {
    const targetDir = createManagedTempDir(t, `generated-stdlib-${subpath}`);
    const result = transpileFile(path.resolve(fixtureName), targetDir);
    const modulePath = assertGeneratedStdlibModule(result, targetDir, subpath);
    assert.equal(path.relative(targetDir, modulePath).startsWith(path.join("generated-stdlib", "jayess", subpath)), true);
    assert.equal(fs.existsSync(path.join(targetDir, `stdlib_jayess_${subpath}_index_js.cpp`)), false);
  }
});

test("transpileFile resolves built-in Jayess array modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-array-output");
  const fixture = path.resolve("test/fixtures/modules/array-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("array_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_array_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "array-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "array-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessArraySlice/);
  assert.match(primitiveSource, /jayessArrayConcat/);
  assert.match(primitiveSource, /jayessArrayIsArray/);
  assert.match(primitiveSource, /jayessArrayIndexOf/);
  assert.match(primitiveSource, /jayessArrayFind/);
  assert.match(primitiveSource, /jayessArrayFindIndex/);
  assert.match(primitiveSource, /jayessArraySome/);
  assert.match(primitiveSource, /jayessArrayEvery/);
  assert.match(primitiveSource, /jayessArrayReverse/);
  assert.match(primitiveSource, /jayessArraySort/);
  assert.match(primitiveSource, /jayessArrayMap/);
  assert.match(primitiveSource, /jayessArrayFilter/);
  assert.match(primitiveSource, /jayessArrayReduce/);
});

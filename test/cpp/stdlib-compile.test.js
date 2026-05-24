import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileCppFiles, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const compileTest = findAvailableCompiler() == null ? test.skip : test;

function compileFixture(t, tempName, fixturePath) {
  const targetDir = createManagedTempDir(t, tempName);
  const fixture = path.resolve(fixturePath);
  const result = transpileFile(fixture, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  compileCppFiles(cppFiles, targetDir);
  assert.ok(true);
}

const stdlibCompileCases = [
  ["transpileFile pruned mixed stdlib project compiles with the available C++ compiler", "runtime-pruned-mixed-stdlib-compile", "test/fixtures/modules/system-modules-main.js"],
  ["transpileFile built-in date module project compiles with the available C++ compiler", "builtin-date-project-compile", "test/fixtures/modules/date-main.js"],
  ["transpileFile built-in json module project compiles with the available C++ compiler", "builtin-json-project-compile", "test/fixtures/modules/json-main.js"],
  ["transpileFile built-in map module project compiles with the available C++ compiler", "builtin-map-project-compile", "test/fixtures/modules/map-main.js"],
  ["transpileFile built-in set module project compiles with the available C++ compiler", "builtin-set-project-compile", "test/fixtures/modules/set-main.js"],
  ["transpileFile built-in object module project compiles with the available C++ compiler", "builtin-object-project-compile", "test/fixtures/modules/object-main.js"],
  ["transpileFile built-in number module project compiles with the available C++ compiler", "builtin-number-project-compile", "test/fixtures/modules/number-main.js"],
  ["transpileFile built-in math module project compiles with the available C++ compiler", "builtin-math-project-compile", "test/fixtures/modules/math-main.js"],
  ["transpileFile built-in iterator module project compiles with the available C++ compiler", "builtin-iter-project-compile", "test/fixtures/modules/iter-main.js"],
  ["transpileFile built-in path module project compiles with the available C++ compiler", "builtin-path-project-compile", "test/fixtures/modules/path-main.js"],
  ["transpileFile built-in filesystem module project compiles with the available C++ compiler", "builtin-fs-project-compile", "test/fixtures/modules/fs-main.js"],
  ["transpileFile async filesystem module project compiles with the available C++ compiler", "builtin-fs-async-project-compile", "test/fixtures/modules/fs-async-main.js"],
  ["transpileFile built-in string module project compiles with the available C++ compiler", "builtin-string-project-compile", "test/fixtures/modules/string-main.js"],
  ["transpileFile built-in array module project compiles with the available C++ compiler", "builtin-array-project-compile", "test/fixtures/modules/array-main.js"],
  ["transpileFile built-in async module project compiles with the available C++ compiler", "builtin-async-project-compile", "test/fixtures/modules/async-main.js"],
  ["transpileFile async sleep zero project compiles with the available C++ compiler", "builtin-async-sleep-zero-compile", "test/fixtures/modules/async-sleep-zero-main.js"],
  ["transpileFile async timeout resolved project compiles with the available C++ compiler", "builtin-async-timeout-resolved-compile", "test/fixtures/modules/async-timeout-resolved-main.js"],
  ["transpileFile built-in regex module project compiles with the available C++ compiler", "builtin-regex-project-compile", "test/fixtures/modules/regex-main.js"],
  ["transpileFile built-in assert module project compiles with the available C++ compiler", "builtin-assert-project-compile", "test/fixtures/modules/assert-main.js"],
  ["transpileFile built-in system module project compiles with the available C++ compiler", "builtin-system-project-compile", "test/fixtures/modules/system-modules-main.js"],
  ["transpileFile built-in jayess:system module project compiles with the available C++ compiler", "builtin-system-alias-project-compile", "test/fixtures/modules/system-main.js"],
  ["transpileFile built-in thread module project compiles with the available C++ compiler", "builtin-thread-project-compile", "test/fixtures/modules/thread-main.js"],
  ["transpileFile built-in timers module project compiles with the available C++ compiler", "builtin-timers-project-compile", "test/fixtures/modules/timers-main.js"],
  ["transpileFile console module project compiles with the available C++ compiler", "console-project-compile", "test/fixtures/modules/console-main.js"],
  ["transpileFile bytes module project compiles with the available C++ compiler", "bytes-project-compile", "test/fixtures/modules/bytes-main.js"],
  ["transpileFile buffer module project compiles with the available C++ compiler", "buffer-project-compile", "test/fixtures/modules/buffer-main.js"],
  ["transpileFile encoding module project compiles with the available C++ compiler", "encoding-project-compile", "test/fixtures/modules/encoding-main.js"],
  ["transpileFile crypto module project compiles with the available C++ compiler", "crypto-project-compile", "test/fixtures/modules/crypto-main.js"],
  ["transpileFile url module project compiles with the available C++ compiler", "url-project-compile", "test/fixtures/modules/url-main.js"],
  ["transpileFile os module project compiles with the available C++ compiler", "os-project-compile", "test/fixtures/modules/os-main.js"],
  ["transpileFile time module project compiles with the available C++ compiler", "time-project-compile", "test/fixtures/modules/time-main.js"],
  ["transpileFile filesystem binary helper project compiles with the available C++ compiler", "fs-binary-project-compile", "test/fixtures/modules/fs-binary-main.js"],
  ["transpileFile stream module project compiles with the available C++ compiler", "stream-project-compile", "test/fixtures/modules/stream-main.js"],
  ["transpileFile events module project compiles with the available C++ compiler", "events-project-compile", "test/fixtures/modules/events-main.js"]
];

for (const [name, tempName, fixturePath] of stdlibCompileCases) {
  compileTest(name, (t) => {
    compileFixture(t, tempName, fixturePath);
  });
}

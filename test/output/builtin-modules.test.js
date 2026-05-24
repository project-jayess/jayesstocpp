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

test("transpileFile copies expanded system-module native bridge headers into output", (t) => {
  const targetDir = createManagedTempDir(t, "native-system-output");
  const fixture = path.resolve("test/fixtures/modules/system-modules-main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const fsHeader = fs.readFileSync(path.join(targetDir, "native", "fs-primitives.hpp"), "utf8");
  const pathHeader = fs.readFileSync(path.join(targetDir, "native", "path-primitives.hpp"), "utf8");
  const processHeader = fs.readFileSync(path.join(targetDir, "native", "process-primitives.hpp"), "utf8");

  assert.match(fsHeader, /jayessFsRemove/);
  assert.match(fsHeader, /jayessFsList/);
  assert.match(fsHeader, /jayessFsRename/);
  assert.match(fsHeader, /jayessFsStat/);
  assert.match(pathHeader, /jayessPathResolve/);
  assert.match(pathHeader, /jayessPathRelative/);
  assert.match(pathHeader, /jayessPathIsAbsolute/);
  assert.match(processHeader, /jayessProcessArgv/);
});

test("transpileFile resolves built-in Jayess system module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-system-alias-output");
  const fixture = path.resolve("test/fixtures/modules/system-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("system_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_system_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "system-primitives.hpp")));

  const systemHeader = fs.readFileSync(path.join(targetDir, "native", "system-primitives.hpp"), "utf8");
  assert.match(systemHeader, /jayessSystemArgs/);
  assert.match(systemHeader, /jayessSystemHasEnv/);
  assert.match(systemHeader, /jayessSystemExitCode/);
});

test("transpileFile resolves built-in Jayess async modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-async-output");
  const fixture = path.resolve("test/fixtures/modules/async-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("async_main_js.cpp")));
  assertGeneratedStdlibModule(result, targetDir, "async");
  assert.ok(fs.existsSync(path.join(targetDir, "native", "async-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "async-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessAsyncAllSettled/);
  assert.match(primitiveSource, /jayessAsyncAny/);
  assert.match(primitiveSource, /jayessAsyncSleep/);
  assert.match(primitiveSource, /jayessAsyncTimeout/);
  assert.match(primitiveSource, /jayessAsyncCatchError/);
  assert.match(primitiveSource, /jayessAsyncFinallyDo/);
  assert.match(primitiveSource, /jayessAsyncDelay/);
  assert.match(primitiveSource, /jayessAsyncRetry/);
});

test("transpileFile resolves built-in Jayess thread modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-thread-output");
  const fixture = path.resolve("test/fixtures/modules/thread-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("thread_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_thread_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "thread-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "thread-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessThreadSpawn/);
  assert.match(primitiveSource, /jayessThreadJoin/);
  assert.match(primitiveSource, /jayessThreadHardwareConcurrency/);
});

test("transpileFile resolves built-in Jayess time modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-time-output");
  const fixture = path.resolve("test/fixtures/modules/time-main.js");
  const result = transpileFile(fixture, targetDir);

  const timeModulePath = assertGeneratedStdlibModule(result, targetDir, "time");
  assert.ok(result.files.some((file) => file.endsWith("time_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "time-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "time-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(timeModulePath, "utf8");
  assert.match(headerSource, /value time_millis\(\);/);
  assert.match(cppSource, /value time_format_duration\(const value& milliseconds\)/);
  assert.match(primitiveSource, /jayessTimeMillis/);
  assert.match(primitiveSource, /jayessTimeFormatDuration/);
  assert.match(moduleSource, /jayessTimeElapsed/);
  assert.match(moduleSource, /jayessTimeMinutes/);
});

test("transpileFile resolves built-in Jayess regex modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-regex-output");
  const fixture = path.resolve("test/fixtures/modules/regex-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("regex_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_regex_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "regex-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "regex-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessRegexCreate/);
  assert.match(primitiveSource, /jayessRegexSplit/);
  assert.match(primitiveSource, /jayessRegexMatchAll/);
  assert.match(primitiveSource, /Jayess regex create expects at most one flags argument/);
});

test("transpileFile resolves built-in Jayess system modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-system-output");
  const fixture = path.resolve("test/fixtures/modules/system-modules-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("system_modules_main_js.cpp")));
  const fsModulePath = result.files.find((file) => file.includes("stdlib_jayess_fs_index_js.cpp"));
  const pathModulePath = result.files.find((file) => file.includes("stdlib_jayess_path_index_js.cpp"));
  const processModulePath = result.files.find((file) => file.includes("stdlib_jayess_process_index_js.cpp"));
  assert.ok(fsModulePath);
  assert.ok(pathModulePath);
  assert.ok(processModulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "path-primitives.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "process-primitives.hpp")));

  const fsModuleSource = fs.readFileSync(fsModulePath, "utf8");
  const pathModuleSource = fs.readFileSync(pathModulePath, "utf8");
  const processModuleSource = fs.readFileSync(processModulePath, "utf8");

  assert.match(fsModuleSource, /jayessFsList/);
  assert.match(fsModuleSource, /jayessFsRemove/);
  assert.match(fsModuleSource, /jayessFsRename/);
  assert.match(fsModuleSource, /jayessFsStat/);
  assert.match(pathModuleSource, /jayessPathResolve/);
  assert.match(pathModuleSource, /jayessPathRelative/);
  assert.match(pathModuleSource, /jayessPathIsAbsolute/);
  assert.match(processModuleSource, /jayessProcessArgv/);
});

test("transpileFile resolves focused Jayess path module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-path-output");
  const fixture = path.resolve("test/fixtures/modules/path-main.js");
  const result = transpileFile(fixture, targetDir);

  const pathModulePath = result.files.find((file) => file.includes("stdlib_jayess_path_index_js.cpp"));
  assert.ok(result.files.some((file) => file.endsWith("path_main_js.cpp")));
  assert.ok(pathModulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "path-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "path-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(pathModulePath, "utf8");
  assert.match(primitiveSource, /jayessPathJoin/);
  assert.match(primitiveSource, /jayessPathIsAbsolute/);
  assert.match(primitiveSource, /Jayess path join expects string parts/);
  assert.match(moduleSource, /jayessPathResolve/);
  assert.match(moduleSource, /jayessPathRelative/);
});

test("transpileFile resolves focused Jayess filesystem module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-output");
  const fixture = path.resolve("test/fixtures/modules/fs-main.js");
  const result = transpileFile(fixture, targetDir);

  const fsModulePath = assertGeneratedStdlibModule(result, targetDir, "fs");
  assert.ok(result.files.some((file) => file.endsWith("fs_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "fs-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(fsModulePath, "utf8");
  assert.match(primitiveSource, /jayessFsReadText/);
  assert.match(primitiveSource, /jayessFsReadTextSync/);
  assert.match(primitiveSource, /jayessFsReadBytes/);
  assert.match(primitiveSource, /jayessFsReadBytesSync/);
  assert.match(primitiveSource, /jayessFsWriteText/);
  assert.match(primitiveSource, /jayessFsWriteTextSync/);
  assert.match(primitiveSource, /jayessFsWriteBytes/);
  assert.match(primitiveSource, /jayessFsWriteBytesSync/);
  assert.match(primitiveSource, /jayessFsAppendText/);
  assert.match(primitiveSource, /jayessFsCopy/);
  assert.match(primitiveSource, /Jayess fs writeText expects string content/);
  assert.match(primitiveSource, /Jayess fs writeBytes expects a string path/);
  assert.match(moduleSource, /jayessFsExists/);
  assert.match(moduleSource, /jayessFsExistsSync/);
  assert.match(moduleSource, /jayessFsStat/);
  assert.match(moduleSource, /jayessFsStatSync/);
});

test("transpileFile resolves focused Jayess os module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-os-output");
  const fixture = path.resolve("test/fixtures/modules/os-main.js");
  const result = transpileFile(fixture, targetDir);

  const osModulePath = assertGeneratedStdlibModule(result, targetDir, "os");
  assert.ok(result.files.some((file) => file.endsWith("os_main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "os-primitives.hpp")));

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "os-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(osModulePath, "utf8");
  assert.match(headerSource, /value os_platform\(\);/);
  assert.match(headerSource, /value os_hostname\(\);/);
  assert.match(cppSource, /value os_temporary_directory\(\)/);
  assert.match(cppSource, /std::filesystem::temp_directory_path\(\)/);
  assert.match(primitiveSource, /jayessOsPlatform/);
  assert.match(primitiveSource, /jayessOsHomeDir/);
  assert.match(primitiveSource, /jayessOsTmpDir/);
  assert.match(primitiveSource, /jayessOsNewline/);
  assert.match(moduleSource, /jayessOsArch/);
  assert.match(moduleSource, /jayessOsHostname/);
});

test("transpileFile resolves focused Jayess filesystem binary helpers into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-binary-output");
  const fixture = path.resolve("test/fixtures/modules/fs-binary-main.js");
  const result = transpileFile(fixture, targetDir);

  const fsModulePath = result.files.find((file) => file.includes("stdlib_jayess_fs_index_js.cpp"));
  assert.ok(result.files.some((file) => file.endsWith("fs_binary_main_js.cpp")));
  assert.ok(fsModulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));

  const moduleSource = fs.readFileSync(fsModulePath, "utf8");
  assert.match(moduleSource, /jayessFsReadBytes/);
  assert.match(moduleSource, /jayessFsReadBytesSync/);
  assert.match(moduleSource, /jayessFsWriteBytes/);
  assert.match(moduleSource, /jayessFsWriteBytesSync/);
  assert.match(moduleSource, /jayessFsAppendText/);
  assert.match(moduleSource, /jayessFsAppendTextSync/);
  assert.match(moduleSource, /jayessFsCopy/);
  assert.match(moduleSource, /jayessFsCopySync/);
});

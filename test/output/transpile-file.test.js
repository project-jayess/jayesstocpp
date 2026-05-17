import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile writes generated files under target", (t) => {
  const targetDir = createManagedTempDir(t, "project-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("main_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "runtime", "jayess_runtime.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "runtime", "jayess_runtime.cpp")));
  assert.ok(result.files.every((file) => file.startsWith(targetDir)));
});

test("transpileFile writes runtime async helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-async-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct async_state/);
  assert.match(headerSource, /value make_pending_async\(\);/);
  assert.match(cppSource, /value make_pending_async\(\)/);
  assert.match(cppSource, /void run_async_scheduler\(\)/);
});

test("transpileFile writes runtime generator helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-generator-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct generator_state/);
  assert.match(headerSource, /value make_generator_handle\(\);/);
  assert.match(cppSource, /value make_generator_handle\(\)/);
  assert.match(cppSource, /value generator_resume\(const value& input\)/);
});

test("transpileFile writes runtime class-chain helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-class-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value set_base_class\(const value& classValue, const value& baseClass\);/);
  assert.match(headerSource, /value find_class_method\(const value& classValue, const std::string& key\);/);
  assert.match(cppSource, /constexpr const char\* kJayessBaseClassKey = "__jayess_base_class";/);
  assert.match(cppSource, /value set_instance_class\(const value& instance, const value& classValue\)/);
  assert.match(cppSource, /value find_class_method\(const value& classValue, const std::string& key\)/);
});

test("transpileFile writes runtime private-field helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-private-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value get_private_field\(const value& instance, const value& classValue, const std::string& key\);/);
  assert.match(headerSource, /value set_private_field\(const value& instance, const value& classValue, const std::string& key, const value& assigned\);/);
  assert.match(cppSource, /constexpr const char\* kJayessPrivateFieldPrefix = "__jayess_private_";/);
  assert.match(cppSource, /value get_private_field\(const value& instance, const value& classValue, const std::string& key\)/);
  assert.match(cppSource, /value set_private_field\(const value& instance, const value& classValue, const std::string& key, const value& assigned\)/);
});

test("transpileFile writes runtime date helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-date-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value make_date_now\(\);/);
  assert.match(headerSource, /value make_date_from_unix_millis\(double millis\);/);
  assert.match(headerSource, /bool is_date_value\(const value& input\);/);
  assert.match(headerSource, /value date_to_unix_millis\(const value& input\);/);
  assert.match(cppSource, /constexpr const char\* kJayessDateTagKey = "__jayess_date_tag";/);
  assert.match(cppSource, /value make_date_now\(\)/);
  assert.match(cppSource, /value date_to_unix_millis\(const value& input\)/);
});

test("transpileFile writes runtime json helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-json-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value json_parse_text\(const std::string& text\);/);
  assert.match(headerSource, /value json_stringify_value\(const value& input\);/);
  assert.match(headerSource, /bool is_json_text\(const std::string& text\);/);
  assert.match(cppSource, /struct json_reader/);
  assert.match(cppSource, /value json_parse_text\(const std::string& text\)/);
  assert.match(cppSource, /value json_stringify_value\(const value& input\)/);
});

test("transpileFile writes runtime map helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-map-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct map_value \{/);
  assert.match(headerSource, /value make_map\(\);/);
  assert.match(headerSource, /value map_set\(const value& map, const value& key, const value& assigned\);/);
  assert.match(cppSource, /value make_map\(\)/);
  assert.match(cppSource, /value map_get\(const value& map, const value& key\)/);
  assert.match(cppSource, /value map_size\(const value& map\)/);
});

test("transpileFile writes runtime set helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-set-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct set_value \{/);
  assert.match(headerSource, /value make_set\(\);/);
  assert.match(headerSource, /value set_add\(const value& input, const value& member\);/);
  assert.match(cppSource, /value make_set\(\)/);
  assert.match(cppSource, /value set_has\(const value& input, const value& member\)/);
  assert.match(cppSource, /value set_size\(const value& input\)/);
});

test("transpileFile writes runtime system-module helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-system-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value fs_exists_path\(const std::string& pathText\);/);
  assert.match(headerSource, /value path_join_parts\(const std::vector<std::string>& parts\);/);
  assert.match(headerSource, /value process_current_working_directory\(\);/);
  assert.match(cppSource, /std::filesystem::path require_filesystem_path\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_read_text_file\(const std::string& pathText\)/);
  assert.match(cppSource, /value path_normalize\(const std::string& pathText\)/);
  assert.match(cppSource, /void process_exit_with_code\(int code\)/);
});

test("transpileFile resolves built-in Jayess date modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-date-output");
  const fixture = path.resolve("test/fixtures/modules/date-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("date_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_date_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "date-primitives.hpp")));
});

test("transpileFile resolves built-in Jayess json modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-json-output");
  const fixture = path.resolve("test/fixtures/modules/json-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("json_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_json_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "json-primitives.hpp")));
});

test("transpileFile resolves built-in Jayess map modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-map-output");
  const fixture = path.resolve("test/fixtures/modules/map-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("map_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_collections_map_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "map-primitives.hpp")));
});

test("transpileFile resolves built-in Jayess set modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-set-output");
  const fixture = path.resolve("test/fixtures/modules/set-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("set_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_collections_set_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "set-primitives.hpp")));
});

test("transpileFile resolves built-in Jayess system modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-system-output");
  const fixture = path.resolve("test/fixtures/modules/system-modules-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("system_modules_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_fs_index_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_path_index_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_process_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "path-primitives.hpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "process-primitives.hpp")));
});

test("transpileFile copies native headers into target", (t) => {
  const targetDir = createManagedTempDir(t, "native-output");
  const fixture = path.resolve("test/fixtures/modules/native-user.js");
  transpileFile(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "native", "math.hpp")));
});

test("transpileFile copies native source artifacts into target", (t) => {
  const targetDir = createManagedTempDir(t, "native-source-output");
  const fixture = path.resolve("test/fixtures/modules/native-source-user.js");
  transpileFile(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "native", "math.cpp")));
});

test("transpileFile copies shared and static library artifacts into target", (t) => {
  const targetDir = createManagedTempDir(t, "library-artifact-output");
  const fixture = path.resolve("test/fixtures/modules/library-user.js");
  transpileFile(fixture, targetDir);

  assert.ok(fs.existsSync(path.join(targetDir, "libraries", "math.dll")));
  assert.ok(fs.existsSync(path.join(targetDir, "libraries", "math.lib")));
});

test("transpileFile can write shared-library project layout", (t) => {
  const targetDir = createManagedTempDir(t, "shared-layout-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  const result = transpileFile(fixture, targetDir, {
    projectKind: "shared-library",
    libraryName: "jayess_demo"
  });

  assert.ok(result.files.some((file) => file.endsWith("shared-library\\jayess_entry.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "shared-library", "jayess_shared_library.json")));
});

test("transpileFile writes shared-library manifest with stable content", (t) => {
  const targetDir = createManagedTempDir(t, "shared-layout-manifest-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir, {
    projectKind: "shared-library",
    libraryName: "jayess_demo"
  });

  const manifest = JSON.parse(
    fs.readFileSync(path.join(targetDir, "shared-library", "jayess_shared_library.json"), "utf8")
  );

  assert.deepEqual(manifest, {
    kind: "shared-library-project",
    libraryName: "jayess_demo",
    entryHeader: "main_js.hpp",
    entryNamespace: "jayess_module_main_js",
    entryFunction: "jayess_library_entry"
  });
});

test("transpileFile emits multi-module headers with module init declarations", (t) => {
  const targetDir = createManagedTempDir(t, "multi-module-shape");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "main_js.hpp"), "utf8");
  assert.match(headerSource, /jayess::value jayess_module_init\(\);/);
});

test("transpileFile namespace import project writes generated files", (t) => {
  const targetDir = createManagedTempDir(t, "namespace-output");
  const fixture = path.resolve("test/fixtures/modules/namespace-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("namespace_main_js.cpp")));
});

test("transpileFile encodes package and scoped-package modules into stable filenames", (t) => {
  const targetDir = createManagedTempDir(t, "package-layout-output");
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("main_js.cpp")));
  assert.ok(result.files.some((file) => file.endsWith("_node_modules_jayess_lib_index_js.cpp")));
  assert.ok(result.files.some((file) => file.endsWith("_node_modules__scope_math_src_index_js.cpp")));
});

test("transpileFile emits re-export aliases in generated headers", (t) => {
  const targetDir = createManagedTempDir(t, "reexport-output");
  const fixture = path.resolve("test/fixtures/modules/reexport-chain-consumer.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "reexport_chain_js.hpp"), "utf8");
  assert.match(headerSource, /inline auto& total = jayess_module_reexport_named_js::sum;/);
});

test("transpileFile emits export-all aliases in generated headers", (t) => {
  const targetDir = createManagedTempDir(t, "export-all-output");
  const fixture = path.resolve("test/fixtures/modules/export-all-main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "export_all_js.hpp"), "utf8");
  assert.match(headerSource, /inline auto& add = jayess_module_math_js::add;/);
});

test("transpileFile accepts modules that use trailing commas", (t) => {
  const targetDir = createManagedTempDir(t, "trailing-commas-output");
  const fixture = path.resolve("test/fixtures/modules/trailing-commas-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("trailing_commas_main_js.cpp")));
});

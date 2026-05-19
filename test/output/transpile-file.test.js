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
  assert.match(headerSource, /value async_all\(const value& handles\);/);
  assert.match(headerSource, /value async_race\(const value& handles\);/);
  assert.match(headerSource, /value async_all_settled\(const value& handles\);/);
  assert.match(headerSource, /value async_any\(const value& handles\);/);
  assert.match(headerSource, /value thread_spawn\(const value& callback, const value& args\);/);
  assert.match(headerSource, /value thread_join\(const value& input\);/);
  assert.match(cppSource, /value make_pending_async\(\)/);
  assert.match(cppSource, /value async_all\(const value& handles\)/);
  assert.match(cppSource, /value async_race\(const value& handles\)/);
  assert.match(cppSource, /value async_all_settled\(const value& handles\)/);
  assert.match(cppSource, /value async_any\(const value& handles\)/);
  assert.match(cppSource, /value thread_spawn\(const value& callback, const value& args\)/);
  assert.match(cppSource, /value thread_join\(const value& input\)/);
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
  assert.match(headerSource, /value get_private_static_field\(const value& classValue, const std::string& key\);/);
  assert.match(headerSource, /value set_private_static_field\(const value& classValue, const std::string& key, const value& assigned\);/);
  assert.match(cppSource, /constexpr const char\* kJayessPrivateFieldPrefix = "__jayess_private_";/);
  assert.match(cppSource, /value get_private_field\(const value& instance, const value& classValue, const std::string& key\)/);
  assert.match(cppSource, /value set_private_field\(const value& instance, const value& classValue, const std::string& key, const value& assigned\)/);
  assert.match(cppSource, /value get_private_static_field\(const value& classValue, const std::string& key\)/);
  assert.match(cppSource, /value set_private_static_field\(const value& classValue, const std::string& key, const value& assigned\)/);
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
  assert.match(headerSource, /value date_to_iso_string\(const value& input\);/);
  assert.match(headerSource, /value date_get_utc_year\(const value& input\);/);
  assert.match(headerSource, /value date_add_millis\(const value& input, double amount\);/);
  assert.match(headerSource, /value date_parse_iso_text\(const std::string& text\);/);
  assert.match(cppSource, /constexpr const char\* kJayessDateTagKey = "__jayess_date_tag";/);
  assert.match(cppSource, /value make_date_now\(\)/);
  assert.match(cppSource, /value date_to_unix_millis\(const value& input\)/);
  assert.match(cppSource, /value date_to_iso_string\(const value& input\)/);
  assert.match(cppSource, /value date_get_utc_year\(const value& input\)/);
  assert.match(cppSource, /value date_add_millis\(const value& input, double amount\)/);
  assert.match(cppSource, /value date_parse_iso_text\(const std::string& text\)/);
});

test("transpileFile writes runtime json helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-json-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value json_parse_text\(const std::string& text\);/);
  assert.match(headerSource, /value json_stringify_value\(const value& input\);/);
  assert.match(headerSource, /value json_stringify_pretty_value\(const value& input, int indentWidth\);/);
  assert.match(headerSource, /value json_validate_text\(const std::string& text\);/);
  assert.match(headerSource, /bool is_json_text\(const std::string& text\);/);
  assert.match(cppSource, /struct json_error : std::runtime_error/);
  assert.match(cppSource, /struct json_reader/);
  assert.match(cppSource, /value json_parse_text\(const std::string& text\)/);
  assert.match(cppSource, /value json_stringify_value\(const value& input\)/);
  assert.match(cppSource, /value json_stringify_pretty_value\(const value& input, int indentWidth\)/);
  assert.match(cppSource, /value json_validate_text\(const std::string& text\)/);
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
  assert.match(headerSource, /value map_keys\(const value& map\);/);
  assert.match(headerSource, /value map_entries\(const value& map\);/);
  assert.match(cppSource, /value make_map\(\)/);
  assert.match(cppSource, /value map_get\(const value& map, const value& key\)/);
  assert.match(cppSource, /value map_size\(const value& map\)/);
  assert.match(cppSource, /value map_keys\(const value& map\)/);
  assert.match(cppSource, /value map_entries\(const value& map\)/);
});

test("transpileFile writes runtime object helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-object-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value object_keys\(const value& input\);/);
  assert.match(headerSource, /value object_values\(const value& input\);/);
  assert.match(headerSource, /value object_entries\(const value& input\);/);
  assert.match(headerSource, /value object_has\(const value& input, const value& key\);/);
  assert.match(headerSource, /value object_from_entries\(const value& entries\);/);
  assert.match(headerSource, /value object_assign\(const value& target, const value& source\);/);
  assert.match(cppSource, /const std::unordered_map<std::string, value>& require_object_like_fields\(const value& input\)/);
  assert.match(cppSource, /std::vector<std::string> sorted_object_like_keys\(const value& input\)/);
  assert.match(cppSource, /std::string require_object_key_text\(const value& input\)/);
  assert.match(cppSource, /value object_keys\(const value& input\)/);
  assert.match(cppSource, /value object_values\(const value& input\)/);
  assert.match(cppSource, /value object_entries\(const value& input\)/);
  assert.match(cppSource, /value object_has\(const value& input, const value& key\)/);
  assert.match(cppSource, /value object_from_entries\(const value& entries\)/);
  assert.match(cppSource, /value object_assign\(const value& target, const value& source\)/);
});

test("transpileFile writes runtime number helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-number-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value number_parse_int\(const value& input\);/);
  assert.match(headerSource, /value number_parse_float\(const value& input\);/);
  assert.match(headerSource, /value number_is_integer\(const value& input\);/);
  assert.match(headerSource, /value number_is_finite\(const value& input\);/);
  assert.match(cppSource, /std::string trim_number_input\(const std::string& input\)/);
  assert.match(cppSource, /const std::string& require_number_parse_text\(const value& input\)/);
  assert.match(cppSource, /value number_parse_int\(const value& input\)/);
  assert.match(cppSource, /value number_parse_float\(const value& input\)/);
  assert.match(cppSource, /value number_is_integer\(const value& input\)/);
  assert.match(cppSource, /value number_is_finite\(const value& input\)/);
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
  assert.match(headerSource, /value set_values\(const value& input\);/);
  assert.match(headerSource, /value set_entries\(const value& input\);/);
  assert.match(cppSource, /value make_set\(\)/);
  assert.match(cppSource, /value set_has\(const value& input, const value& member\)/);
  assert.match(cppSource, /value set_size\(const value& input\)/);
  assert.match(cppSource, /value set_values\(const value& input\)/);
  assert.match(cppSource, /value set_entries\(const value& input\)/);
});

test("transpileFile writes runtime system-module helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-system-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value fs_exists_path\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_remove_path\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_list_directory\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_stat_path\(const std::string& pathText\);/);
  assert.match(headerSource, /value path_join_parts\(const std::vector<std::string>& parts\);/);
  assert.match(headerSource, /value path_resolve_parts\(const std::vector<std::string>& parts\);/);
  assert.match(headerSource, /value path_is_absolute\(const std::string& pathText\);/);
  assert.match(headerSource, /value process_current_working_directory\(\);/);
  assert.match(headerSource, /value process_get_argv\(\);/);
  assert.match(headerSource, /value process_has_env\(const std::string& key\);/);
  assert.match(headerSource, /value process_set_exit_code\(int code\);/);
  assert.match(cppSource, /std::filesystem::path fs_require_path\(const std::string& pathText\)/);
  assert.match(cppSource, /std::filesystem::path path_require_filesystem_path\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_read_text_file\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_list_directory\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_stat_path\(const std::string& pathText\)/);
  assert.match(cppSource, /value path_normalize\(const std::string& pathText\)/);
  assert.match(cppSource, /value path_resolve_parts\(const std::vector<std::string>& parts\)/);
  assert.match(cppSource, /value process_get_argv\(\)/);
  assert.match(cppSource, /value process_has_env\(const std::string& key\)/);
  assert.match(cppSource, /value process_set_exit_code\(int code\)/);
  assert.match(cppSource, /void process_exit_with_code\(int code\)/);
});

test("transpileFile copies expanded system-module native bridge headers into output", (t) => {
  const targetDir = createManagedTempDir(t, "native-system-output");
  const fixture = path.resolve("test/fixtures/modules/system-modules-main.js");
  transpileFile(fixture, targetDir);

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

test("transpileFile writes runtime regex helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-regex-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value regex_create\(const value& pattern\);/);
  assert.match(headerSource, /value regex_create\(const value& pattern, const value& flags\);/);
  assert.match(headerSource, /bool is_regex_value\(const value& input\);/);
  assert.match(headerSource, /value regex_test\(const value& regexValue, const value& text\);/);
  assert.match(headerSource, /value regex_exec\(const value& regexValue, const value& text\);/);
  assert.match(headerSource, /value regex_replace_first\(const value& regexValue, const value& text, const value& replacement\);/);
  assert.match(headerSource, /value regex_replace_all\(const value& regexValue, const value& text, const value& replacement\);/);
  assert.match(cppSource, /constexpr const char\* kJayessRegexTagKey = "__jayess_regex_tag";/);
  assert.match(cppSource, /constexpr const char\* kJayessRegexFlagsKey = "__jayess_regex_flags";/);
  assert.match(cppSource, /regex_flags parse_regex_flags\(const value& input\)/);
  assert.match(cppSource, /std::regex_constants::icase/);
  assert.match(cppSource, /std::regex_constants::multiline/);
  assert.match(cppSource, /std::string apply_dot_all_pattern_transform\(const std::string& pattern\)/);
  assert.match(cppSource, /std::regex require_compiled_regex\(const value& input\)/);
  assert.match(cppSource, /value regex_create\(const value& pattern\)/);
  assert.match(cppSource, /value regex_create\(const value& pattern, const value& flagsInput\)/);
  assert.match(cppSource, /value regex_test\(const value& regexValue, const value& text\)/);
  assert.match(cppSource, /value regex_exec\(const value& regexValue, const value& text\)/);
  assert.match(cppSource, /value regex_replace_first\(const value& regexValue, const value& text, const value& replacement\)/);
  assert.match(cppSource, /value regex_replace_all\(const value& regexValue, const value& text, const value& replacement\)/);
});

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
});

test("transpileFile resolves built-in Jayess string modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-string-output");
  const fixture = path.resolve("test/fixtures/modules/string-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("string_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_string_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "string-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "string-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessStringTrim/);
  assert.match(primitiveSource, /jayessStringSlice/);
  assert.match(primitiveSource, /jayessStringSplit/);
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
  assert.match(primitiveSource, /jayessArrayIndexOf/);
  assert.match(primitiveSource, /jayessArrayMap/);
  assert.match(primitiveSource, /jayessArrayFilter/);
  assert.match(primitiveSource, /jayessArrayReduce/);
});

test("transpileFile resolves built-in Jayess async modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-async-output");
  const fixture = path.resolve("test/fixtures/modules/async-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("async_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_async_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "async-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "async-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessAsyncAllSettled/);
  assert.match(primitiveSource, /jayessAsyncAny/);
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

test("transpileFile resolves built-in Jayess regex modules into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-regex-output");
  const fixture = path.resolve("test/fixtures/modules/regex-main.js");
  const result = transpileFile(fixture, targetDir);

  assert.ok(result.files.some((file) => file.endsWith("regex_main_js.cpp")));
  assert.ok(result.files.some((file) => file.includes("stdlib_jayess_regex_index_js.cpp")));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "regex-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "regex-primitives.hpp"), "utf8");
  assert.match(primitiveSource, /jayessRegexCreate/);
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

  const fsModulePath = result.files.find((file) => file.includes("stdlib_jayess_fs_index_js.cpp"));
  assert.ok(result.files.some((file) => file.endsWith("fs_main_js.cpp")));
  assert.ok(fsModulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "fs-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(fsModulePath, "utf8");
  assert.match(primitiveSource, /jayessFsReadText/);
  assert.match(primitiveSource, /jayessFsWriteText/);
  assert.match(primitiveSource, /Jayess fs writeText expects string content/);
  assert.match(moduleSource, /jayessFsExists/);
  assert.match(moduleSource, /jayessFsStat/);
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

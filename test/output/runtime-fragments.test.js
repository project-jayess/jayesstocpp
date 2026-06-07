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

test("transpileFile writes runtime async helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-async-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct async_state/);
  assert.match(headerSource, /value make_pending_async\(\);/);
  assert.match(headerSource, /value async_all\(const value& handles\);/);
  assert.match(headerSource, /value async_race\(const value& handles\);/);
  assert.match(headerSource, /value async_all_settled\(const value& handles\);/);
  assert.match(headerSource, /value async_any\(const value& handles\);/);
  assert.match(headerSource, /value async_sleep\(const value& milliseconds\);/);
  assert.match(headerSource, /value async_timeout\(const value& handle, const value& milliseconds\);/);
  assert.match(headerSource, /value thread_spawn\(const value& callback, const value& args\);/);
  assert.match(headerSource, /value thread_join\(const value& input\);/);
  assert.match(cppSource, /value make_pending_async\(\)/);
  assert.match(cppSource, /value async_all\(const value& handles\)/);
  assert.match(cppSource, /value async_race\(const value& handles\)/);
  assert.match(cppSource, /value async_all_settled\(const value& handles\)/);
  assert.match(cppSource, /value async_any\(const value& handles\)/);
  assert.match(cppSource, /value async_sleep\(const value& milliseconds\)/);
  assert.match(cppSource, /value async_timeout\(const value& handle, const value& milliseconds\)/);
  assert.match(cppSource, /value thread_spawn\(const value& callback, const value& args\)/);
  assert.match(cppSource, /value thread_join\(const value& input\)/);
  assert.match(cppSource, /void run_async_scheduler\(\)/);
  assert.match(cppSource, /struct async_timer_record/);
  assert.match(cppSource, /async_schedule_timer\(delay, \[result\]\(\) mutable \{/);
  assert.doesNotMatch(cppSource, /std::this_thread::sleep_for\(std::chrono::milliseconds\(delay\)\);/);
});

test("transpileFile writes runtime generator helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-generator-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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

test("transpileFile prunes unused async helper and generator runtime fragments", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-pruned-arithmetic-output");
  const fixture = path.resolve("test/fixtures/modules/arithmetic-main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value make_resolved_async\(value resolved\);/);
  assert.doesNotMatch(headerSource, /value async_all\(const value& handles\);/);
  assert.doesNotMatch(headerSource, /value async_sleep\(const value& milliseconds\);/);
  assert.doesNotMatch(headerSource, /value make_generator_handle\(\);/);
  assert.doesNotMatch(cppSource, /value async_all\(const value& handles\)/);
  assert.doesNotMatch(cppSource, /value generator_resume\(const value& input\)/);
});

test("transpileFile includes regex runtime fragments for jayess regex imports", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-pruned-regex-output");
  const fixture = path.resolve("test/fixtures/modules/regex-main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value regex_create\(const value& pattern\);/);
  assert.match(headerSource, /bool is_regex_value\(const value& input\);/);
  assert.match(cppSource, /value regex_create\(const value& pattern, const value& flagsInput\)/);
  assert.match(cppSource, /bool is_regex_value\(const value& input\)/);
});

test("transpileFile includes generator runtime fragments for generator syntax", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-pruned-generator-output");
  const fixture = path.resolve("test/fixtures/modules/generator-runtime-main.js");
  transpileFile(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value make_generator_handle\(\);/);
  assert.match(cppSource, /value make_generator_handle\(\)/);
  assert.match(cppSource, /value generator_resume\(const value& input\)/);
});

test("transpileFile writes runtime date helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-date-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

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
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value fs_exists_path\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_exists_path_async\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_read_bytes_file\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_read_bytes_file_async\(const std::string& pathText\);/);
  assert.match(headerSource, /value fs_write_bytes_file\(const std::string& pathText, const value& bytes\);/);
  assert.match(headerSource, /value fs_write_bytes_file_async\(const std::string& pathText, const value& bytes\);/);
  assert.match(headerSource, /value fs_append_text_file\(const std::string& pathText, const std::string& text\);/);
  assert.match(headerSource, /value fs_copy_path\(const std::string& fromPathText, const std::string& toPathText\);/);
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
  assert.match(cppSource, /value fs_read_text_file_async\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_read_bytes_file\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_read_bytes_file_async\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_write_bytes_file\(const std::string& pathText, const value& bytesValue\)/);
  assert.match(cppSource, /value fs_append_text_file\(const std::string& pathText, const std::string& text\)/);
  assert.match(cppSource, /value fs_copy_path\(const std::string& fromPathText, const std::string& toPathText\)/);
  assert.match(cppSource, /value fs_list_directory\(const std::string& pathText\)/);
  assert.match(cppSource, /value fs_stat_path\(const std::string& pathText\)/);
  assert.match(cppSource, /value path_normalize\(const std::string& pathText\)/);
  assert.match(cppSource, /value path_resolve_parts\(const std::vector<std::string>& parts\)/);
  assert.match(cppSource, /value process_get_argv\(\)/);
  assert.match(cppSource, /value process_has_env\(const std::string& key\)/);
  assert.match(cppSource, /value process_set_exit_code\(int code\)/);
  assert.match(cppSource, /void process_exit_with_code\(int code\)/);
});

test("transpileFile writes runtime console helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-console-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value console_log_value\(const value& input\);/);
  assert.match(headerSource, /value console_error_value\(const value& input\);/);
  assert.match(headerSource, /value console_write_text\(const std::string& text\);/);
  assert.match(headerSource, /value console_write_line_text\(const std::string& text\);/);
  assert.match(headerSource, /value console_read_line_text\(\);/);
  assert.match(headerSource, /value console_read_stdin_text\(\);/);
  assert.match(headerSource, /value console_prompt_text\(const std::string& text\);/);
  assert.match(cppSource, /#include <iostream>/);
  assert.match(cppSource, /value console_log_value\(const value& input\)/);
  assert.match(cppSource, /std::cout << stringify_value\(input\) << std::endl;/);
  assert.match(cppSource, /value console_error_value\(const value& input\)/);
  assert.match(cppSource, /std::cerr << stringify_value\(input\) << std::endl;/);
  assert.match(cppSource, /value console_write_text\(const std::string& text\)/);
  assert.match(cppSource, /value console_write_line_text\(const std::string& text\)/);
  assert.match(cppSource, /value console_read_line_text\(\)/);
  assert.match(cppSource, /std::getline\(std::cin, line\)/);
  assert.match(cppSource, /value console_read_stdin_text\(\)/);
  assert.match(cppSource, /value console_prompt_text\(const std::string& text\)/);
});

test("transpileFile writes runtime bytes helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-bytes-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /struct bytes_value;/);
  assert.match(headerSource, /using bytes_ptr = std::shared_ptr<bytes_value>;/);
  assert.match(headerSource, /value bytes_from_utf8\(const value& text\);/);
  assert.match(headerSource, /value bytes_to_utf8\(const value& input\);/);
  assert.match(headerSource, /value bytes_length\(const value& input\);/);
  assert.match(headerSource, /value bytes_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(headerSource, /value bytes_concat\(const value& left, const value& right\);/);
  assert.match(headerSource, /value bytes_equals\(const value& left, const value& right\);/);
  assert.match(headerSource, /value bytes_secure_equals\(const value& left, const value& right\);/);
  assert.match(headerSource, /bool is_bytes_value\(const value& input\);/);
  assert.match(cppSource, /bytes_ptr require_bytes_value\(const value& input, const std::string& message\)/);
  assert.match(cppSource, /value bytes_from_utf8\(const value& text\)/);
  assert.match(cppSource, /value bytes_to_utf8\(const value& input\)/);
  assert.match(cppSource, /value bytes_concat\(const value& left, const value& right\)/);
  assert.match(cppSource, /value bytes_equals\(const value& left, const value& right\)/);
  assert.match(cppSource, /value bytes_secure_equals\(const value& left, const value& right\)/);
});

test("transpileFile writes runtime encoding helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-encoding-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value encoding_base64_encode\(const value& input\);/);
  assert.match(headerSource, /value encoding_base64_decode\(const value& text\);/);
  assert.match(headerSource, /value encoding_hex_encode\(const value& input\);/);
  assert.match(headerSource, /value encoding_hex_decode\(const value& text\);/);
  assert.match(headerSource, /value encoding_uri_encode\(const value& text\);/);
  assert.match(headerSource, /value encoding_uri_decode\(const value& text\);/);
  assert.match(cppSource, /const char\* kBase64Alphabet/);
  assert.match(cppSource, /value encoding_base64_encode\(const value& input\)/);
  assert.match(cppSource, /value encoding_base64_decode\(const value& text\)/);
  assert.match(cppSource, /value encoding_hex_encode\(const value& input\)/);
  assert.match(cppSource, /value encoding_hex_decode\(const value& text\)/);
  assert.match(cppSource, /value encoding_uri_encode\(const value& text\)/);
  assert.match(cppSource, /value encoding_uri_decode\(const value& text\)/);
});

test("transpileFile writes runtime crypto helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-crypto-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value crypto_sha256\(const value& input\);/);
  assert.match(headerSource, /value crypto_sha512\(const value& input\);/);
  assert.match(headerSource, /value crypto_sha1\(const value& input\);/);
  assert.match(headerSource, /value crypto_random_bytes\(const value& count\);/);
  assert.match(cppSource, /std::vector<unsigned char> sha256_digest\(const std::vector<unsigned char>& input\)/);
  assert.match(cppSource, /std::vector<unsigned char> sha512_digest\(const std::vector<unsigned char>& input\)/);
  assert.match(cppSource, /std::vector<unsigned char> sha1_digest\(const std::vector<unsigned char>& input\)/);
  assert.match(cppSource, /fill_crypto_random_bytes/);
  assert.match(cppSource, /CRYPTO_RANDOM_UNAVAILABLE_MESSAGE/);
  assert.match(cppSource, /value crypto_sha256\(const value& input\)/);
  assert.match(cppSource, /value crypto_sha512\(const value& input\)/);
  assert.match(cppSource, /value crypto_sha1\(const value& input\)/);
  assert.match(cppSource, /value crypto_random_bytes\(const value& count\)/);
});

test("transpileFile writes runtime url helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-url-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(headerSource, /value url_parse_text\(const value& text\);/);
  assert.match(headerSource, /value url_format_parts\(const value& parts\);/);
  assert.match(headerSource, /value url_join_path\(const value& base, const value& path\);/);
  assert.match(headerSource, /value url_get_query\(const value& input, const value& key\);/);
  assert.match(headerSource, /value url_set_query\(const value& input, const value& key, const value& assigned\);/);
  assert.match(cppSource, /struct parsed_url_parts/);
  assert.match(cppSource, /parsed_url_parts parse_url_parts\(const std::string& input\)/);
  assert.match(cppSource, /value url_parse_text\(const value& text\)/);
  assert.match(cppSource, /value url_format_parts\(const value& partsValue\)/);
  assert.match(cppSource, /value url_join_path\(const value& base, const value& path\)/);
  assert.match(cppSource, /value url_set_query\(const value& input, const value& key, const value& assigned\)/);
});

test("transpileFile writes runtime regex helpers into the generated runtime", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-regex-output");
  const fixture = path.resolve("test/fixtures/modules/main.js");
  transpileFileWithFullRuntime(fixture, targetDir);

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
  assert.match(cppSource, /std::string apply_multiline_pattern_transform\(const std::string& pattern\)/);
  assert.match(cppSource, /std::string apply_dot_all_pattern_transform\(const std::string& pattern\)/);
  assert.match(cppSource, /std::regex require_compiled_regex\(const value& input\)/);
  assert.match(cppSource, /value regex_create\(const value& pattern\)/);
  assert.match(cppSource, /value regex_create\(const value& pattern, const value& flagsInput\)/);
  assert.match(cppSource, /value regex_test\(const value& regexValue, const value& text\)/);
  assert.match(cppSource, /value regex_exec\(const value& regexValue, const value& text\)/);
  assert.match(cppSource, /value regex_replace_first\(const value& regexValue, const value& text, const value& replacement\)/);
  assert.match(cppSource, /value regex_replace_all\(const value& regexValue, const value& text, const value& replacement\)/);
});

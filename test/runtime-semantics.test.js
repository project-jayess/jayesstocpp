import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

test("runtime truthiness semantics stay explicit", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /std::holds_alternative<std::monostate>\(input\)\)\s*\{\s*return false;/);
  assert.match(runtime, /std::holds_alternative<bool>\(input\)\)\s*\{\s*return std::get<bool>\(input\);/);
  assert.match(runtime, /std::holds_alternative<double>\(input\)\)\s*\{\s*return std::get<double>\(input\) != 0\.0;/);
  assert.match(runtime, /std::holds_alternative<array_ptr>\(input\)\)\s*\{\s*return !std::get<array_ptr>\(input\)->items\.empty\(\);/);
  assert.match(runtime, /std::holds_alternative<object_ptr>\(input\)\)\s*\{\s*return !std::get<object_ptr>\(input\)->fields\.empty\(\);/);
  assert.match(runtime, /std::holds_alternative<callable_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<map_ptr>\(input\)\)\s*\{\s*return !std::get<map_ptr>\(input\)->entries\.empty\(\);/);
  assert.match(runtime, /std::holds_alternative<set_ptr>\(input\)\)\s*\{\s*return !std::get<set_ptr>\(input\)->entries\.empty\(\);/);
  assert.match(runtime, /return !std::get<std::string>\(input\)\.empty\(\);/);
});

test("runtime null checks stay explicit", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /bool is_null\(const value& input\) \{\s*return std::holds_alternative<std::monostate>\(input\);/);
});

test("runtime equality semantics stay exact-type and identity-based for composites", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(left\.index\(\) != right\.index\(\)\) \{\s*return false;/);
  assert.match(runtime, /if \(std::holds_alternative<std::monostate>\(left\)\) \{\s*return true;/);
  assert.match(runtime, /if \(std::holds_alternative<double>\(left\)\) \{\s*return std::get<double>\(left\) == std::get<double>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<bool>\(left\)\) \{\s*return std::get<bool>\(left\) == std::get<bool>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<array_ptr>\(left\)\) \{\s*return std::get<array_ptr>\(left\) == std::get<array_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<object_ptr>\(left\)\) \{\s*return std::get<object_ptr>\(left\) == std::get<object_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<callable_ptr>\(left\)\) \{\s*return std::get<callable_ptr>\(left\) == std::get<callable_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<map_ptr>\(left\)\) \{\s*return std::get<map_ptr>\(left\) == std::get<map_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<set_ptr>\(left\)\) \{\s*return std::get<set_ptr>\(left\) == std::get<set_ptr>\(right\);/);
  assert.match(runtime, /return std::get<std::string>\(left\) == std::get<std::string>\(right\);/);
});

test("runtime numeric operator helpers stay narrowly numeric", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /value positive\(const value& input\) \{\s*return std::get<double>\(input\);/);
  assert.match(runtime, /value subtract\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) - std::get<double>\(right\);/);
  assert.match(runtime, /value multiply\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) \* std::get<double>\(right\);/);
  assert.match(runtime, /value divide\(const value& left, const value& right\) \{\s*return std::get<double>\(left\) \/ std::get<double>\(right\);/);
  assert.match(runtime, /value modulo\(const value& left, const value& right\) \{\s*return std::fmod\(std::get<double>\(left\), std::get<double>\(right\)\);/);
  assert.match(runtime, /value power\(const value& left, const value& right\) \{\s*return std::pow\(std::get<double>\(left\), std::get<double>\(right\)\);/);
});

test("runtime add helper rejects coercive mixed-type addition", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(std::holds_alternative<double>\(left\) && std::holds_alternative<double>\(right\)\) \{\s*return std::get<double>\(left\) \+ std::get<double>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<std::string>\(left\) && std::holds_alternative<std::string>\(right\)\) \{\s*return std::get<std::string>\(left\) \+ std::get<std::string>\(right\);/);
  assert.match(runtime, /throw std::runtime_error\("Unsupported add operands"\);/);
});

test("runtime thrown-value carrier stays explicit", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct thrown_value : std::exception/);
  assert.match(runtime, /void throw_value\(value input\) \{\s*throw thrown_value\(std::move\(input\)\);/);
  assert.match(runtime, /value exception_to_value\(const thrown_value& error\) \{\s*return error\.payload;/);
});

test("runtime array and string method helpers stay narrow", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value array_pop\(const value& input\);/);
  assert.match(header, /value array_join\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_substring\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_starts_with\(const value& input, const std::vector<value>& args\);/);
  assert.match(runtime, /value array_pop\(const value& input\)/);
  assert.match(runtime, /if \(array->items\.empty\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value array_join\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /std::string separator = ",";/);
  assert.match(runtime, /value string_slice\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /value string_substring\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /if \(end < start\) \{\s*std::swap\(start, end\);/);
  assert.match(runtime, /value string_starts_with\(const value& input, const std::vector<value>& args\)/);
});

test("runtime async helpers stay explicit and Jayess-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /enum class async_status/);
  assert.match(header, /struct async_state/);
  assert.match(header, /using async_ptr = std::shared_ptr<async_state>;/);
  assert.match(header, /value make_pending_async\(\);/);
  assert.match(header, /value make_resolved_async\(value resolved\);/);
  assert.match(header, /value make_rejected_async\(value rejected\);/);
  assert.match(header, /void async_enqueue\(const value& input, std::function<void\(\)> continuation\);/);
  assert.match(header, /void run_async_scheduler\(\);/);
  assert.match(runtime, /std::deque<std::function<void\(\)>> queue;/);
  assert.match(runtime, /value make_pending_async\(\) \{\s*return std::make_shared<async_state>\(\);/);
  assert.match(runtime, /state->status = async_status::resolved;/);
  assert.match(runtime, /state->status = async_status::rejected;/);
  assert.match(runtime, /bool is_async\(const value& input\) \{\s*return std::holds_alternative<async_ptr>\(input\);/);
  assert.match(runtime, /value await_sync\(const value& input\) \{/);
  assert.match(runtime, /if \(!is_async\(input\)\) \{\s*return input;/);
  assert.match(runtime, /if \(async_is_pending\(input\)\) \{\s*run_async_scheduler\(\);/);
  assert.match(runtime, /if \(async_is_rejected\(input\)\) \{\s*throw_value\(async_result_value\(input\)\);/);
  assert.match(runtime, /void async_resolve\(const value& input, value resolved\)/);
  assert.match(runtime, /void async_reject\(const value& input, value rejected\)/);
  assert.match(runtime, /if \(state->status == async_status::pending\) \{\s*state->continuations.push_back/);
  assert.match(runtime, /while \(!queue\.empty\(\)\) \{/);
});

test("runtime generator helpers stay explicit and Jayess-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /enum class generator_status/);
  assert.match(header, /struct generator_state/);
  assert.match(header, /using generator_ptr = std::shared_ptr<generator_state>;/);
  assert.match(header, /value make_generator_handle\(\);/);
  assert.match(header, /bool is_generator\(const value& input\);/);
  assert.match(header, /std::size_t generator_next_state\(const value& input\);/);
  assert.match(header, /value generator_current_value\(const value& input\);/);
  assert.match(header, /void generator_set_resume\(const value& input, std::function<void\(\)> resume\);/);
  assert.match(header, /void generator_yield\(const value& input, std::size_t nextState, value yielded\);/);
  assert.match(header, /void generator_complete\(const value& input, value completed\);/);
  assert.match(header, /void generator_fail\(const value& input, value failure\);/);
  assert.match(header, /value generator_resume\(const value& input\);/);
  assert.match(runtime, /value make_generator_handle\(\) \{\s*return std::make_shared<generator_state>\(\);/);
  assert.match(runtime, /bool is_generator\(const value& input\) \{\s*return std::holds_alternative<generator_ptr>\(input\);/);
  assert.match(runtime, /state->status == generator_status::suspended_start \|\| state->status == generator_status::suspended_yield/);
  assert.match(runtime, /std::size_t generator_next_state\(const value& input\) \{\s*return require_generator_state\(input\)->next_state;/);
  assert.match(runtime, /value generator_current_value\(const value& input\) \{\s*return require_generator_state\(input\)->current;/);
  assert.match(runtime, /state->status = generator_status::suspended_yield;/);
  assert.match(runtime, /state->next_state = nextState;/);
  assert.match(runtime, /state->status = generator_status::completed;/);
  assert.match(runtime, /state->status = generator_status::failed;/);
  assert.match(runtime, /if \(!state->resume\) \{\s*throw std::runtime_error\("Generator has no resume function"\);/);
  assert.match(runtime, /state->resume\(\);/);
  assert.match(runtime, /if \(state->status == generator_status::failed\) \{\s*throw_value\(state->current\);/);
  assert.match(runtime, /return state->current;/);
});

test("runtime class-chain helpers stay explicit and Jayess-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value set_base_class\(const value& classValue, const value& baseClass\);/);
  assert.match(header, /value get_base_class\(const value& classValue\);/);
  assert.match(header, /value set_instance_class\(const value& instance, const value& classValue\);/);
  assert.match(header, /value get_instance_class\(const value& instance\);/);
  assert.match(header, /value find_class_method\(const value& classValue, const std::string& key\);/);
  assert.match(runtime, /constexpr const char\* kJayessBaseClassKey = "__jayess_base_class";/);
  assert.match(runtime, /constexpr const char\* kJayessInstanceClassKey = "__jayess_class";/);
  assert.match(runtime, /callable_ptr require_class_value\(const value& input\)/);
  assert.match(runtime, /object_ptr require_instance_object\(const value& input\)/);
  assert.match(runtime, /value set_base_class\(const value& classValue, const value& baseClass\) \{/);
  assert.match(runtime, /callable->fields\.insert_or_assign\(kJayessBaseClassKey, baseClass\);/);
  assert.match(runtime, /value get_base_class\(const value& classValue\) \{/);
  assert.match(runtime, /return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value set_instance_class\(const value& instance, const value& classValue\) \{/);
  assert.match(runtime, /object->fields\.insert_or_assign\(kJayessInstanceClassKey, classValue\);/);
  assert.match(runtime, /value find_class_method\(const value& classValue, const std::string& key\) \{/);
  assert.match(runtime, /while \(!std::holds_alternative<std::monostate>\(current\)\) \{/);
  assert.match(runtime, /current = get_base_class\(current\);/);
  assert.match(runtime, /throw std::runtime_error\("Missing class method"\);/);
});

test("runtime private-field helpers stay non-public and class-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /std::unordered_map<std::string, value> private_fields;/);
  assert.match(header, /value get_private_field\(const value& instance, const value& classValue, const std::string& key\);/);
  assert.match(header, /value set_private_field\(const value& instance, const value& classValue, const std::string& key, const value& assigned\);/);
  assert.match(runtime, /constexpr const char\* kJayessPrivateFieldPrefix = "__jayess_private_";/);
  assert.match(runtime, /std::string private_field_storage_key\(const value& classValue, const std::string& key\)/);
  assert.match(runtime, /stream << kJayessPrivateFieldPrefix << require_private_class_value\(classValue\)\.get\(\) << "_" << key;/);
  assert.match(runtime, /const auto iterator = object->private_fields\.find\(storageKey\);/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(storageKey, assigned\);/);
  assert.doesNotMatch(runtime, /get_property\(const value& input, const std::string& key\) \{[\s\S]*private_fields/);
});

test("runtime date helpers stay explicit and use hidden timestamp storage", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value make_date_now\(\);/);
  assert.match(header, /value make_date_from_unix_millis\(double millis\);/);
  assert.match(header, /bool is_date_value\(const value& input\);/);
  assert.match(header, /value date_to_unix_millis\(const value& input\);/);
  assert.match(runtime, /constexpr const char\* kJayessDateTagKey = "__jayess_date_tag";/);
  assert.match(runtime, /constexpr const char\* kJayessDateMillisKey = "__jayess_date_millis";/);
  assert.match(runtime, /value make_date_now\(\) \{/);
  assert.match(runtime, /std::chrono::system_clock::now\(\);/);
  assert.match(runtime, /value make_date_from_unix_millis\(double millis\) \{/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(kJayessDateTagKey, true\);/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(kJayessDateMillisKey, millis\);/);
  assert.match(runtime, /bool is_date_value\(const value& input\) \{/);
  assert.match(runtime, /return false;/);
  assert.match(runtime, /value date_to_unix_millis\(const value& input\) \{/);
  assert.match(runtime, /throw std::runtime_error\("Jayess date is missing timestamp storage"\);/);
});

test("runtime json helpers stay explicit and use a narrow native helper path", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value json_parse_text\(const std::string& text\);/);
  assert.match(header, /value json_stringify_value\(const value& input\);/);
  assert.match(header, /bool is_json_text\(const std::string& text\);/);
  assert.match(runtime, /struct json_reader/);
  assert.match(runtime, /value json_parse_text\(const std::string& text\) \{/);
  assert.match(runtime, /return make_array\(std::move\(items\)\);/);
  assert.match(runtime, /return make_object\(std::move\(fields\)\);/);
  assert.match(runtime, /std::sort\(keys\.begin\(\), keys\.end\(\)\);/);
  assert.match(runtime, /throw std::runtime_error\("Unsupported Jayess value for JSON stringify"\);/);
  assert.match(runtime, /bool is_json_text\(const std::string& text\) \{/);
  assert.match(runtime, /static_cast<void>\(json_parse_text\(text\)\);/);
});

test("runtime map helpers stay explicit and use a dedicated map carrier", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct map_entry \{/);
  assert.match(header, /struct map_value \{/);
  assert.match(header, /using map_ptr = std::shared_ptr<map_value>;/);
  assert.match(header, /value make_map\(\);/);
  assert.match(header, /bool is_map_value\(const value& input\);/);
  assert.match(header, /value map_get\(const value& map, const value& key\);/);
  assert.match(header, /value map_set\(const value& map, const value& key, const value& assigned\);/);
  assert.match(header, /value map_has\(const value& map, const value& key\);/);
  assert.match(header, /value map_delete\(const value& map, const value& key\);/);
  assert.match(header, /value map_clear\(const value& map\);/);
  assert.match(header, /value map_size\(const value& map\);/);
  assert.match(runtime, /map_ptr require_map_value\(const value& input\)/);
  assert.match(runtime, /std::vector<map_entry>::iterator find_map_entry\(map_ptr& map, const value& key\)/);
  assert.match(runtime, /std::get<bool>\(equal\(entry\.key, key\)\)/);
  assert.match(runtime, /value make_map\(\) \{\s*return std::make_shared<map_value>\(\);/);
  assert.match(runtime, /bool is_map_value\(const value& input\) \{\s*return std::holds_alternative<map_ptr>\(input\);/);
  assert.match(runtime, /if \(iterator == storage->entries\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /storage->entries\.push_back\(\{key, assigned\}\);/);
  assert.match(runtime, /storage->entries\.erase\(iterator\);/);
  assert.match(runtime, /storage->entries\.clear\(\);/);
  assert.match(runtime, /return static_cast<double>\(storage->entries\.size\(\)\);/);
});

test("runtime set helpers stay explicit and use a dedicated set carrier", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct set_value \{/);
  assert.match(header, /using set_ptr = std::shared_ptr<set_value>;/);
  assert.match(header, /value make_set\(\);/);
  assert.match(header, /bool is_set_value\(const value& input\);/);
  assert.match(header, /value set_add\(const value& input, const value& member\);/);
  assert.match(header, /value set_has\(const value& input, const value& member\);/);
  assert.match(header, /value set_delete\(const value& input, const value& member\);/);
  assert.match(header, /value set_clear\(const value& input\);/);
  assert.match(header, /value set_size\(const value& input\);/);
  assert.match(runtime, /set_ptr require_set_value\(const value& input\)/);
  assert.match(runtime, /std::vector<value>::iterator find_set_entry\(set_ptr& set, const value& member\)/);
  assert.match(runtime, /std::get<bool>\(equal\(entry, member\)\)/);
  assert.match(runtime, /value make_set\(\) \{\s*return std::make_shared<set_value>\(\);/);
  assert.match(runtime, /bool is_set_value\(const value& input\) \{\s*return std::holds_alternative<set_ptr>\(input\);/);
  assert.match(runtime, /if \(find_set_entry\(set, member\) == set->entries\.end\(\)\) \{\s*set->entries\.push_back\(member\);/);
  assert.match(runtime, /return find_set_entry\(set, member\) != set->entries\.end\(\);/);
  assert.match(runtime, /set->entries\.erase\(iterator\);/);
  assert.match(runtime, /set->entries\.clear\(\);/);
  assert.match(runtime, /return static_cast<double>\(set->entries\.size\(\)\);/);
});

test("runtime system-module helpers stay explicit and use a narrow native adapter layer", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value fs_exists_path\(const std::string& pathText\);/);
  assert.match(header, /value fs_read_text_file\(const std::string& pathText\);/);
  assert.match(header, /value fs_write_text_file\(const std::string& pathText, const std::string& text\);/);
  assert.match(header, /value fs_create_directories\(const std::string& pathText\);/);
  assert.match(header, /value path_join_parts\(const std::vector<std::string>& parts\);/);
  assert.match(header, /value path_dirname\(const std::string& pathText\);/);
  assert.match(header, /value path_basename\(const std::string& pathText\);/);
  assert.match(header, /value path_extname\(const std::string& pathText\);/);
  assert.match(header, /value path_normalize\(const std::string& pathText\);/);
  assert.match(header, /value process_current_working_directory\(\);/);
  assert.match(header, /value process_get_env\(const std::string& key\);/);
  assert.match(header, /\[\[noreturn\]\] void process_exit_with_code\(int code\);/);
  assert.match(runtime, /std::filesystem::path require_filesystem_path\(const std::string& pathText\)/);
  assert.match(runtime, /return std::filesystem::exists\(require_filesystem_path\(pathText\)\);/);
  assert.match(runtime, /std::ifstream stream\(require_filesystem_path\(pathText\), std::ios::binary\);/);
  assert.match(runtime, /std::ofstream stream\(require_filesystem_path\(pathText\), std::ios::binary\);/);
  assert.match(runtime, /return std::filesystem::create_directories\(require_filesystem_path\(pathText\)\);/);
  assert.match(runtime, /joined \/\= std::filesystem::path\(part\);/);
  assert.match(runtime, /return path_string_value\(joined\.lexically_normal\(\)\);/);
  assert.match(runtime, /return path_string_value\(require_filesystem_path\(pathText\)\.parent_path\(\)\);/);
  assert.match(runtime, /return path_string_value\(require_filesystem_path\(pathText\)\.filename\(\)\);/);
  assert.match(runtime, /return path_string_value\(require_filesystem_path\(pathText\)\.extension\(\)\);/);
  assert.match(runtime, /return path_string_value\(require_filesystem_path\(pathText\)\.lexically_normal\(\)\);/);
  assert.match(runtime, /return path_string_value\(std::filesystem::current_path\(\)\);/);
  assert.match(runtime, /const auto\* envValue = std::getenv\(key\.c_str\(\)\);/);
  assert.match(runtime, /return value\(std::monostate\{\}\);/);
  assert.match(runtime, /std::exit\(code\);/);
});

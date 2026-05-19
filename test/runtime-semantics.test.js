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
  assert.match(runtime, /std::holds_alternative<async_ptr>\(input\)\)\s*\{\s*return true;/);
  assert.match(runtime, /std::holds_alternative<generator_ptr>\(input\)\)\s*\{\s*return true;/);
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
  assert.match(runtime, /if \(std::holds_alternative<async_ptr>\(left\)\) \{\s*return std::get<async_ptr>\(left\) == std::get<async_ptr>\(right\);/);
  assert.match(runtime, /if \(std::holds_alternative<generator_ptr>\(left\)\) \{\s*return std::get<generator_ptr>\(left\) == std::get<generator_ptr>\(right\);/);
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

test("runtime math module helpers stay explicit and numeric", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value math_abs\(const value& input\);/);
  assert.match(header, /value math_min\(const std::vector<value>& inputs\);/);
  assert.match(header, /value math_pow\(const value& base, const value& exponent\);/);
  assert.match(runtime, /double require_math_number\(const value& input, const std::string& helperName\)/);
  assert.match(runtime, /Jayess math helper '/);
  assert.match(runtime, /value math_abs\(const value& input\)/);
  assert.match(runtime, /value math_round\(const value& input\)/);
  assert.match(runtime, /value math_min\(const std::vector<value>& inputs\)/);
  assert.match(runtime, /value math_max\(const std::vector<value>& inputs\)/);
  assert.match(runtime, /if \(number < 0\.0\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value math_pow\(const value& base, const value& exponent\)/);
});

test("runtime iterator module helpers consume Jayess generator handles", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value iter_next\(const value& generator, const value& sent = value\(std::monostate\{\}\)\);/);
  assert.match(header, /value iter_to_array\(const value& generator\);/);
  assert.match(header, /value iter_take\(const value& generator, const value& count\);/);
  assert.match(header, /value iter_map\(const value& generator, const value& callback\);/);
  assert.match(header, /value iter_filter\(const value& generator, const value& callback\);/);
  assert.match(runtime, /const generator_ptr& require_iter_generator\(const value& input\)/);
  assert.match(runtime, /const callable_ptr& require_iter_callback\(const value& input\)/);
  assert.match(runtime, /std::size_t require_iter_count\(const value& input\)/);
  assert.match(runtime, /value iter_next\(const value& generator, const value& sent\)/);
  assert.match(runtime, /const auto current = generator_resume_with\(generator, sent\);/);
  assert.match(runtime, /value iter_to_array\(const value& generator\)/);
  assert.match(runtime, /value iter_map\(const value& generator, const value& callback\)/);
  assert.match(runtime, /value iter_filter\(const value& generator, const value& callback\)/);
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
  assert.match(runtime, /value exception_to_value\(const std::exception& error\) \{\s*return std::string\(error\.what\(\)\);/);
});

test("runtime nullish and missing-value helpers stay null-only", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /bool is_null\(const value& input\) \{\s*return std::holds_alternative<std::monostate>\(input\);/);
  assert.doesNotMatch(runtime, /undefined/);
  assert.match(runtime, /if \(index >= args\.size\(\)\) \{\s*return 0\.0;/);
});

test("runtime optional-style missing lookups short-circuit through Jayess null", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /if \(iterator == object->fields\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(iterator == callable->fields\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(index >= array->items\.size\(\)\) \{\s*return value\(std::monostate\{\}\);/);
});

test("runtime array and string method helpers stay narrow", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value array_pop\(const value& input\);/);
  assert.match(header, /value array_join\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value array_includes\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_substring\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_starts_with\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_includes\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_index_of\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_ends_with\(const value& input, const std::vector<value>& args\);/);
  assert.match(runtime, /value array_pop\(const value& input\)/);
  assert.match(runtime, /if \(array->items\.empty\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value array_join\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /std::string separator = ",";/);
  assert.match(runtime, /value array_includes\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /if \(std::get<bool>\(equal\(item, args\[0\]\)\)\) \{/);
  assert.match(runtime, /value string_slice\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /value string_substring\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /if \(end < start\) \{\s*std::swap\(start, end\);/);
  assert.match(runtime, /value string_starts_with\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /value string_includes\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /text\.find\(stringify_value\(args\[0\]\)\) != std::string::npos/);
  assert.match(runtime, /value string_index_of\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /if \(found == std::string::npos\) \{\s*return static_cast<double>\(-1\);/);
  assert.match(runtime, /value string_ends_with\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /text\.compare\(text\.size\(\) - suffix\.size\(\), suffix\.size\(\), suffix\) == 0/);
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
  assert.match(header, /value async_all\(const value& handles\);/);
  assert.match(header, /value async_race\(const value& handles\);/);
  assert.match(header, /value async_all_settled\(const value& handles\);/);
  assert.match(header, /value async_any\(const value& handles\);/);
  assert.match(header, /void async_enqueue\(const value& input, std::function<void\(\)> continuation\);/);
  assert.match(header, /void run_async_scheduler\(\);/);
  assert.match(runtime, /std::deque<std::function<void\(\)>> queue;/);
  assert.match(runtime, /value make_pending_async\(\) \{\s*return std::make_shared<async_state>\(\);/);
  assert.match(runtime, /state->status = async_status::resolved;/);
  assert.match(runtime, /state->status = async_status::rejected;/);
  assert.match(runtime, /bool is_async\(const value& input\) \{\s*return std::holds_alternative<async_ptr>\(input\);/);
  assert.match(runtime, /const array_ptr& require_async_handle_array\(const value& input\)/);
  assert.match(runtime, /void require_async_handle_items\(const array_ptr& array\)/);
  assert.match(runtime, /value async_all\(const value& handles\) \{/);
  assert.match(runtime, /if \(array->items\.empty\(\)\) \{\s*async_resolve\(result, make_array\(\{\}\)\);/);
  assert.match(runtime, /if \(!is_async\(handle\)\) \{\s*throw std::runtime_error\("Jayess async composition requires async handles"\);/);
  assert.match(runtime, /if \(async_is_rejected\(handle\)\) \{\s*\*settled = true;\s*async_reject\(result, async_result_value\(handle\)\);/);
  assert.match(runtime, /value async_race\(const value& handles\) \{/);
  assert.match(runtime, /async_reject\(result, value\(std::string\("Jayess async race requires at least one handle"\)\)\);/);
  assert.match(runtime, /value async_all_settled\(const value& handles\) \{/);
  assert.match(runtime, /\{"status", value\(std::string\("resolved"\)\)\}/);
  assert.match(runtime, /\{"reason", async_result_value\(handle\)\}/);
  assert.match(runtime, /value async_any\(const value& handles\) \{/);
  assert.match(runtime, /Jayess async any requires at least one handle/);
  assert.match(runtime, /async_reject\(result, make_array\(std::move\(\*rejections\)\)\);/);
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
  assert.match(header, /value generator_take_sent\(const value& input\);/);
  assert.match(header, /value generator_resume\(const value& input\);/);
  assert.match(header, /value generator_resume_with\(const value& input, value sent\);/);
  assert.match(runtime, /value make_generator_handle\(\) \{\s*return std::make_shared<generator_state>\(\);/);
  assert.match(runtime, /bool is_generator\(const value& input\) \{\s*return std::holds_alternative<generator_ptr>\(input\);/);
  assert.match(header, /value sent = std::monostate\{\};/);
  assert.match(runtime, /state->status == generator_status::suspended_start \|\| state->status == generator_status::suspended_yield/);
  assert.match(runtime, /std::size_t generator_next_state\(const value& input\) \{\s*return require_generator_state\(input\)->next_state;/);
  assert.match(runtime, /value generator_current_value\(const value& input\) \{\s*return require_generator_state\(input\)->current;/);
  assert.match(runtime, /state->status = generator_status::suspended_yield;/);
  assert.match(runtime, /state->next_state = nextState;/);
  assert.match(runtime, /state->status = generator_status::completed;/);
  assert.match(runtime, /state->status = generator_status::failed;/);
  assert.match(runtime, /value generator_take_sent\(const value& input\) \{/);
  assert.match(runtime, /state->sent = std::move\(sent\);/);
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
  assert.match(header, /value find_static_class_member\(const value& classValue, const std::string& key\);/);
  assert.match(runtime, /value find_static_class_member\(const value& classValue, const std::string& key\) \{/);
  assert.match(runtime, /return find_static_class_member\(input, key\);/);
});

test("runtime missing lookups now resolve through Jayess null", () => {
  const runtime = getRuntimeCppSource();

  assert.match(runtime, /return find_static_class_member\(input, key\);/);
  assert.match(runtime, /return value\(std::monostate\{\}\);\s*\}\s*value get_index/);
  assert.match(runtime, /if \(index >= array->items\.size\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /if \(std::holds_alternative<object_ptr>\(input\) \|\| std::holds_alternative<callable_ptr>\(input\)\) \{\s*return get_property/);
});

test("runtime private-field helpers stay non-public and class-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /std::unordered_map<std::string, value> private_fields;/);
  assert.match(header, /value get_private_field\(const value& instance, const value& classValue, const std::string& key\);/);
  assert.match(header, /value set_private_field\(const value& instance, const value& classValue, const std::string& key, const value& assigned\);/);
  assert.match(header, /value get_private_static_field\(const value& classValue, const std::string& key\);/);
  assert.match(header, /value set_private_static_field\(const value& classValue, const std::string& key, const value& assigned\);/);
  assert.match(runtime, /constexpr const char\* kJayessPrivateFieldPrefix = "__jayess_private_";/);
  assert.match(runtime, /constexpr const char\* kJayessPrivateStaticFieldPrefix = "__jayess_private_static_";/);
  assert.match(runtime, /std::string private_field_storage_key\(const value& classValue, const std::string& key\)/);
  assert.match(runtime, /stream << kJayessPrivateFieldPrefix << require_private_class_value\(classValue\)\.get\(\) << "_" << key;/);
  assert.match(runtime, /value get_private_static_field\(const value& classValue, const std::string& key\)/);
  assert.match(runtime, /callable->fields\.insert_or_assign\(storageKey, assigned\);/);
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
  assert.match(header, /value date_to_iso_string\(const value& input\);/);
  assert.match(header, /value date_get_utc_year\(const value& input\);/);
  assert.match(header, /value date_get_utc_millisecond\(const value& input\);/);
  assert.match(header, /value date_add_millis\(const value& input, double amount\);/);
  assert.match(header, /value date_diff_millis\(const value& left, const value& right\);/);
  assert.match(header, /value date_parse_iso_text\(const std::string& text\);/);
  assert.match(runtime, /constexpr const char\* kJayessDateTagKey = "__jayess_date_tag";/);
  assert.match(runtime, /constexpr const char\* kJayessDateMillisKey = "__jayess_date_millis";/);
  assert.match(runtime, /std::tm utc_tm_from_unix_millis\(long long millis\)/);
  assert.match(runtime, /long long days_from_civil\(int year, unsigned month, unsigned day\)/);
  assert.match(runtime, /value make_date_now\(\) \{/);
  assert.match(runtime, /std::chrono::system_clock::now\(\);/);
  assert.match(runtime, /value make_date_from_unix_millis\(double millis\) \{/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(kJayessDateTagKey, true\);/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(kJayessDateMillisKey, millis\);/);
  assert.match(runtime, /bool is_date_value\(const value& input\) \{/);
  assert.match(runtime, /return false;/);
  assert.match(runtime, /value date_to_unix_millis\(const value& input\) \{/);
  assert.match(runtime, /throw std::runtime_error\("Jayess date is missing timestamp storage"\);/);
  assert.match(runtime, /value date_to_iso_string\(const value& input\) \{/);
  assert.match(runtime, /std::put_time\(&utcTm, "%Y-%m-%dT%H:%M:%S"\);/);
  assert.match(runtime, /value date_get_utc_year\(const value& input\) \{/);
  assert.match(runtime, /value date_get_utc_millisecond\(const value& input\) \{/);
  assert.match(runtime, /value date_add_millis\(const value& input, double amount\) \{/);
  assert.match(runtime, /value date_diff_millis\(const value& left, const value& right\) \{/);
  assert.match(runtime, /value date_parse_iso_text\(const std::string& text\) \{/);
  assert.match(runtime, /text\.size\(\) != 24/);
  assert.match(runtime, /return value\(std::monostate\{\}\);/);
});

test("runtime json helpers stay explicit and use a narrow native helper path", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value json_parse_text\(const std::string& text\);/);
  assert.match(header, /value json_stringify_value\(const value& input\);/);
  assert.match(header, /value json_stringify_pretty_value\(const value& input, int indentWidth\);/);
  assert.match(header, /value json_validate_text\(const std::string& text\);/);
  assert.match(header, /bool is_json_text\(const std::string& text\);/);
  assert.match(runtime, /struct json_error : std::runtime_error/);
  assert.match(runtime, /struct json_reader/);
  assert.match(runtime, /\[\[noreturn\]\] void fail\(const std::string& message\) const/);
  assert.match(runtime, /value json_parse_text\(const std::string& text\) \{/);
  assert.match(runtime, /return make_array\(std::move\(items\)\);/);
  assert.match(runtime, /return make_object\(std::move\(fields\)\);/);
  assert.match(runtime, /std::sort\(keys\.begin\(\), keys\.end\(\)\);/);
  assert.match(runtime, /std::string json_indent_prefix\(int level, int indentWidth\)/);
  assert.match(runtime, /value json_stringify_pretty_value\(const value& input, int indentWidth\) \{/);
  assert.match(runtime, /throw std::runtime_error\("Jayess JSON pretty indent must be non-negative"\);/);
  assert.match(runtime, /value json_validate_text\(const std::string& text\) \{/);
  assert.match(runtime, /\{"message", std::string\(error\.what\(\)\)\}/);
  assert.match(runtime, /\{"line", static_cast<double>\(error\.line\)\}/);
  assert.match(runtime, /\{"column", static_cast<double>\(error\.column\)\}/);
  assert.match(runtime, /throw std::runtime_error\("Unsupported Jayess value for JSON stringify"\);/);
  assert.match(runtime, /bool is_json_text\(const std::string& text\) \{/);
  assert.match(runtime, /static_cast<void>\(json_parse_text\(text\)\);/);
});

test("runtime number helpers stay explicit and use narrow full-string parsing", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value number_parse_int\(const value& input\);/);
  assert.match(header, /value number_parse_float\(const value& input\);/);
  assert.match(header, /value number_is_integer\(const value& input\);/);
  assert.match(header, /value number_is_finite\(const value& input\);/);
  assert.match(runtime, /std::string trim_number_input\(const std::string& input\)/);
  assert.match(runtime, /const std::string& require_number_parse_text\(const value& input\)/);
  assert.match(runtime, /throw std::runtime_error\("Jayess number parsing expects a string input"\);/);
  assert.match(runtime, /const auto parsed = std::stoll\(trimmed, &consumed, 10\);/);
  assert.match(runtime, /const auto parsed = std::stod\(trimmed, &consumed\);/);
  assert.match(runtime, /if \(consumed != trimmed\.size\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value number_is_integer\(const value& input\)/);
  assert.match(runtime, /std::isfinite\(number\) && std::floor\(number\) == number/);
  assert.match(runtime, /value number_is_finite\(const value& input\)/);
});

test("runtime system-module helpers stay explicit and bounded", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value fs_remove_path\(const std::string& pathText\);/);
  assert.match(header, /value fs_list_directory\(const std::string& pathText\);/);
  assert.match(header, /value fs_rename_path\(const std::string& fromPathText, const std::string& toPathText\);/);
  assert.match(header, /value fs_stat_path\(const std::string& pathText\);/);
  assert.match(header, /value path_resolve_parts\(const std::vector<std::string>& parts\);/);
  assert.match(header, /value path_relative_between\(const std::string& fromPathText, const std::string& toPathText\);/);
  assert.match(header, /value path_is_absolute\(const std::string& pathText\);/);
  assert.match(header, /void process_set_argv\(std::vector<std::string> args\);/);
  assert.match(header, /value process_get_argv\(\);/);
  assert.match(header, /value process_has_env\(const std::string& key\);/);
  assert.match(header, /value process_set_exit_code\(int code\);/);
  assert.match(runtime, /std::vector<std::string> process_argv_storage;/);
  assert.match(runtime, /int process_exit_code_storage = 0;/);
  assert.match(runtime, /value fs_remove_path\(const std::string& pathText\) \{/);
  assert.match(runtime, /return std::filesystem::remove\(fs_require_path\(pathText\)\);/);
  assert.match(runtime, /value fs_list_directory\(const std::string& pathText\) \{/);
  assert.match(runtime, /for \(const auto& entry : std::filesystem::directory_iterator\(fs_require_path\(pathText\)\)\) \{/);
  assert.match(runtime, /std::sort\(entryNames\.begin\(\), entryNames\.end\(\)\);/);
  assert.match(runtime, /return make_array\(fs_string_values\(entryNames\)\);/);
  assert.match(runtime, /value fs_rename_path\(const std::string& fromPathText, const std::string& toPathText\) \{/);
  assert.match(runtime, /std::filesystem::rename\(/);
  assert.match(runtime, /return value\(std::monostate\{\}\);/);
  assert.match(runtime, /value fs_stat_path\(const std::string& pathText\) \{/);
  assert.match(runtime, /const auto exists = std::filesystem::exists\(pathValue, error\);/);
  assert.match(runtime, /const auto isFile = exists && std::filesystem::is_regular_file\(pathValue, error\);/);
  assert.match(runtime, /const auto isDirectory = exists && std::filesystem::is_directory\(pathValue, error\);/);
  assert.match(runtime, /return make_object\(\{/);
  assert.match(runtime, /\{"exists", exists\}/);
  assert.match(runtime, /\{"size", sizeValue\}/);
  assert.match(runtime, /value path_resolve_parts\(const std::vector<std::string>& parts\) \{/);
  assert.match(runtime, /resolved = std::filesystem::current_path\(\) \/ part;/);
  assert.match(runtime, /return path_string_value\(resolved\.lexically_normal\(\)\);/);
  assert.match(runtime, /value path_relative_between\(const std::string& fromPathText, const std::string& toPathText\) \{/);
  assert.match(runtime, /std::filesystem::relative\(/);
  assert.match(runtime, /value path_is_absolute\(const std::string& pathText\) \{/);
  assert.match(runtime, /return path_require_filesystem_path\(pathText\)\.is_absolute\(\);/);
  assert.match(runtime, /void process_set_argv\(std::vector<std::string> args\) \{/);
  assert.match(runtime, /process_argv_storage = std::move\(args\);/);
  assert.match(runtime, /value process_get_argv\(\) \{/);
  assert.match(runtime, /return make_array\(process_string_values\(process_argv_storage\)\);/);
  assert.match(runtime, /value process_has_env\(const std::string& key\) \{/);
  assert.match(runtime, /value process_set_exit_code\(int code\) \{/);
});

test("runtime string helpers include explicit module-ready operations", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /std::string stringify_value\(const value& input\);/);
  assert.match(header, /value string_trim\(const value& input\);/);
  assert.match(header, /value string_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_split\(const value& input, const value& separator\);/);
  assert.match(runtime, /std::string require_string_value\(const value& input, const std::string& message\)/);
  assert.match(runtime, /double require_string_number_argument\(const std::vector<value>& args, std::size_t index, const std::string& message\)/);
  assert.match(runtime, /value string_trim\(const value& input\)/);
  assert.match(runtime, /Jayess string trim expects a string input/);
  assert.match(runtime, /value string_split\(const value& input, const value& separator\)/);
  assert.match(runtime, /Jayess string split expects a string separator/);
  assert.match(runtime, /return make_array\(std::move\(items\)\);/);
});

test("runtime thread helpers stay explicit and transfer values across workers", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct thread_state;/);
  assert.match(header, /using thread_ptr = std::shared_ptr<thread_state>;/);
  assert.match(header, /value thread_spawn\(const value& callback, const value& args\);/);
  assert.match(header, /value thread_join\(const value& input\);/);
  assert.match(header, /value thread_sleep_for_milliseconds\(int milliseconds\);/);
  assert.match(header, /value thread_hardware_concurrency\(\);/);
  assert.match(header, /value thread_current_id\(\);/);
  assert.match(runtime, /struct thread_state \{/);
  assert.match(runtime, /std::thread worker;/);
  assert.match(runtime, /std::mutex mutex;/);
  assert.match(runtime, /bool detached = false;/);
  assert.match(runtime, /value transfer_thread_value\(const value& input\)/);
  assert.match(runtime, /Value cannot cross a Jayess thread boundary/);
  assert.match(runtime, /value thread_spawn\(const value& callback, const value& args\)/);
  assert.match(runtime, /callable->fn\(transferredArgs\)/);
  assert.match(runtime, /value thread_join\(const value& input\)/);
  assert.match(runtime, /Jayess thread handle has already been joined/);
  assert.match(runtime, /value thread_sleep_for_milliseconds\(int milliseconds\)/);
  assert.match(runtime, /value thread_hardware_concurrency\(\)/);
  assert.match(runtime, /value thread_current_id\(\)/);
});

test("runtime array helpers include explicit module-ready operations", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value array_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value array_concat\(const value& left, const value& right\);/);
  assert.match(header, /value array_index_of\(const value& input, const value& needle\);/);
  assert.match(header, /value array_map\(const value& input, const value& callback\);/);
  assert.match(header, /value array_filter\(const value& input, const value& callback\);/);
  assert.match(header, /value array_reduce\(const value& input, const value& callback, const value& initial\);/);
  assert.match(runtime, /array_ptr require_array_value\(const value& input, const std::string& message\)/);
  assert.match(runtime, /callable_ptr require_array_callback\(const value& callback, const std::string& message\)/);
  assert.match(runtime, /value array_slice\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /Jayess array slice expects a numeric start index/);
  assert.match(runtime, /value array_concat\(const value& left, const value& right\)/);
  assert.match(runtime, /Jayess array concat expects an array argument/);
  assert.match(runtime, /value array_index_of\(const value& input, const value& needle\)/);
  assert.match(runtime, /return static_cast<double>\(-1\);/);
  assert.match(runtime, /value array_map\(const value& input, const value& callback\)/);
  assert.match(runtime, /mapped\.push_back\(callable->fn\(\{array->items\[index\], static_cast<double>\(index\), input\}\)\);/);
  assert.match(runtime, /value array_filter\(const value& input, const value& callback\)/);
  assert.match(runtime, /if \(truthy\(keep\)\) \{/);
  assert.match(runtime, /value array_reduce\(const value& input, const value& callback, const value& initial\)/);
  assert.match(runtime, /accumulator = callable->fn\(\{accumulator, array->items\[index\], static_cast<double>\(index\), input\}\);/);
});

test("runtime object helpers include explicit mutation and construction helpers", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value object_has\(const value& input, const value& key\);/);
  assert.match(header, /value object_from_entries\(const value& entries\);/);
  assert.match(header, /value object_assign\(const value& target, const value& source\);/);
  assert.match(runtime, /std::string require_object_key_text\(const value& input\)/);
  assert.match(runtime, /Jayess object helper expects a string key/);
  assert.match(runtime, /array_ptr require_object_entry_array\(const value& input\)/);
  assert.match(runtime, /value object_has\(const value& input, const value& key\)/);
  assert.match(runtime, /value object_from_entries\(const value& entries\)/);
  assert.match(runtime, /value object_assign\(const value& target, const value& source\)/);
});

test("runtime regex helpers stay explicit and use a narrow native helper layer", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value regex_create\(const value& pattern\);/);
  assert.match(header, /value regex_create\(const value& pattern, const value& flags\);/);
  assert.match(header, /bool is_regex_value\(const value& input\);/);
  assert.match(header, /value regex_test\(const value& regexValue, const value& text\);/);
  assert.match(header, /value regex_exec\(const value& regexValue, const value& text\);/);
  assert.match(header, /value regex_replace_first\(const value& regexValue, const value& text, const value& replacement\);/);
  assert.match(header, /value regex_replace_all\(const value& regexValue, const value& text, const value& replacement\);/);
  assert.match(runtime, /constexpr const char\* kJayessRegexTagKey = "__jayess_regex_tag";/);
  assert.match(runtime, /constexpr const char\* kJayessRegexPatternKey = "__jayess_regex_pattern";/);
  assert.match(runtime, /constexpr const char\* kJayessRegexFlagsKey = "__jayess_regex_flags";/);
  assert.match(runtime, /regex_flags parse_regex_flags\(const value& input\)/);
  assert.match(runtime, /std::regex_constants::icase/);
  assert.match(runtime, /std::regex_constants::multiline/);
  assert.match(runtime, /bool dotAll = false;/);
  assert.match(runtime, /std::string apply_dot_all_pattern_transform\(const std::string& pattern\)/);
  assert.match(runtime, /std::regex require_compiled_regex\(const value& input\)/);
  assert.match(runtime, /throw std::runtime_error\("Jayess regex creation expects a string pattern"\);/);
  assert.match(runtime, /throw std::runtime_error\("Jayess regex flags expect a string input"\);/);
  assert.match(runtime, /throw std::runtime_error\("Duplicate Jayess regex flag: i"\);/);
  assert.match(runtime, /throw std::runtime_error\(std::string\("Unknown Jayess regex flag: "\) \+ flag\);/);
  assert.match(runtime, /throw std::runtime_error\("Jayess regex operations expect a string text input"\);/);
  assert.match(runtime, /throw std::runtime_error\("Jayess regex replacement expects a string replacement input"\);/);
  assert.match(runtime, /throw std::runtime_error\("Invalid Jayess regex pattern"\);/);
  assert.match(runtime, /return regex_create\(pattern, value\(std::monostate\{\}\)\);/);
  assert.match(runtime, /object->private_fields\.insert_or_assign\(kJayessRegexFlagsKey, flags\.text\);/);
  assert.match(runtime, /return std::regex_search\(input, compiled\);/);
  assert.match(runtime, /std::smatch match;/);
  assert.match(runtime, /items\.push_back\(entry\.str\(\)\);/);
  assert.match(runtime, /std::regex_constants::format_first_only/);
  assert.match(runtime, /value regex_replace_all\(const value& regexValue, const value& text, const value& replacement\)/);
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
  assert.match(header, /value map_keys\(const value& map\);/);
  assert.match(header, /value map_values\(const value& map\);/);
  assert.match(header, /value map_entries\(const value& map\);/);
  assert.match(header, /value map_from_entries\(const value& entries\);/);
  assert.match(header, /value map_set_all\(const value& map, const value& entries\);/);
  assert.match(header, /value map_delete_all\(const value& map, const value& keys\);/);
  assert.match(runtime, /map_ptr require_map_value\(const value& input\)/);
  assert.match(runtime, /std::vector<map_entry>::iterator find_map_entry\(map_ptr& map, const value& key\)/);
  assert.match(runtime, /std::get<bool>\(equal\(entry\.key, key\)\)/);
  assert.match(runtime, /array_ptr require_map_entry_array\(const value& input\)/);
  assert.match(runtime, /value make_map\(\) \{\s*return std::make_shared<map_value>\(\);/);
  assert.match(runtime, /bool is_map_value\(const value& input\) \{\s*return std::holds_alternative<map_ptr>\(input\);/);
  assert.match(runtime, /if \(iterator == storage->entries\.end\(\)\) \{\s*return value\(std::monostate\{\}\);/);
  assert.match(runtime, /storage->entries\.push_back\(\{key, assigned\}\);/);
  assert.match(runtime, /storage->entries\.erase\(iterator\);/);
  assert.match(runtime, /storage->entries\.clear\(\);/);
  assert.match(runtime, /return static_cast<double>\(storage->entries\.size\(\)\);/);
  assert.match(runtime, /value map_keys\(const value& map\) \{/);
  assert.match(runtime, /value map_values\(const value& map\) \{/);
  assert.match(runtime, /value map_entries\(const value& map\) \{/);
  assert.match(runtime, /items\.push_back\(make_array\(\{entry\.key, entry\.stored\}\)\);/);
  assert.match(runtime, /value map_from_entries\(const value& entries\) \{/);
  assert.match(runtime, /value map_set_all\(const value& map, const value& entries\) \{/);
  assert.match(runtime, /value map_delete_all\(const value& map, const value& keys\) \{/);
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
  assert.match(header, /value set_values\(const value& input\);/);
  assert.match(header, /value set_entries\(const value& input\);/);
  assert.match(header, /value set_from_values\(const value& values\);/);
  assert.match(header, /value set_union\(const value& left, const value& right\);/);
  assert.match(header, /value set_intersection\(const value& left, const value& right\);/);
  assert.match(header, /value set_difference\(const value& left, const value& right\);/);
  assert.match(runtime, /set_ptr require_set_value\(const value& input\)/);
  assert.match(runtime, /std::vector<value>::iterator find_set_entry\(set_ptr& set, const value& member\)/);
  assert.match(runtime, /std::get<bool>\(equal\(entry, member\)\)/);
  assert.match(runtime, /array_ptr require_set_bulk_array\(const value& input, const std::string& message\)/);
  assert.match(runtime, /value make_set\(\) \{\s*return std::make_shared<set_value>\(\);/);
  assert.match(runtime, /bool is_set_value\(const value& input\) \{\s*return std::holds_alternative<set_ptr>\(input\);/);
  assert.match(runtime, /if \(find_set_entry\(set, member\) == set->entries\.end\(\)\) \{\s*set->entries\.push_back\(member\);/);
  assert.match(runtime, /return find_set_entry\(set, member\) != set->entries\.end\(\);/);
  assert.match(runtime, /set->entries\.erase\(iterator\);/);
  assert.match(runtime, /set->entries\.clear\(\);/);
  assert.match(runtime, /return static_cast<double>\(set->entries\.size\(\)\);/);
  assert.match(runtime, /value set_values\(const value& input\) \{/);
  assert.match(runtime, /value set_entries\(const value& input\) \{/);
  assert.match(runtime, /items\.push_back\(make_array\(\{entry, entry\}\)\);/);
  assert.match(runtime, /value set_from_values\(const value& values\) \{/);
  assert.match(runtime, /value set_union\(const value& left, const value& right\) \{/);
  assert.match(runtime, /value set_intersection\(const value& left, const value& right\) \{/);
  assert.match(runtime, /value set_difference\(const value& left, const value& right\) \{/);
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
  assert.match(header, /value process_has_env\(const std::string& key\);/);
  assert.match(header, /value process_set_exit_code\(int code\);/);
  assert.match(header, /\[\[noreturn\]\] void process_exit_with_code\(int code\);/);
  assert.match(runtime, /std::filesystem::path fs_require_path\(const std::string& pathText\)/);
  assert.match(runtime, /std::filesystem::path path_require_filesystem_path\(const std::string& pathText\)/);
  assert.match(runtime, /return std::filesystem::exists\(fs_require_path\(pathText\)\);/);
  assert.match(runtime, /std::ifstream stream\(fs_require_path\(pathText\), std::ios::binary\);/);
  assert.match(runtime, /std::ofstream stream\(fs_require_path\(pathText\), std::ios::binary\);/);
  assert.match(runtime, /return std::filesystem::create_directories\(fs_require_path\(pathText\)\);/);
  assert.match(runtime, /joined \/\= std::filesystem::path\(part\);/);
  assert.match(runtime, /return path_string_value\(joined\.lexically_normal\(\)\);/);
  assert.match(runtime, /return path_string_value\(path_require_filesystem_path\(pathText\)\.parent_path\(\)\);/);
  assert.match(runtime, /return path_string_value\(path_require_filesystem_path\(pathText\)\.filename\(\)\);/);
  assert.match(runtime, /return path_string_value\(path_require_filesystem_path\(pathText\)\.extension\(\)\);/);
  assert.match(runtime, /return path_string_value\(path_require_filesystem_path\(pathText\)\.lexically_normal\(\)\);/);
  assert.match(runtime, /return path_string_value\(std::filesystem::current_path\(\)\);/);
  assert.match(runtime, /const auto\* envValue = std::getenv\(key\.c_str\(\)\);/);
  assert.match(runtime, /return value\(std::monostate\{\}\);/);
  assert.match(runtime, /std::exit\(code\);/);
});

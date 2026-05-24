import test from "node:test";
import assert from "node:assert/strict";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../src/cpp/runtime-source.js";

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

test("runtime bytes helpers stay explicit and byte-oriented", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value bytes_from_array\(const value& input\);/);
  assert.match(header, /value bytes_to_array\(const value& input\);/);
  assert.match(header, /value bytes_get\(const value& input, const value& index\);/);
  assert.match(header, /value bytes_set\(const value& input, const value& index, const value& assigned\);/);
  assert.match(header, /value bytes_fill\(const value& input, const value& assigned\);/);
  assert.match(header, /value bytes_compare\(const value& left, const value& right\);/);
  assert.match(header, /value bytes_starts_with\(const value& input, const value& prefix\);/);
  assert.match(header, /value bytes_ends_with\(const value& input, const value& suffix\);/);
  assert.match(runtime, /unsigned char require_byte_number\(const value& input, const std::string& message\)/);
  assert.match(runtime, /Jayess bytes fromArray expects byte numbers/);
  assert.match(runtime, /value bytes_get\(const value& input, const value& index\)/);
  assert.match(runtime, /value bytes_set\(const value& input, const value& index, const value& assigned\)/);
  assert.match(runtime, /std::lexicographical_compare/);
  assert.match(runtime, /value bytes_starts_with\(const value& input, const value& prefix\)/);
  assert.match(runtime, /value bytes_ends_with\(const value& input, const value& suffix\)/);
});

test("runtime events helpers stay explicit and callback-owned", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /struct event_listener/);
  assert.match(header, /struct event_emitter/);
  assert.match(header, /value events_create\(\);/);
  assert.match(header, /value events_on\(const value& emitter, const std::string& name, const value& callback\);/);
  assert.match(header, /value events_emit\(const value& emitter, const std::string& name, const value& args\);/);
  assert.match(runtime, /event_emitter_ptr require_event_emitter\(const value& input\)/);
  assert.match(runtime, /callable_ptr require_event_callback\(const value& input\)/);
  assert.match(runtime, /storage->listeners.push_back\(\{name, require_event_callback\(callback\), once\}\);/);
  assert.match(runtime, /listener.name == name && listener.callback == callable/);
  assert.match(runtime, /callback->fn\(emittedArgs\);/);
  assert.match(runtime, /value events_listener_count\(const value& emitter, const std::string& name\)/);
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

test("runtime string helpers include explicit module-ready operations", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /std::string stringify_value\(const value& input\);/);
  assert.match(header, /value string_trim\(const value& input\);/);
  assert.match(header, /value string_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_split\(const value& input, const value& separator\);/);
  assert.match(header, /value string_replace_first\(const value& input, const value& search, const value& replacement\);/);
  assert.match(header, /value string_replace_all\(const value& input, const value& search, const value& replacement\);/);
  assert.match(header, /value string_pad_start\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_pad_end\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value string_repeat\(const value& input, const value& count\);/);
  assert.match(header, /value string_to_lower\(const value& input\);/);
  assert.match(header, /value string_to_upper\(const value& input\);/);
  assert.match(runtime, /std::string require_string_value\(const value& input, const std::string& message\)/);
  assert.match(runtime, /double require_string_number_argument\(const std::vector<value>& args, std::size_t index, const std::string& message\)/);
  assert.match(runtime, /value string_trim\(const value& input\)/);
  assert.match(runtime, /Jayess string trim expects a string input/);
  assert.match(runtime, /value string_split\(const value& input, const value& separator\)/);
  assert.match(runtime, /Jayess string split expects a string separator/);
  assert.match(runtime, /value string_replace_first\(const value& input, const value& search, const value& replacement\)/);
  assert.match(runtime, /value string_replace_all\(const value& input, const value& search, const value& replacement\)/);
  assert.match(runtime, /value string_pad_start\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /value string_pad_end\(const value& input, const std::vector<value>& args\)/);
  assert.match(runtime, /value string_repeat\(const value& input, const value& count\)/);
  assert.match(runtime, /value string_to_lower\(const value& input\)/);
  assert.match(runtime, /value string_to_upper\(const value& input\)/);
  assert.match(runtime, /return make_array\(std::move\(items\)\);/);
});

test("runtime array helpers include explicit module-ready operations", () => {
  const header = getRuntimeHeaderSource();
  const runtime = getRuntimeCppSource();

  assert.match(header, /value array_slice\(const value& input, const std::vector<value>& args\);/);
  assert.match(header, /value array_concat\(const value& left, const value& right\);/);
  assert.match(header, /value array_index_of\(const value& input, const value& needle\);/);
  assert.match(header, /value array_find\(const value& input, const value& callback\);/);
  assert.match(header, /value array_find_index\(const value& input, const value& callback\);/);
  assert.match(header, /value array_some\(const value& input, const value& callback\);/);
  assert.match(header, /value array_every\(const value& input, const value& callback\);/);
  assert.match(header, /value array_reverse\(const value& input\);/);
  assert.match(header, /value array_sort\(const value& input, const std::vector<value>& args\);/);
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
  assert.match(runtime, /value array_find\(const value& input, const value& callback\)/);
  assert.match(runtime, /value array_find_index\(const value& input, const value& callback\)/);
  assert.match(runtime, /value array_some\(const value& input, const value& callback\)/);
  assert.match(runtime, /value array_every\(const value& input, const value& callback\)/);
  assert.match(runtime, /value array_reverse\(const value& input\)/);
  assert.match(runtime, /value array_sort\(const value& input, const std::vector<value>& args\)/);
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
  assert.match(header, /value regex_split\(const value& regexValue, const value& text\);/);
  assert.match(header, /value regex_match_all\(const value& regexValue, const value& text\);/);
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
  assert.match(runtime, /value regex_split\(const value& regexValue, const value& text\)/);
  assert.match(runtime, /std::sregex_token_iterator current\(input\.begin\(\), input\.end\(\), compiled, -1\);/);
  assert.match(runtime, /value regex_match_all\(const value& regexValue, const value& text\)/);
  assert.match(runtime, /std::sregex_iterator current\(input\.begin\(\), input\.end\(\), compiled\)/);
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

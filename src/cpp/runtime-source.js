import { getAsyncRuntimeCppFragment, getAsyncRuntimeHeaderFragment } from "./runtime-async-source.js";
import { getArrayRuntimeCppFragment, getArrayRuntimeHeaderFragment } from "./runtime-array-source.js";
import { getClassRuntimeCppFragment, getClassRuntimeHeaderFragment } from "./runtime-class-source.js";
import { getDateRuntimeCppFragment, getDateRuntimeHeaderFragment } from "./runtime-date-source.js";
import { getFsRuntimeCppFragment, getFsRuntimeHeaderFragment } from "./runtime-fs-source.js";
import { getGeneratorRuntimeCppFragment, getGeneratorRuntimeHeaderFragment } from "./runtime-generator-source.js";
import { getIterRuntimeCppFragment, getIterRuntimeHeaderFragment } from "./runtime-iter-source.js";
import { getJsonRuntimeCppFragment, getJsonRuntimeHeaderFragment } from "./runtime-json-source.js";
import { getMapRuntimeCppFragment, getMapRuntimeHeaderFragment } from "./runtime-map-source.js";
import { getMathRuntimeCppFragment, getMathRuntimeHeaderFragment } from "./runtime-math-source.js";
import { getNumberRuntimeCppFragment, getNumberRuntimeHeaderFragment } from "./runtime-number-source.js";
import { getObjectRuntimeCppFragment, getObjectRuntimeHeaderFragment } from "./runtime-object-source.js";
import { getPathRuntimeCppFragment, getPathRuntimeHeaderFragment } from "./runtime-path-source.js";
import { getPrivateRuntimeCppFragment, getPrivateRuntimeHeaderFragment } from "./runtime-private-source.js";
import { getRegexRuntimeCppFragment, getRegexRuntimeHeaderFragment } from "./runtime-regex-source.js";
import { getSetRuntimeCppFragment, getSetRuntimeHeaderFragment } from "./runtime-set-source.js";
import { getStringRuntimeCppFragment, getStringRuntimeHeaderFragment } from "./runtime-string-source.js";
import { getSystemRuntimeCppFragment, getSystemRuntimeHeaderFragment } from "./runtime-system-source.js";
import { getThreadRuntimeCppFragment, getThreadRuntimeHeaderFragment } from "./runtime-thread-source.js";

export function getRuntimeHeaderSource() {
  return `#pragma once
#include <functional>
#include <exception>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <sstream>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>
#include <variant>
#include <unordered_map>

namespace jayess {
struct array_value;
struct object_value;
struct callable_value;
struct async_state;
struct generator_state;
struct map_value;
struct set_value;
struct thread_state;

using array_ptr = std::shared_ptr<array_value>;
using object_ptr = std::shared_ptr<object_value>;
using callable_ptr = std::shared_ptr<callable_value>;
using async_ptr = std::shared_ptr<async_state>;
using generator_ptr = std::shared_ptr<generator_state>;
using map_ptr = std::shared_ptr<map_value>;
using set_ptr = std::shared_ptr<set_value>;
using thread_ptr = std::shared_ptr<thread_state>;
using value = std::variant<std::monostate, double, bool, std::string, array_ptr, object_ptr, callable_ptr, async_ptr, generator_ptr, map_ptr, set_ptr, thread_ptr>;

struct array_value {
  std::vector<value> items;
};

struct object_value {
  std::unordered_map<std::string, value> fields;
  std::unordered_map<std::string, value> private_fields;
};

struct callable_value {
  std::function<value(const std::vector<value>&)> fn;
  std::unordered_map<std::string, value> fields;
};

${getAsyncRuntimeHeaderFragment()}
${getArrayRuntimeHeaderFragment()}
${getClassRuntimeHeaderFragment()}
${getDateRuntimeHeaderFragment()}
${getFsRuntimeHeaderFragment()}
${getGeneratorRuntimeHeaderFragment()}
${getIterRuntimeHeaderFragment()}
${getJsonRuntimeHeaderFragment()}
${getMapRuntimeHeaderFragment()}
${getMathRuntimeHeaderFragment()}
${getNumberRuntimeHeaderFragment()}
${getObjectRuntimeHeaderFragment()}
${getPathRuntimeHeaderFragment()}
${getRegexRuntimeHeaderFragment()}
${getSetRuntimeHeaderFragment()}
${getStringRuntimeHeaderFragment()}
${getSystemRuntimeHeaderFragment()}
${getThreadRuntimeHeaderFragment()}
${getPrivateRuntimeHeaderFragment()}

struct scope_cleanup_frame {
  std::vector<std::function<void()>> cleanups;

  void defer(std::function<void()> cleanup);
  ~scope_cleanup_frame();
};

struct finally_guard {
  std::function<void()> cleanup;

  explicit finally_guard(std::function<void()> cleanup);
  ~finally_guard();
};

struct thrown_value : std::exception {
  value payload;
  std::string message;

  explicit thrown_value(value payload);
  const char* what() const noexcept override;
};

bool truthy(const value& input);
bool is_null(const value& input);
bool has_argument(const std::vector<value>& args, std::size_t index);
value argument_at(const std::vector<value>& args, std::size_t index);
value rest_arguments(const std::vector<value>& args, std::size_t index);
value make_array(std::vector<value> items);
value make_object(std::vector<std::pair<std::string, value>> fields);
std::string stringify_value(const value& input);
value interpolate(std::vector<value> parts);
value to_string_value(const value& input);
[[noreturn]] void throw_value(value input);
value exception_to_value(const thrown_value& error);
value exception_to_value(const std::exception& error);
value add(const value& left, const value& right);
value positive(const value& input);
value subtract(const value& left, const value& right);
value multiply(const value& left, const value& right);
value divide(const value& left, const value& right);
value modulo(const value& left, const value& right);
value power(const value& left, const value& right);
value greater_than(const value& left, const value& right);
value less_than(const value& left, const value& right);
value greater_than_equal(const value& left, const value& right);
value less_than_equal(const value& left, const value& right);
value equal(const value& left, const value& right);
value not_equal(const value& left, const value& right);
value get_length(const value& input);
value array_pop(const value& input);
value array_join(const value& input, const std::vector<value>& args);
value array_includes(const value& input, const std::vector<value>& args);
value get_property(const value& input, const std::string& key);
value get_index(const value& input, const value& key);
value destructure_property(const value& input, const std::string& key);
value destructure_index(const value& input, const value& key);
value destructure_rest_array(const value& input, std::size_t startIndex);
value destructure_rest_object(const value& input, std::vector<std::string> excludedKeys);
value array_push(const value& input, std::vector<value> items);
void append_spread_values(std::vector<value>& args, const value& input);
void append_object_spread_fields(std::vector<std::pair<std::string, value>>& fields, const value& input);
value call_with_args(const value& callable, std::vector<value> args);
value set_property(const value& input, const std::string& key, const value& assigned);
value set_index(const value& input, const value& key, const value& assigned);

template <typename Callable>
inline value make_callable(Callable&& callable) {
  auto wrapper = std::make_shared<callable_value>();
  wrapper->fn = std::forward<Callable>(callable);
  return wrapper;
}

template <typename Callable, typename = std::enable_if_t<!std::is_same_v<std::decay_t<Callable>, value>>>
inline value call_with_args(Callable&& callable, std::vector<value> args) {
  return std::forward<Callable>(callable)(args);
}

template <typename Callable, typename... Args, typename = std::enable_if_t<!std::is_same_v<std::decay_t<Callable>, value>>>
inline value call(Callable&& callable, Args&&... args) {
  return std::forward<Callable>(callable)({std::forward<Args>(args)...});
}

template <typename... Args>
inline value call(const value& callable, Args&&... args) {
  const auto& wrapper = std::get<callable_ptr>(callable);
  return wrapper->fn({std::forward<Args>(args)...});
}
} // namespace jayess
`;
}

export function getRuntimeCppSource() {
  return `#include "jayess_runtime.hpp"

#include <algorithm>
#include <cstdlib>
#include <cctype>
#include <chrono>
#include <cmath>
#include <ctime>
#include <deque>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <mutex>
#include <regex>
#include <stdexcept>
#include <thread>

namespace jayess {
${getAsyncRuntimeCppFragment()}
${getArrayRuntimeCppFragment()}
${getClassRuntimeCppFragment()}
${getDateRuntimeCppFragment()}
${getFsRuntimeCppFragment()}
${getGeneratorRuntimeCppFragment()}
${getIterRuntimeCppFragment()}
${getJsonRuntimeCppFragment()}
${getMapRuntimeCppFragment()}
${getMathRuntimeCppFragment()}
${getNumberRuntimeCppFragment()}
${getObjectRuntimeCppFragment()}
${getPathRuntimeCppFragment()}
${getRegexRuntimeCppFragment()}
${getSetRuntimeCppFragment()}
${getSystemRuntimeCppFragment()}
${getThreadRuntimeCppFragment()}
${getPrivateRuntimeCppFragment()}

void scope_cleanup_frame::defer(std::function<void()> cleanup) {
  cleanups.push_back(std::move(cleanup));
}

scope_cleanup_frame::~scope_cleanup_frame() {
  for (auto iterator = cleanups.rbegin(); iterator != cleanups.rend(); ++iterator) {
    (*iterator)();
  }
}

finally_guard::finally_guard(std::function<void()> cleanup)
  : cleanup(std::move(cleanup)) {
}

finally_guard::~finally_guard() {
  if (cleanup) {
    cleanup();
  }
}

thrown_value::thrown_value(value payload)
  : payload(std::move(payload)),
    message("Jayess thrown value") {
}

const char* thrown_value::what() const noexcept {
  return message.c_str();
}

bool truthy(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return false;
  }
  if (std::holds_alternative<bool>(input)) {
    return std::get<bool>(input);
  }
  if (std::holds_alternative<double>(input)) {
    return std::get<double>(input) != 0.0;
  }
  if (std::holds_alternative<array_ptr>(input)) {
    return !std::get<array_ptr>(input)->items.empty();
  }
  if (std::holds_alternative<object_ptr>(input)) {
    return !std::get<object_ptr>(input)->fields.empty();
  }
  if (std::holds_alternative<callable_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<async_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<generator_ptr>(input)) {
    return true;
  }
  if (std::holds_alternative<map_ptr>(input)) {
    return !std::get<map_ptr>(input)->entries.empty();
  }
  if (std::holds_alternative<set_ptr>(input)) {
    return !std::get<set_ptr>(input)->entries.empty();
  }
  if (std::holds_alternative<thread_ptr>(input)) {
    return true;
  }
  return !std::get<std::string>(input).empty();
}

bool is_null(const value& input) {
  return std::holds_alternative<std::monostate>(input);
}

bool has_argument(const std::vector<value>& args, std::size_t index) {
  return index < args.size();
}

value argument_at(const std::vector<value>& args, std::size_t index) {
  if (index >= args.size()) {
    return 0.0;
  }
  return args[index];
}

value rest_arguments(const std::vector<value>& args, std::size_t index) {
  if (index >= args.size()) {
    return make_array({});
  }

  std::vector<value> items;
  items.reserve(args.size() - index);
  for (std::size_t current = index; current < args.size(); current += 1) {
    items.push_back(args[current]);
  }
  return make_array(std::move(items));
}

value make_array(std::vector<value> items) {
  auto array = std::make_shared<array_value>();
  array->items = std::move(items);
  return array;
}

value make_object(std::vector<std::pair<std::string, value>> fields) {
  auto object = std::make_shared<object_value>();
  for (auto& field : fields) {
    object->fields.insert_or_assign(field.first, std::move(field.second));
  }
  return object;
}

std::string stringify_value(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return "null";
  }
  if (std::holds_alternative<double>(input)) {
    std::ostringstream stream;
    stream << std::get<double>(input);
    return stream.str();
  }
  if (std::holds_alternative<bool>(input)) {
    return std::get<bool>(input) ? "true" : "false";
  }
  if (std::holds_alternative<std::string>(input)) {
    return std::get<std::string>(input);
  }
  if (std::holds_alternative<thread_ptr>(input)) {
    throw std::runtime_error("Unsupported thread string conversion");
  }
  throw std::runtime_error("Unsupported template interpolation value");
}

std::string property_key_string(const value& input) {
  return stringify_value(input);
}

value interpolate(std::vector<value> parts) {
  std::string result;
  for (const auto& part : parts) {
    result += stringify_value(part);
  }
  return result;
}

value to_string_value(const value& input) {
  return stringify_value(input);
}

${getStringRuntimeCppFragment()}

void throw_value(value input) {
  throw thrown_value(std::move(input));
}

value exception_to_value(const thrown_value& error) {
  return error.payload;
}

value exception_to_value(const std::exception& error) {
  return std::string(error.what());
}

value add(const value& left, const value& right) {
  if (std::holds_alternative<double>(left) && std::holds_alternative<double>(right)) {
    return std::get<double>(left) + std::get<double>(right);
  }
  if (std::holds_alternative<std::string>(left) && std::holds_alternative<std::string>(right)) {
    return std::get<std::string>(left) + std::get<std::string>(right);
  }
  throw std::runtime_error("Unsupported add operands");
}

value positive(const value& input) {
  return std::get<double>(input);
}

value subtract(const value& left, const value& right) {
  return std::get<double>(left) - std::get<double>(right);
}

value multiply(const value& left, const value& right) {
  return std::get<double>(left) * std::get<double>(right);
}

value divide(const value& left, const value& right) {
  return std::get<double>(left) / std::get<double>(right);
}

value modulo(const value& left, const value& right) {
  return std::fmod(std::get<double>(left), std::get<double>(right));
}

value power(const value& left, const value& right) {
  return std::pow(std::get<double>(left), std::get<double>(right));
}

value greater_than(const value& left, const value& right) {
  return std::get<double>(left) > std::get<double>(right);
}

value less_than(const value& left, const value& right) {
  return std::get<double>(left) < std::get<double>(right);
}

value greater_than_equal(const value& left, const value& right) {
  return std::get<double>(left) >= std::get<double>(right);
}

value less_than_equal(const value& left, const value& right) {
  return std::get<double>(left) <= std::get<double>(right);
}

value equal(const value& left, const value& right) {
  if (left.index() != right.index()) {
    return false;
  }
  if (std::holds_alternative<std::monostate>(left)) {
    return true;
  }
  if (std::holds_alternative<double>(left)) {
    return std::get<double>(left) == std::get<double>(right);
  }
  if (std::holds_alternative<bool>(left)) {
    return std::get<bool>(left) == std::get<bool>(right);
  }
  if (std::holds_alternative<array_ptr>(left)) {
    return std::get<array_ptr>(left) == std::get<array_ptr>(right);
  }
  if (std::holds_alternative<object_ptr>(left)) {
    return std::get<object_ptr>(left) == std::get<object_ptr>(right);
  }
  if (std::holds_alternative<callable_ptr>(left)) {
    return std::get<callable_ptr>(left) == std::get<callable_ptr>(right);
  }
  if (std::holds_alternative<async_ptr>(left)) {
    return std::get<async_ptr>(left) == std::get<async_ptr>(right);
  }
  if (std::holds_alternative<generator_ptr>(left)) {
    return std::get<generator_ptr>(left) == std::get<generator_ptr>(right);
  }
  if (std::holds_alternative<map_ptr>(left)) {
    return std::get<map_ptr>(left) == std::get<map_ptr>(right);
  }
  if (std::holds_alternative<set_ptr>(left)) {
    return std::get<set_ptr>(left) == std::get<set_ptr>(right);
  }
  if (std::holds_alternative<thread_ptr>(left)) {
    return std::get<thread_ptr>(left) == std::get<thread_ptr>(right);
  }
  return std::get<std::string>(left) == std::get<std::string>(right);
}

value not_equal(const value& left, const value& right) {
  return !std::get<bool>(equal(left, right));
}

value get_length(const value& input) {
  if (std::holds_alternative<array_ptr>(input)) {
    return static_cast<double>(std::get<array_ptr>(input)->items.size());
  }
  if (std::holds_alternative<std::string>(input)) {
    return static_cast<double>(std::get<std::string>(input).size());
  }
  return get_property(input, "length");
}

value array_pop(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Unsupported pop receiver");
  }

  const auto& array = std::get<array_ptr>(input);
  if (array->items.empty()) {
    return value(std::monostate{});
  }

  value popped = array->items.back();
  array->items.pop_back();
  return popped;
}

value array_join(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Unsupported join receiver");
  }

  std::string separator = ",";
  if (!args.empty()) {
    separator = stringify_value(args[0]);
  }

  const auto& array = std::get<array_ptr>(input);
  std::string result;
  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    if (index > 0) {
      result += separator;
    }
    result += stringify_value(array->items[index]);
  }
  return result;
}

value array_includes(const value& input, const std::vector<value>& args) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Unsupported includes receiver");
  }

  if (args.size() != 1) {
    throw std::runtime_error("array.includes expects exactly one argument");
  }

  const auto& array = std::get<array_ptr>(input);
  for (const auto& item : array->items) {
    if (std::get<bool>(equal(item, args[0]))) {
      return true;
    }
  }
  return false;
}

value get_property(const value& input, const std::string& key) {
  if (std::holds_alternative<callable_ptr>(input)) {
    return find_static_class_member(input, key);
  }
  const auto& object = std::get<object_ptr>(input);
  const auto iterator = object->fields.find(key);
  if (iterator != object->fields.end()) {
    return iterator->second;
  }
  const auto classValue = get_instance_class(input);
  if (!std::holds_alternative<std::monostate>(classValue)) {
    return bind_method(input, find_class_method(classValue, key));
  }
  return value(std::monostate{});
}

value get_index(const value& input, const value& key) {
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& array = std::get<array_ptr>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= array->items.size()) {
      return value(std::monostate{});
    }
    return array->items[index];
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return get_property(input, property_key_string(key));
  }

  return value(std::monostate{});
}

value destructure_property(const value& input, const std::string& key) {
  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    const auto iterator = callable->fields.find(key);
    if (iterator == callable->fields.end()) {
      return value(std::monostate{});
    }
    return iterator->second;
  }

  if (std::holds_alternative<object_ptr>(input)) {
    const auto& object = std::get<object_ptr>(input);
    const auto iterator = object->fields.find(key);
    if (iterator == object->fields.end()) {
      return value(std::monostate{});
    }
    return iterator->second;
  }

  throw std::runtime_error("Unsupported object destructuring");
}

value destructure_index(const value& input, const value& key) {
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& array = std::get<array_ptr>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= array->items.size()) {
      return value(std::monostate{});
    }
    return array->items[index];
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return destructure_property(input, property_key_string(key));
  }

  throw std::runtime_error("Unsupported destructuring source");
}

value destructure_rest_array(const value& input, std::size_t startIndex) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Unsupported array rest destructuring source");
  }

  const auto& array = std::get<array_ptr>(input);
  std::vector<value> items;
  if (startIndex < array->items.size()) {
    items.reserve(array->items.size() - startIndex);
    for (std::size_t index = startIndex; index < array->items.size(); index += 1) {
      items.push_back(array->items[index]);
    }
  }
  return make_array(std::move(items));
}

value destructure_rest_object(const value& input, std::vector<std::string> excludedKeys) {
  std::unordered_map<std::string, value> sourceFields;

  if (std::holds_alternative<object_ptr>(input)) {
    sourceFields = std::get<object_ptr>(input)->fields;
  } else if (std::holds_alternative<callable_ptr>(input)) {
    sourceFields = std::get<callable_ptr>(input)->fields;
  } else {
    throw std::runtime_error("Unsupported object rest destructuring source");
  }

  auto object = std::make_shared<object_value>();
  for (const auto& key : excludedKeys) {
    sourceFields.erase(key);
  }
  object->fields = std::move(sourceFields);
  return object;
}

value set_property(const value& input, const std::string& key, const value& assigned) {
  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    callable->fields.insert_or_assign(key, assigned);
    return assigned;
  }
  const auto& object = std::get<object_ptr>(input);
  object->fields.insert_or_assign(key, assigned);
  return assigned;
}

value set_index(const value& input, const value& key, const value& assigned) {
  if (std::holds_alternative<array_ptr>(input)) {
    const auto& array = std::get<array_ptr>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= array->items.size()) {
      throw std::runtime_error("Array index out of bounds");
    }
    array->items[index] = assigned;
    return assigned;
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return set_property(input, property_key_string(key), assigned);
  }

  throw std::runtime_error("Unsupported indexed assignment");
}

value array_push(const value& input, std::vector<value> items) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Unsupported push receiver");
  }

  const auto& array = std::get<array_ptr>(input);
  for (auto& item : items) {
    array->items.push_back(std::move(item));
  }

  return static_cast<double>(array->items.size());
}

void append_spread_values(std::vector<value>& args, const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Spread values currently require a Jayess array");
  }

  const auto& array = std::get<array_ptr>(input);
  args.insert(args.end(), array->items.begin(), array->items.end());
}

void append_object_spread_fields(std::vector<std::pair<std::string, value>>& fields, const value& input) {
  if (std::holds_alternative<object_ptr>(input)) {
    const auto& object = std::get<object_ptr>(input);
    for (const auto& [key, value] : object->fields) {
      fields.push_back({key, value});
    }
    return;
  }

  if (std::holds_alternative<callable_ptr>(input)) {
    const auto& callable = std::get<callable_ptr>(input);
    for (const auto& [key, value] : callable->fields) {
      fields.push_back({key, value});
    }
    return;
  }

  throw std::runtime_error("Object spread currently requires a Jayess object or callable");
}

value call_with_args(const value& callable, std::vector<value> args) {
  const auto& wrapper = std::get<callable_ptr>(callable);
  return wrapper->fn(args);
}
} // namespace jayess
`;
}

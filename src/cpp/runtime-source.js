import {
  renderRuntimeCppFragments,
  renderRuntimeCppIncludes,
  renderRuntimeHeaderFragments,
  renderRuntimeHeaderIncludes
} from "./runtime-layout.js";
import {
  getCoreControlRuntimeCppFragment,
  getCoreControlRuntimeHeaderFragment
} from "./runtime-core-control-source.js";
import {
  getCoreCompositeMutationRuntimeCppFragment,
  getCoreCompositeMutationRuntimeHeaderFragment
} from "./runtime-core-composite-source.js";
import {
  getCoreValueEqualityRuntimeCppFragment,
  getCoreValueEqualityRuntimeHeaderFragment,
  getCoreValueStringRuntimeCppFragment,
  getCoreValueStringRuntimeHeaderFragment,
  getCoreValueTruthRuntimeCppFragment,
  getCoreValueTruthRuntimeHeaderFragment
} from "./runtime-core-value-source.js";

export function getRuntimeHeaderSource(options = {}) {
  const features = options.features ?? "all";
  return `#pragma once
${renderRuntimeHeaderIncludes()}

namespace jayess {
struct array_value;
struct object_value;
struct callable_value;
struct event_emitter;
struct async_state;
struct cancellation_token_state;
struct bytes_value;
struct generator_state;
struct map_value;
struct set_value;
struct stream_state;
struct subprocess_state;
struct thread_state;
struct channel_state;
struct net_socket_state;
struct net_server_state;
struct http_server_state;
struct http_response_state;
struct image_state;
struct window_state;
struct gpu_state;
struct watch_state;

using array_ptr = std::shared_ptr<array_value>;
using object_ptr = std::shared_ptr<object_value>;
using callable_ptr = std::shared_ptr<callable_value>;
using event_emitter_ptr = std::shared_ptr<event_emitter>;
using async_ptr = std::shared_ptr<async_state>;
using cancellation_token_ptr = std::shared_ptr<cancellation_token_state>;
using bytes_ptr = std::shared_ptr<bytes_value>;
using generator_ptr = std::shared_ptr<generator_state>;
using map_ptr = std::shared_ptr<map_value>;
using set_ptr = std::shared_ptr<set_value>;
using stream_ptr = std::shared_ptr<stream_state>;
using subprocess_ptr = std::shared_ptr<subprocess_state>;
using thread_ptr = std::shared_ptr<thread_state>;
using channel_ptr = std::shared_ptr<channel_state>;
using net_socket_ptr = std::shared_ptr<net_socket_state>;
using net_server_ptr = std::shared_ptr<net_server_state>;
using http_server_ptr = std::shared_ptr<http_server_state>;
using http_response_ptr = std::shared_ptr<http_response_state>;
using image_ptr = std::shared_ptr<image_state>;
using window_ptr = std::shared_ptr<window_state>;
using gpu_ptr = std::shared_ptr<gpu_state>;
using watch_ptr = std::shared_ptr<watch_state>;
using value = std::variant<std::monostate, double, bool, std::string, array_ptr, object_ptr, callable_ptr, event_emitter_ptr, async_ptr, cancellation_token_ptr, bytes_ptr, generator_ptr, map_ptr, set_ptr, stream_ptr, subprocess_ptr, thread_ptr, channel_ptr, net_socket_ptr, net_server_ptr, http_server_ptr, http_response_ptr, image_ptr, window_ptr, gpu_ptr, watch_ptr>;

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

struct bytes_value {
  std::vector<unsigned char> items;
};

${renderRuntimeHeaderFragments(features)}
${getCoreControlRuntimeHeaderFragment()}

${getCoreValueTruthRuntimeHeaderFragment()}
bool has_argument(const std::vector<value>& args, std::size_t index);
value argument_at(const std::vector<value>& args, std::size_t index);
value rest_arguments(const std::vector<value>& args, std::size_t index);
value make_array(std::vector<value> items);
value make_object(std::vector<std::pair<std::string, value>> fields);
${getCoreValueStringRuntimeHeaderFragment()}
[[noreturn]] void throw_value(value input);
value exception_to_value(const thrown_value& error);
value exception_to_value(const std::exception& error);
[[noreturn]] void throw_invalid_handle(const std::string& moduleName, const std::string& handleName);
[[noreturn]] void throw_closed_handle(const std::string& moduleName, const std::string& handleName);
[[noreturn]] void throw_completed_handle(const std::string& moduleName, const std::string& handleName, const std::string& stateName);
[[noreturn]] void throw_wrong_direction(const std::string& moduleName, const std::string& operationName, const std::string& expectedDirection);
[[noreturn]] void throw_timeout_elapsed(const std::string& moduleName);
[[noreturn]] void throw_unsupported_receiver(const std::string& moduleName, const std::string& operationName, const std::string& expectedReceiver);
[[noreturn]] void throw_unsupported_option(const std::string& moduleName, const std::string& optionName);
[[noreturn]] void throw_unsupported_string_conversion(const std::string& typeName);
[[noreturn]] void throw_unsupported_interpolation_value();
[[noreturn]] void throw_unsupported_operand(const std::string& operationName);
[[noreturn]] void throw_unsupported_destructuring_source(const std::string& patternName, const std::string& expectedSource);
[[noreturn]] void throw_unsupported_spread_source(const std::string& spreadName, const std::string& expectedSource);
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
${getCoreValueEqualityRuntimeHeaderFragment()}
value get_length(const value& input);
value array_pop(const value& input);
value array_join(const value& input, const std::vector<value>& args);
value array_includes(const value& input, const std::vector<value>& args);
value get_property(const value& input, const std::string& key);
value get_index(const value& input, const value& key);
std::string property_key_string(const value& input);
${getCoreCompositeMutationRuntimeHeaderFragment()}
value call_with_args(const value& callable, std::vector<value> args);

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
  return std::forward<Callable>(callable)(std::vector<value>{std::forward<Args>(args)...});
}

template <typename... Args>
inline value call(const value& callable, Args&&... args) {
  const auto& wrapper = std::get<callable_ptr>(callable);
  return wrapper->fn(std::vector<value>{std::forward<Args>(args)...});
}
} // namespace jayess
`;
}

export function getRuntimeCppSource(options = {}) {
  const features = options.features ?? "all";
  return `#include "jayess_runtime.hpp"

${renderRuntimeCppIncludes()}

namespace jayess {
${renderRuntimeCppFragments(features, "early")}
${getCoreControlRuntimeCppFragment()}

${getCoreValueTruthRuntimeCppFragment()}

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

${getCoreValueStringRuntimeCppFragment()}

${renderRuntimeCppFragments(features, "late")}

void throw_value(value input) {
  throw thrown_value(std::move(input));
}

value exception_to_value(const thrown_value& error) {
  return error.payload;
}

value exception_to_value(const std::exception& error) {
  return std::string(error.what());
}

[[noreturn]] void throw_invalid_handle(const std::string& moduleName, const std::string& handleName) {
  throw std::runtime_error("Jayess " + moduleName + " expected a " + handleName + " handle");
}

[[noreturn]] void throw_closed_handle(const std::string& moduleName, const std::string& handleName) {
  throw std::runtime_error("Jayess " + moduleName + " " + handleName + " handle is closed");
}

[[noreturn]] void throw_completed_handle(const std::string& moduleName, const std::string& handleName, const std::string& stateName) {
  throw std::runtime_error("Jayess " + moduleName + " " + handleName + " handle is already " + stateName);
}

[[noreturn]] void throw_wrong_direction(const std::string& moduleName, const std::string& operationName, const std::string& expectedDirection) {
  throw std::runtime_error("Jayess " + moduleName + " " + operationName + " requires a " + expectedDirection + " stream");
}

[[noreturn]] void throw_timeout_elapsed(const std::string& moduleName) {
  throw std::runtime_error("Jayess " + moduleName + " operation timed out");
}

[[noreturn]] void throw_unsupported_receiver(const std::string& moduleName, const std::string& operationName, const std::string& expectedReceiver) {
  throw std::runtime_error("Jayess " + moduleName + " " + operationName + " requires " + expectedReceiver + " receiver");
}

[[noreturn]] void throw_unsupported_option(const std::string& moduleName, const std::string& optionName) {
  throw std::runtime_error("Jayess " + moduleName + " option is unsupported: " + optionName);
}

[[noreturn]] void throw_unsupported_string_conversion(const std::string& typeName) {
  throw std::runtime_error("Jayess string conversion does not support " + typeName);
}

[[noreturn]] void throw_unsupported_interpolation_value() {
  throw std::runtime_error("Jayess template interpolation does not support this value");
}

[[noreturn]] void throw_unsupported_operand(const std::string& operationName) {
  throw std::runtime_error("Jayess " + operationName + " operands are unsupported");
}

[[noreturn]] void throw_unsupported_destructuring_source(const std::string& patternName, const std::string& expectedSource) {
  throw std::runtime_error("Jayess " + patternName + " destructuring requires " + expectedSource);
}

[[noreturn]] void throw_unsupported_spread_source(const std::string& spreadName, const std::string& expectedSource) {
  throw std::runtime_error("Jayess " + spreadName + " spread requires " + expectedSource);
}

value add(const value& left, const value& right) {
  if (std::holds_alternative<double>(left) && std::holds_alternative<double>(right)) {
    return std::get<double>(left) + std::get<double>(right);
  }
  if (std::holds_alternative<std::string>(left) && std::holds_alternative<std::string>(right)) {
    return std::get<std::string>(left) + std::get<std::string>(right);
  }
  throw_unsupported_operand("add");
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

${getCoreValueEqualityRuntimeCppFragment()}

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
    throw_unsupported_receiver("array", "pop", "array");
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
    throw_unsupported_receiver("array", "join", "array");
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
    throw_unsupported_receiver("array", "includes", "array");
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
  if (!std::holds_alternative<object_ptr>(input)) {
    return value(std::monostate{});
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

  if (std::holds_alternative<std::string>(input)) {
    const auto& text = std::get<std::string>(input);
    const auto index = static_cast<std::size_t>(std::get<double>(key));
    if (index >= text.size()) {
      return value(std::monostate{});
    }
    return std::string(1, text[index]);
  }

  if (std::holds_alternative<object_ptr>(input) || std::holds_alternative<callable_ptr>(input)) {
    return get_property(input, property_key_string(key));
  }

  return value(std::monostate{});
}

${getCoreCompositeMutationRuntimeCppFragment()}

value call_with_args(const value& callable, std::vector<value> args) {
  const auto& wrapper = std::get<callable_ptr>(callable);
  return wrapper->fn(args);
}
} // namespace jayess
`;
}

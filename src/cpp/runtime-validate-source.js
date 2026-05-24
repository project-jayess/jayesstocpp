export function getValidateRuntimeHeaderFragment() {
  return `value validate_type_of(const value& input);`;
}

export function getValidateRuntimeCppFragment() {
  return `value validate_type_of(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return std::string("null");
  }
  if (std::holds_alternative<double>(input)) {
    return std::string("number");
  }
  if (std::holds_alternative<bool>(input)) {
    return std::string("boolean");
  }
  if (std::holds_alternative<std::string>(input)) {
    return std::string("string");
  }
  if (std::holds_alternative<array_ptr>(input)) {
    return std::string("array");
  }
  if (std::holds_alternative<object_ptr>(input)) {
    return std::string("object");
  }
  if (std::holds_alternative<callable_ptr>(input)) {
    return std::string("function");
  }
  if (std::holds_alternative<bytes_ptr>(input)) {
    return std::string("bytes");
  }
  return std::string("handle");
}`;
}

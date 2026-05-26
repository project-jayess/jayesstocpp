export function getHttpBodyRuntimeFragment() {
  return `std::string http_body_text(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return "";
  }
  if (std::holds_alternative<std::string>(input)) {
    return std::get<std::string>(input);
  }
  if (std::holds_alternative<bytes_ptr>(input)) {
    const auto bytes = std::get<bytes_ptr>(input);
    return std::string(reinterpret_cast<const char*>(bytes->items.data()), bytes->items.size());
  }
  throw std::runtime_error("Jayess http body must be a string or bytes");
}

value http_bytes_from_text(const std::string& text) {
  std::vector<unsigned char> items(text.begin(), text.end());
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}

std::string http_body_binary(const value& input) {
  return http_body_text(input);
}`;
}

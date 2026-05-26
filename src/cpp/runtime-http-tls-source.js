import { getHttpTlsBackendRuntimeFragment } from "./runtime-http-tls-backend-source.js";

export function getHttpTlsRuntimeFragment() {
  return `constexpr const char* HTTP_TLS_UNAVAILABLE_MESSAGE = "Jayess http HTTPS transport backend is not available on this host";

bool http_object_field_string_equals(const object_ptr& object, const std::string& key, const std::string& expected) {
  const auto iterator = object->fields.find(key);
  return iterator != object->fields.end()
    && std::holds_alternative<std::string>(iterator->second)
    && std::get<std::string>(iterator->second) == expected;
}

void validate_http_certificate_container(const value& input, const std::string& message) {
  if (!std::holds_alternative<object_ptr>(input) || !http_object_field_string_equals(std::get<object_ptr>(input), "kind", "certificate")) {
    throw std::runtime_error(message);
  }
}

void validate_http_private_key_container(const value& input, const std::string& message) {
  if (!std::holds_alternative<object_ptr>(input) || !http_object_field_string_equals(std::get<object_ptr>(input), "kind", "privateKey")) {
    throw std::runtime_error(message);
  }
}

void validate_http_trust_anchor_containers(const value& input, const std::string& message) {
  if (std::holds_alternative<std::monostate>(input)) {
    return;
  }
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error(message);
  }
  const auto anchors = std::get<array_ptr>(input);
  for (const auto& anchor : anchors->items) {
    validate_http_certificate_container(anchor, message);
  }
}

[[noreturn]] void throw_http_tls_alpn_unsupported() {
  throw std::runtime_error("Jayess http TLS ALPN is unsupported in the current transport slice");
}

void validate_http_alpn_protocols(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess http TLS alpnProtocols option must be an array");
  }
  throw_http_tls_alpn_unsupported();
}

void validate_http_client_tls_options(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return;
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess http request tls option must be an object");
  }
  const auto options = std::get<object_ptr>(input);
  for (const auto& [key, stored] : options->fields) {
    if (key == "trustAnchors") {
      validate_http_trust_anchor_containers(stored, "Jayess http request trustAnchors must be an array of certificate containers");
      continue;
    }
    if (key == "alpnProtocols") {
      validate_http_alpn_protocols(stored);
      continue;
    }
    throw_unsupported_option("http request tls", key);
  }
}

bool validate_http_server_tls_options(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return false;
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess http server tls option must be an object");
  }
  const auto options = std::get<object_ptr>(input);
  bool hasCertificate = false;
  bool hasPrivateKey = false;
  for (const auto& [key, stored] : options->fields) {
    if (key == "certificate") {
      validate_http_certificate_container(stored, "Jayess http server tls.certificate must be a certificate container");
      hasCertificate = true;
      continue;
    }
    if (key == "privateKey") {
      validate_http_private_key_container(stored, "Jayess http server tls.privateKey must be a private-key container");
      hasPrivateKey = true;
      continue;
    }
    if (key == "trustAnchors") {
      validate_http_trust_anchor_containers(stored, "Jayess http server tls.trustAnchors must be an array of certificate containers");
      continue;
    }
    if (key == "alpnProtocols") {
      validate_http_alpn_protocols(stored);
      continue;
    }
    throw_unsupported_option("http server tls", key);
  }
  if (!hasCertificate) {
    throw std::runtime_error("Jayess http server tls option requires certificate");
  }
  if (!hasPrivateKey) {
    throw std::runtime_error("Jayess http server tls option requires privateKey");
  }
  return true;
}

[[noreturn]] void throw_http_tls_unavailable() {
  throw std::runtime_error(HTTP_TLS_UNAVAILABLE_MESSAGE);
}

${getHttpTlsBackendRuntimeFragment()}`;
}

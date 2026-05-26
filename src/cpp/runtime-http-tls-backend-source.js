export function getHttpTlsBackendRuntimeFragment() {
  return `struct http_tls_backend_status {
  bool available = false;
  std::string adapter = "none";
  std::string unavailable_message = HTTP_TLS_UNAVAILABLE_MESSAGE;
};

http_tls_client_callback registered_http_tls_client_backend = nullptr;
void* registered_http_tls_client_user_data = nullptr;

http_tls_backend_status http_tls_client_backend_status() {
  http_tls_backend_status status;
  if (registered_http_tls_client_backend != nullptr) {
    status.available = true;
    status.adapter = "linked-host-callback";
    status.unavailable_message.clear();
  }
  return status;
}

[[noreturn]] void throw_http_tls_handshake_failed(const std::string& message) {
  throw std::runtime_error("Jayess http TLS handshake failed: " + message);
}

[[noreturn]] void throw_http_tls_verification_failed(const std::string& message) {
  throw std::runtime_error("Jayess http TLS certificate verification failed: " + message);
}

http_tls_client_request_data http_tls_request_data_from_options(const http_request_options& options, const http_url_parts& url, const std::string& requestText) {
  http_tls_client_request_data request;
  request.method = options.method;
  request.url = options.url;
  request.host = url.host;
  request.port = url.port;
  request.path = url.path;
  request.headers = options.headers;
  request.body = options.body;
  request.raw_request = requestText;
  request.timeout_milliseconds = options.timeout_milliseconds;
  request.tls_options_provided = options.tls_options_provided;
  return request;
}

value http_tls_response_object_from_data(const http_tls_client_response_data& response) {
  auto headers = std::make_shared<object_value>();
  for (const auto& [name, valueText] : response.headers) {
    headers->fields[name] = valueText;
  }
  return make_object({
    {"statusCode", static_cast<double>(response.status_code)},
    {"headers", headers},
    {"body", response.body}
  });
}

value http_tls_request_blocking(const http_request_options& options, const http_url_parts& url, const std::string& requestText) {
  const auto backend = http_tls_client_backend_status();
  if (!backend.available) {
    throw std::runtime_error(backend.unavailable_message);
  }
  http_tls_client_response_data response;
  std::string error;
  const auto ok = registered_http_tls_client_backend(
    http_tls_request_data_from_options(options, url, requestText),
    response,
    error,
    registered_http_tls_client_user_data
  );
  if (!ok) {
    const std::string verifyPrefix = "verify:";
    if (error.rfind(verifyPrefix, 0) == 0) {
      throw_http_tls_verification_failed(error.substr(verifyPrefix.size()));
    }
    throw_http_tls_handshake_failed(error.empty() ? "host adapter failed" : error);
  }
  if (response.status_code < 100 || response.status_code > 999) {
    throw_http_tls_handshake_failed("host adapter returned an invalid HTTP status code");
  }
  return http_tls_response_object_from_data(response);
}
} // namespace

void http_tls_register_client_backend(http_tls_client_callback callback, void* userData) {
  registered_http_tls_client_backend = callback;
  registered_http_tls_client_user_data = userData;
}

bool http_tls_client_backend_available() {
  return http_tls_client_backend_status().available;
}

namespace {`;
}

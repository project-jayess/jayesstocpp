export function getHttpResponseRuntimeStateFragment() {
  return `struct http_response_state {
  std::intptr_t fd = -1;
  bool ended = false;
  bool streaming = false;
  int status = 200;
  std::size_t max_body_bytes = 0;
  std::size_t streamed_body_bytes = 0;
  std::unordered_map<std::string, std::string> headers;
  std::string body;
  std::mutex mutex;
};`;
}

export function getHttpResponseRuntimePublicFragment() {
  return `bool is_http_response_value(const value& input) {
  return std::holds_alternative<http_response_ptr>(input);
}

value http_response_text(const value& response) {
  return require_http_object_string_field(response, "body", "Expected Jayess http response object with a string body");
}

value http_response_bytes(const value& response) {
  const auto body = require_http_object_string_field(response, "body", "Expected Jayess http response object with a string body");
  return http_bytes_from_text(body);
}

value http_set_status(const value& responseValue, int statusCode) {
  validate_http_status(statusCode);
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (response->streaming) {
    throw std::runtime_error("Jayess http response has already started streaming");
  }
  response->status = statusCode;
  return value(std::monostate{});
}

value http_set_header(const value& responseValue, const std::string& name, const std::string& headerValue) {
  validate_http_header(name, headerValue);
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (response->streaming) {
    throw std::runtime_error("Jayess http response has already started streaming");
  }
  response->headers[name] = headerValue;
  return value(std::monostate{});
}

value http_write_response(const value& responseValue, const value& body) {
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (response->streaming) {
    throw std::runtime_error("Jayess http response is streaming and does not support buffered write");
  }
  http_append_response_body(response, body);
  return value(std::monostate{});
}

value http_end_response(const value& responseValue, const value& body) {
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (response->streaming) {
    throw std::runtime_error("Jayess http response is streaming and must use stream end");
  }
  http_append_response_body(response, body);
  http_send_response(response);
  return value(std::monostate{});
}

value http_begin_stream_response(const value& responseValue) {
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (!response->streaming) {
    http_send_stream_response_headers(response);
    response->streaming = true;
  }
  return value(std::monostate{});
}

value http_write_stream_response(const value& responseValue, const value& body) {
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (!response->streaming) {
    http_send_stream_response_headers(response);
    response->streaming = true;
  }
  http_send_stream_chunk(response, body);
  return value(std::monostate{});
}

value http_end_stream_response(const value& responseValue) {
  const auto response = require_http_response(responseValue);
  std::lock_guard<std::mutex> lock(response->mutex);
  if (response->ended) {
    throw std::runtime_error("Jayess http response has already ended");
  }
  if (!response->streaming) {
    http_send_stream_response_headers(response);
    response->streaming = true;
  }
  http_finish_stream_response(response);
  return value(std::monostate{});
}`;
}

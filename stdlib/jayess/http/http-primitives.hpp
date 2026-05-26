#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline int jayessHttpInteger(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline std::string jayessHttpString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline jayess::value jayessHttpRequest(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_request_async(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpResponseText(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_response_text(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpResponseBytes(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_response_bytes(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpRequestMethod(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_request_method(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpRequestPath(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_request_path(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpRequestHeaders(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_request_headers(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpRequestBody(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_request_body(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpCreateServer(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_create_server(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessHttpCloseServer(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_close_server(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpServerState(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_server_state_value(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpSetStatus(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_set_status(
    jayess::argument_at(jayessArgs, 0),
    jayessHttpInteger(jayess::argument_at(jayessArgs, 1), "Jayess http setStatus expects an integer status code")
  );
}

inline jayess::value jayessHttpSetHeader(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_set_header(
    jayess::argument_at(jayessArgs, 0),
    jayessHttpString(jayess::argument_at(jayessArgs, 1), "Jayess http setHeader expects a string header name"),
    jayessHttpString(jayess::argument_at(jayessArgs, 2), "Jayess http setHeader expects a string header value")
  );
}

inline jayess::value jayessHttpWrite(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_write_response(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessHttpEnd(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_end_response(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessHttpBeginStream(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_begin_stream_response(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessHttpWriteStream(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_write_stream_response(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessHttpEndStream(const std::vector<jayess::value>& jayessArgs) {
  return jayess::http_end_stream_response(jayess::argument_at(jayessArgs, 0));
}

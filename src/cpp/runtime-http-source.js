import { getHttpRequestRuntimePublicFragment } from "./runtime-http-request-source.js";
import { getHttpResponseRuntimePublicFragment, getHttpResponseRuntimeStateFragment } from "./runtime-http-response-source.js";
import { getHttpServerRuntimePublicFragment, getHttpServerRuntimeStateFragment } from "./runtime-http-server-source.js";
import { getHttpBodyRuntimeFragment } from "./runtime-http-body-source.js";
import { getHttpClientRuntimeFragment } from "./runtime-http-client-source.js";
import { getHttpConfigRuntimeFragment } from "./runtime-http-config-source.js";
import { getHttpTlsRuntimeFragment } from "./runtime-http-tls-source.js";

export function getHttpRuntimeHeaderFragment() {
  return `struct http_server_state;
struct http_response_state;
struct http_tls_client_request_data {
  std::string method;
  std::string url;
  std::string host;
  int port = 443;
  std::string path;
  std::unordered_map<std::string, std::string> headers;
  std::string body;
  std::string raw_request;
  int timeout_milliseconds = -1;
  bool tls_options_provided = false;
};
struct http_tls_client_response_data {
  int status_code = 0;
  std::unordered_map<std::string, std::string> headers;
  std::string body;
};
using http_tls_client_callback = bool (*)(const http_tls_client_request_data& request, http_tls_client_response_data& response, std::string& error, void* userData);
void http_tls_register_client_backend(http_tls_client_callback callback, void* userData);
bool http_tls_client_backend_available();
value http_request_async(const value& options);
value http_response_text(const value& response);
value http_response_bytes(const value& response);
value http_request_method(const value& request);
value http_request_path(const value& request);
value http_request_headers(const value& request);
value http_request_body(const value& request);
value http_create_server(const value& handler, const value& options);
value http_close_server(const value& server);
value http_server_state_value(const value& server);
value http_set_status(const value& response, int statusCode);
value http_set_header(const value& response, const std::string& name, const std::string& headerValue);
value http_write_response(const value& response, const value& body);
value http_end_response(const value& response, const value& body);
value http_begin_stream_response(const value& response);
value http_write_stream_response(const value& response, const value& body);
value http_end_stream_response(const value& response);
bool is_http_server_value(const value& input);
bool is_http_response_value(const value& input);`;
}

export function getHttpRuntimeCppFragment() {
  return `${getHttpServerRuntimeStateFragment()}

${getHttpResponseRuntimeStateFragment()}

namespace {
${getHttpConfigRuntimeFragment()}

${getHttpTlsRuntimeFragment()}

${getHttpBodyRuntimeFragment()}

struct http_client_request_error : std::runtime_error {
  int status_code;

  http_client_request_error(int statusCode, const std::string& message)
      : std::runtime_error(message), status_code(statusCode) {}
};

struct http_parsed_request_head {
  std::string method;
  std::string path;
  object_ptr headers;
  std::size_t content_length = 0;
};

[[noreturn]] void throw_http_client_request_error(int statusCode, const std::string& message) {
  throw http_client_request_error(statusCode, message);
}

[[noreturn]] void throw_http_response_limit_error(const std::string& message) {
  throw http_client_request_error(500, message);
}

bool is_http_recv_timeout_error() {
#ifdef _WIN32
  const auto errorCode = ::WSAGetLastError();
  return errorCode == WSAETIMEDOUT || errorCode == WSAEWOULDBLOCK;
#else
  return errno == EAGAIN || errno == EWOULDBLOCK;
#endif
}

std::string require_http_string(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

int require_http_integer(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

http_response_ptr require_http_response(const value& input) {
  if (!std::holds_alternative<http_response_ptr>(input)) {
    throw_invalid_handle("http", "response");
  }
  return std::get<http_response_ptr>(input);
}

http_server_ptr require_http_server(const value& input) {
  if (!std::holds_alternative<http_server_ptr>(input)) {
    throw_invalid_handle("http", "server");
  }
  return std::get<http_server_ptr>(input);
}

object_ptr require_http_object(const value& input, const std::string& message) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<object_ptr>(input);
}

value require_http_object_field(const value& input, const std::string& key, const std::string& message) {
  const auto object = require_http_object(input, message);
  const auto iterator = object->fields.find(key);
  if (iterator == object->fields.end()) {
    throw std::runtime_error(message);
  }
  return iterator->second;
}

std::string require_http_object_string_field(const value& input, const std::string& key, const std::string& message) {
  return require_http_string(require_http_object_field(input, key, message), message);
}

std::string trim_http_header_value(std::string valueText) {
  if (!valueText.empty() && valueText.front() == ' ') {
    valueText.erase(valueText.begin());
  }
  return valueText;
}

std::size_t parse_http_content_length(const std::string& valueText) {
  if (valueText.empty()) {
    throw_http_client_request_error(400, "Jayess http Content-Length header must not be empty");
  }
  std::size_t length = 0;
  for (char ch : valueText) {
    if (ch < '0' || ch > '9') {
      throw_http_client_request_error(400, "Jayess http Content-Length header must be a non-negative integer");
    }
    const auto digit = static_cast<std::size_t>(ch - '0');
    if (length > ((std::numeric_limits<std::size_t>::max)() - digit) / 10) {
      throw_http_client_request_error(400, "Jayess http Content-Length header is too large");
    }
    length = length * 10 + digit;
  }
  return length;
}

std::size_t require_http_size_limit(const value& input, const std::string& message) {
  const auto numeric = require_http_integer(input, message);
  if (numeric <= 0) {
    throw std::runtime_error(message);
  }
  return static_cast<std::size_t>(numeric);
}

int require_http_positive_milliseconds(const value& input, const std::string& message) {
  const auto numeric = require_http_integer(input, message);
  if (numeric <= 0) {
    throw std::runtime_error(message);
  }
  return numeric;
}

http_parsed_request_head parse_http_request_head(const std::string& headerText) {
  const auto firstLineEnd = headerText.find("\\r\\n");
  if (firstLineEnd == std::string::npos) {
    throw_http_client_request_error(400, "Jayess http request line is malformed");
  }

  const auto firstLine = headerText.substr(0, firstLineEnd);
  if (firstLine.empty()) {
    throw_http_client_request_error(400, "Jayess http request line is malformed");
  }
  if (firstLine.size() > HTTP_MAX_REQUEST_LINE_BYTES) {
    throw_http_client_request_error(400, "Jayess http request line exceeds the current limit");
  }

  http_parsed_request_head parsed;
  parsed.headers = std::make_shared<object_value>();

  std::istringstream lineStream(firstLine);
  std::string version;
  std::string extra;
  if (!(lineStream >> parsed.method >> parsed.path >> version) || (lineStream >> extra)) {
    throw_http_client_request_error(400, "Jayess http request line is malformed");
  }
  if (parsed.method.empty() || parsed.path.empty()) {
    throw_http_client_request_error(400, "Jayess http request line is malformed");
  }
  if (version != "HTTP/1.1" && version != "HTTP/1.0") {
    throw_http_client_request_error(400, "Jayess http request version is unsupported");
  }

  std::istringstream headerStream(headerText);
  std::string line;
  std::getline(headerStream, line);
  std::size_t headerCount = 0;
  while (std::getline(headerStream, line)) {
    if (!line.empty() && line.back() == '\\r') {
      line.pop_back();
    }
    if (line.empty()) {
      continue;
    }
    headerCount += 1;
    if (headerCount > HTTP_MAX_HEADER_COUNT) {
      throw_http_client_request_error(431, "Jayess http request has too many headers");
    }
    const auto colon = line.find(':');
    if (colon == std::string::npos || colon == 0) {
      throw_http_client_request_error(400, "Jayess http request headers are malformed");
    }
    const auto name = line.substr(0, colon);
    const auto valueText = trim_http_header_value(line.substr(colon + 1));
    parsed.headers->fields[name] = valueText;
    if (name == "Content-Length" || name == "content-length") {
      parsed.content_length = parse_http_content_length(valueText);
    }
  }

  return parsed;
}

void validate_http_header(const std::string& name, const std::string& valueText) {
  if (name.empty()) {
    throw std::runtime_error("Jayess http header name must not be empty");
  }
  if (name.find('\\r') != std::string::npos || name.find('\\n') != std::string::npos || valueText.find('\\r') != std::string::npos || valueText.find('\\n') != std::string::npos) {
    throw std::runtime_error("Jayess http headers must not contain line breaks");
  }
}

void validate_http_status(int statusCode) {
  if (statusCode < 100 || statusCode > 999) {
    throw std::runtime_error("Jayess http status code must be between 100 and 999");
  }
}

std::unordered_map<std::string, std::string> read_http_headers_option(const value& input) {
  std::unordered_map<std::string, std::string> headers;
  if (std::holds_alternative<std::monostate>(input)) {
    return headers;
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess http headers option must be an object");
  }
  for (const auto& [name, stored] : std::get<object_ptr>(input)->fields) {
    const auto valueText = require_http_string(stored, "Jayess http header values must be strings");
    validate_http_header(name, valueText);
    headers[name] = valueText;
  }
  return headers;
}

${getHttpClientRuntimeFragment()}

http_request_options parse_http_request_options(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess http request options must be an object");
  }
  http_request_options options;
  for (const auto& [key, stored] : std::get<object_ptr>(input)->fields) {
    if (key == "method") {
      options.method = require_http_string(stored, "Jayess http method option must be a string");
      continue;
    }
    if (key == "url") {
      options.url = require_http_string(stored, "Jayess http url option must be a string");
      continue;
    }
    if (key == "headers") {
      options.headers = read_http_headers_option(stored);
      continue;
    }
    if (key == "body") {
      options.body = http_body_text(stored);
      continue;
    }
    if (key == "timeoutMillis") {
      options.timeout_milliseconds = require_http_integer(stored, "Jayess http timeoutMillis option must be an integer");
      if (options.timeout_milliseconds < 0) {
        throw std::runtime_error("Jayess http timeoutMillis option must be non-negative");
      }
      continue;
    }
    if (key == "trustAnchors") {
      validate_http_trust_anchor_containers(stored, "Jayess http request trustAnchors must be an array of certificate containers");
      options.tls_options_provided = true;
      continue;
    }
    if (key == "alpnProtocols") {
      validate_http_alpn_protocols(stored);
      options.tls_options_provided = true;
      continue;
    }
    if (key == "tls") {
      validate_http_client_tls_options(stored);
      options.tls_options_provided = true;
      continue;
    }
    throw_unsupported_option("http request", key);
  }
  if (options.url.empty()) {
    throw std::runtime_error("Jayess http request options require a url");
  }
  return options;
}

http_server_options parse_http_server_options(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess http server options must be an object");
  }
  http_server_options options;
  for (const auto& [key, stored] : std::get<object_ptr>(input)->fields) {
    if (key == "host") {
      options.host = require_http_string(stored, "Jayess http server host option must be a string");
      continue;
    }
    if (key == "port") {
      options.port = require_http_integer(stored, "Jayess http server port option must be an integer");
      if (options.port < 0 || options.port > 65535) {
        throw std::runtime_error("Jayess http server port must be between 0 and 65535");
      }
      continue;
    }
    if (key == "backlog") {
      options.backlog = require_http_integer(stored, "Jayess http server backlog option must be an integer");
      if (options.backlog < 1) {
        throw std::runtime_error("Jayess http server backlog option must be positive");
      }
      continue;
    }
    if (key == "maxHeaderBytes") {
      options.max_header_bytes = require_http_size_limit(stored, "Jayess http server maxHeaderBytes option must be a positive integer");
      continue;
    }
    if (key == "maxBodyBytes") {
      options.max_request_body_bytes = require_http_size_limit(stored, "Jayess http server maxBodyBytes option must be a positive integer");
      continue;
    }
    if (key == "maxRequestBodyBytes") {
      options.max_request_body_bytes = require_http_size_limit(stored, "Jayess http server maxRequestBodyBytes option must be a positive integer");
      continue;
    }
    if (key == "maxResponseBodyBytes") {
      options.max_response_body_bytes = require_http_size_limit(stored, "Jayess http server maxResponseBodyBytes option must be a positive integer");
      continue;
    }
    if (key == "idleTimeoutMillis") {
      options.idle_timeout_milliseconds = require_http_positive_milliseconds(stored, "Jayess http server idleTimeoutMillis option must be a positive integer");
      continue;
    }
    if (key == "headerTimeoutMillis") {
      options.header_timeout_milliseconds = require_http_positive_milliseconds(stored, "Jayess http server headerTimeoutMillis option must be a positive integer");
      continue;
    }
    if (key == "bodyTimeoutMillis") {
      options.body_timeout_milliseconds = require_http_positive_milliseconds(stored, "Jayess http server bodyTimeoutMillis option must be a positive integer");
      continue;
    }
    if (key == "tls") {
      options.tls_enabled = validate_http_server_tls_options(stored);
      continue;
    }
    throw_unsupported_option("http server", key);
  }
  return options;
}

value http_async_result(std::function<value()> operation) {
  const auto result = make_pending_async();
  async_schedule([result, operation = std::move(operation)]() mutable {
    try {
      async_resolve(result, operation());
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
}

#ifdef _WIN32
SOCKET http_socket_from_handle(std::intptr_t fd) {
  return static_cast<SOCKET>(fd);
}

std::intptr_t http_handle_from_socket(SOCKET socket) {
  return static_cast<std::intptr_t>(socket);
}

void ensure_http_winsock_ready() {
  static std::once_flag once;
  static int startupStatus = 0;
  std::call_once(once, []() {
    WSADATA data{};
    startupStatus = ::WSAStartup(MAKEWORD(2, 2), &data);
  });
  if (startupStatus != 0) {
    throw std::runtime_error("Unable to initialize Jayess http host adapter");
  }
}
#endif

void http_close_fd(std::intptr_t& fd) {
  if (fd < 0) {
    return;
  }
#ifdef _WIN32
  ::closesocket(http_socket_from_handle(fd));
#else
  ::close(static_cast<int>(fd));
#endif
  fd = -1;
}

void http_interrupt_fd(std::intptr_t fd) {
  if (fd < 0) {
    return;
  }
#ifdef _WIN32
  ::shutdown(http_socket_from_handle(fd), SD_BOTH);
#else
  ::shutdown(static_cast<int>(fd), SHUT_RDWR);
#endif
}

addrinfo* http_resolve_address(const std::string& host, int port, int flags) {
#ifdef _WIN32
  ensure_http_winsock_ready();
#endif
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = flags;
  addrinfo* addresses = nullptr;
  const auto service = std::to_string(port);
  if (::getaddrinfo(host.c_str(), service.c_str(), &hints, &addresses) != 0 || addresses == nullptr) {
    throw std::runtime_error(flags == AI_PASSIVE ? "Unable to resolve Jayess http server host" : "Unable to resolve Jayess http host");
  }
  return addresses;
}

std::intptr_t http_connect_socket(const std::string& host, int port) {
  addrinfo* addresses = http_resolve_address(host, port, 0);
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);
  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
#ifdef _WIN32
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket == INVALID_SOCKET) {
      continue;
    }
    if (::connect(socket, current->ai_addr, static_cast<int>(current->ai_addrlen)) == 0) {
      return http_handle_from_socket(socket);
    }
    auto owned = http_handle_from_socket(socket);
#else
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket < 0) {
      continue;
    }
    if (::connect(socket, current->ai_addr, current->ai_addrlen) == 0) {
      return socket;
    }
    std::intptr_t owned = socket;
#endif
    http_close_fd(owned);
  }
  throw std::runtime_error("Unable to connect Jayess http socket");
}

std::intptr_t http_listen_socket(const http_server_options& options) {
  addrinfo* addresses = http_resolve_address(options.host, options.port, AI_PASSIVE);
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);
  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
#ifdef _WIN32
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket == INVALID_SOCKET) {
      continue;
    }
    BOOL enabled = TRUE;
    ::setsockopt(socket, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&enabled), sizeof(enabled));
    if (::bind(socket, current->ai_addr, static_cast<int>(current->ai_addrlen)) == 0 && ::listen(socket, options.backlog) == 0) {
      return http_handle_from_socket(socket);
    }
    auto owned = http_handle_from_socket(socket);
#else
    const auto socket = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socket < 0) {
      continue;
    }
    int enabled = 1;
    ::setsockopt(socket, SOL_SOCKET, SO_REUSEADDR, &enabled, sizeof(enabled));
    if (::bind(socket, current->ai_addr, current->ai_addrlen) == 0 && ::listen(socket, options.backlog) == 0) {
      return socket;
    }
    std::intptr_t owned = socket;
#endif
    http_close_fd(owned);
  }
  throw std::runtime_error("Unable to listen with Jayess http server");
}

void http_send_all(std::intptr_t fd, const std::string& text) {
  std::size_t offset = 0;
  while (offset < text.size()) {
#ifdef _WIN32
    const auto count = ::send(http_socket_from_handle(fd), text.data() + offset, static_cast<int>(text.size() - offset), 0);
#else
    const auto count = ::send(static_cast<int>(fd), text.data() + offset, text.size() - offset, 0);
#endif
    if (count <= 0) {
      throw std::runtime_error("Unable to write Jayess http socket");
    }
    offset += static_cast<std::size_t>(count);
  }
}

bool http_server_track_client(const http_server_ptr& server, std::intptr_t clientFd) {
  std::lock_guard<std::mutex> lock(server->mutex);
  if (server->closed) {
    return false;
  }
  server->active_client_fds.push_back(clientFd);
  return true;
}

void http_server_release_client(const http_server_ptr& server, std::intptr_t clientFd) {
  std::lock_guard<std::mutex> lock(server->mutex);
  for (auto iterator = server->active_client_fds.begin(); iterator != server->active_client_fds.end(); ++iterator) {
    if (*iterator == clientFd) {
      server->active_client_fds.erase(iterator);
      break;
    }
  }
  if (server->active_client_fds.empty()) {
    server->shutdown_condition.notify_all();
  }
}

void http_configure_server_client_socket(std::intptr_t fd, int timeoutMilliseconds) {
#ifdef _WIN32
  const DWORD timeout = static_cast<DWORD>(timeoutMilliseconds);
  ::setsockopt(http_socket_from_handle(fd), SOL_SOCKET, SO_RCVTIMEO, reinterpret_cast<const char*>(&timeout), sizeof(timeout));
#else
  timeval timeout{};
  timeout.tv_sec = timeoutMilliseconds / 1000;
  timeout.tv_usec = (timeoutMilliseconds % 1000) * 1000;
  ::setsockopt(static_cast<int>(fd), SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
#endif
}

int http_recv_some(std::intptr_t fd, char* buffer, std::size_t size, const std::string& timeoutMessage) {
#ifdef _WIN32
  const auto count = ::recv(http_socket_from_handle(fd), buffer, static_cast<int>(size), 0);
#else
  const auto count = ::recv(static_cast<int>(fd), buffer, size, 0);
#endif
  if (count < 0) {
    if (is_http_recv_timeout_error()) {
      throw_http_client_request_error(408, timeoutMessage);
    }
    throw std::runtime_error("Unable to read Jayess http socket");
  }
  return count;
}

std::string http_recv_until(std::intptr_t fd, const std::string& marker) {
  std::string text;
  char buffer[1024];
  while (text.find(marker) == std::string::npos) {
    const auto count = http_recv_some(fd, buffer, sizeof(buffer), "Jayess http socket read timed out");
    if (count <= 0) {
      break;
    }
    text.append(buffer, static_cast<std::size_t>(count));
  }
  return text;
}

std::string decode_http_chunked_body(const std::string& body) {
  std::string decoded;
  std::size_t offset = 0;
  for (;;) {
    const auto lineEnd = body.find("\\r\\n", offset);
    if (lineEnd == std::string::npos) {
      throw std::runtime_error("Jayess http chunked response is malformed");
    }
    auto sizeText = body.substr(offset, lineEnd - offset);
    const auto extension = sizeText.find(';');
    if (extension != std::string::npos) {
      sizeText = sizeText.substr(0, extension);
    }
    std::size_t chunkSize = 0;
    std::istringstream sizeStream(sizeText);
    sizeStream >> std::hex >> chunkSize;
    if (!sizeStream || !sizeStream.eof()) {
      throw std::runtime_error("Jayess http chunked response is malformed");
    }
    offset = lineEnd + 2;
    if (chunkSize == 0) {
      return decoded;
    }
    if (chunkSize > body.size() - offset) {
      throw std::runtime_error("Jayess http chunked response is truncated");
    }
    decoded.append(body, offset, chunkSize);
    offset += chunkSize;
    if (body.substr(offset, 2) != "\\r\\n") {
      throw std::runtime_error("Jayess http chunked response is malformed");
    }
    offset += 2;
  }
}

std::string http_recv_request_head(std::intptr_t fd, std::size_t maxHeaderBytes, int idleTimeoutMilliseconds, int headerTimeoutMilliseconds) {
  std::string text;
  char buffer[1024];
  while (text.find("\\r\\n\\r\\n") == std::string::npos) {
    http_configure_server_client_socket(fd, text.empty() ? idleTimeoutMilliseconds : headerTimeoutMilliseconds);
    const auto count = http_recv_some(fd, buffer, sizeof(buffer), text.empty() ? "Jayess http request idle timed out" : "Jayess http request headers timed out");
    if (count <= 0) {
      break;
    }
    text.append(buffer, static_cast<std::size_t>(count));
    if (text.size() > maxHeaderBytes + 4) {
      throw_http_client_request_error(431, "Jayess http request headers exceed the current limit");
    }
  }
  if (text.find("\\r\\n\\r\\n") == std::string::npos) {
    throw_http_client_request_error(400, "Jayess http request headers are incomplete");
  }
  return text;
}

value http_response_object_from_text(const std::string& text) {
  const auto headerEnd = text.find("\\r\\n\\r\\n");
  const auto headerText = headerEnd == std::string::npos ? text : text.substr(0, headerEnd);
  const auto body = headerEnd == std::string::npos ? std::string("") : text.substr(headerEnd + 4);
  std::istringstream stream(headerText);
  std::string statusLine;
  std::getline(stream, statusLine);
  if (!statusLine.empty() && statusLine.back() == '\\r') {
    statusLine.pop_back();
  }
  int statusCode = 0;
  std::istringstream statusStream(statusLine);
  std::string httpVersion;
  statusStream >> httpVersion >> statusCode;

  auto headers = std::make_shared<object_value>();
  std::string line;
  while (std::getline(stream, line)) {
    if (!line.empty() && line.back() == '\\r') {
      line.pop_back();
    }
    const auto colon = line.find(':');
    if (colon != std::string::npos) {
      auto valueText = line.substr(colon + 1);
      if (!valueText.empty() && valueText.front() == ' ') {
        valueText.erase(valueText.begin());
      }
      headers->fields[line.substr(0, colon)] = valueText;
    }
  }
  const auto transferEncoding = headers->fields.find("Transfer-Encoding");
  const auto normalizedBody = transferEncoding != headers->fields.end()
      && std::holds_alternative<std::string>(transferEncoding->second)
      && std::get<std::string>(transferEncoding->second) == "chunked"
    ? decode_http_chunked_body(body)
    : body;
  return make_object({
    {"statusCode", static_cast<double>(statusCode)},
    {"headers", headers},
    {"body", normalizedBody}
  });
}

value http_request_blocking(const value& optionsValue) {
  const auto options = parse_http_request_options(optionsValue);
  const auto url = parse_http_url(options.url);
  if (url.tls || options.tls_options_provided) {
    return http_tls_request_blocking(options, url, http_format_request(options, url));
  }
  auto fd = http_connect_socket(url.host, url.port);
  try {
    http_send_all(fd, http_format_request(options, url));
    const auto response = http_recv_until(fd, "\\r\\n\\r\\n");
    std::string bodyResponse = response;
    char buffer[1024];
    for (;;) {
#ifdef _WIN32
      const auto count = ::recv(http_socket_from_handle(fd), buffer, sizeof(buffer), 0);
#else
      const auto count = ::recv(static_cast<int>(fd), buffer, sizeof(buffer), 0);
#endif
      if (count <= 0) {
        break;
      }
      bodyResponse.append(buffer, static_cast<std::size_t>(count));
    }
    http_close_fd(fd);
    return http_response_object_from_text(bodyResponse);
  } catch (...) {
    http_close_fd(fd);
    throw;
  }
}

value http_request_object_from_text(const std::string& text) {
  const auto headerEnd = text.find("\\r\\n\\r\\n");
  if (headerEnd == std::string::npos) {
    throw_http_client_request_error(400, "Jayess http request headers are incomplete");
  }
  const auto headerText = text.substr(0, headerEnd);
  const auto body = headerEnd == std::string::npos ? std::string("") : text.substr(headerEnd + 4);
  const auto parsed = parse_http_request_head(headerText);

  return make_object({
    {"method", parsed.method},
    {"path", parsed.path},
    {"headers", parsed.headers},
    {"body", body}
  });
}

std::string http_recv_request(std::intptr_t fd, const http_server_ptr& server) {
  std::string requestText = http_recv_request_head(
    fd,
    server->max_header_bytes,
    server->idle_timeout_milliseconds,
    server->header_timeout_milliseconds
  );
  const auto headerEnd = requestText.find("\\r\\n\\r\\n");
  const auto headerText = requestText.substr(0, headerEnd);
  const auto parsed = parse_http_request_head(headerText);
  const auto contentLength = parsed.content_length;
  if (contentLength > server->max_request_body_bytes) {
    throw_http_client_request_error(413, "Jayess http request body exceeded maxRequestBodyBytes");
  }
  const auto bodyStart = headerEnd + 4;
  if (contentLength > (std::numeric_limits<std::size_t>::max)() - bodyStart) {
    throw_http_client_request_error(400, "Jayess http request body size is invalid");
  }
  while (requestText.size() - bodyStart < contentLength) {
    char buffer[1024];
    http_configure_server_client_socket(fd, server->body_timeout_milliseconds);
    const auto count = http_recv_some(fd, buffer, sizeof(buffer), "Jayess http request body timed out");
    if (count <= 0) {
      break;
    }
    requestText.append(buffer, static_cast<std::size_t>(count));
  }
  if (requestText.size() - bodyStart > contentLength) {
    throw_http_client_request_error(400, "Jayess http pipelined requests are not supported");
  }
  return requestText;
}

void http_send_client_error(std::intptr_t clientFd, int statusCode, const std::string& message) {
  std::ostringstream output;
  output << "HTTP/1.1 " << statusCode << " Error\\r\\n";
  output << "Content-Type: text/plain\\r\\n";
  output << "Content-Length: " << message.size() << "\\r\\n";
  output << "Connection: close\\r\\n\\r\\n";
  output << message;
  try {
    http_send_all(clientFd, output.str());
  } catch (...) {
  }
  http_close_fd(clientFd);
}

void http_append_response_body(const http_response_ptr& response, const value& body) {
  const auto binary = http_body_binary(body);
  if (binary.size() > (std::numeric_limits<std::size_t>::max)() - response->body.size()) {
    throw_http_response_limit_error("Jayess http response body exceeded maxResponseBodyBytes");
  }
  const auto combinedSize = response->body.size() + binary.size();
  if (combinedSize > response->max_body_bytes) {
    throw_http_response_limit_error("Jayess http response body exceeded maxResponseBodyBytes");
  }
  response->body += binary;
}

void http_send_stream_response_headers(const http_response_ptr& response) {
  std::ostringstream output;
  output << "HTTP/1.1 " << response->status << " OK\\r\\n";
  response->headers.erase("Content-Length");
  response->headers["Transfer-Encoding"] = "chunked";
  response->headers["Connection"] = "close";
  for (const auto& [name, valueText] : response->headers) {
    output << name << ": " << valueText << "\\r\\n";
  }
  output << "\\r\\n";
  http_send_all(response->fd, output.str());
}

void http_send_stream_chunk(const http_response_ptr& response, const value& body) {
  const auto binary = http_body_binary(body);
  if (binary.size() > (std::numeric_limits<std::size_t>::max)() - response->streamed_body_bytes) {
    throw_http_response_limit_error("Jayess http response body exceeded maxResponseBodyBytes");
  }
  const auto totalSize = response->streamed_body_bytes + binary.size();
  if (totalSize > response->max_body_bytes) {
    throw_http_response_limit_error("Jayess http response body exceeded maxResponseBodyBytes");
  }
  if (!binary.empty()) {
    std::ostringstream output;
    output << std::hex << binary.size() << "\\r\\n";
    output.write(binary.data(), static_cast<std::streamsize>(binary.size()));
    output << "\\r\\n";
    http_send_all(response->fd, output.str());
  }
  response->streamed_body_bytes = totalSize;
}

void http_finish_stream_response(const http_response_ptr& response) {
  http_send_all(response->fd, "0\\r\\n\\r\\n");
  http_close_fd(response->fd);
  response->ended = true;
}

void http_send_response(const http_response_ptr& response) {
  std::ostringstream output;
  output << "HTTP/1.1 " << response->status << " OK\\r\\n";
  response->headers["Content-Length"] = std::to_string(response->body.size());
  response->headers["Connection"] = "close";
  for (const auto& [name, valueText] : response->headers) {
    output << name << ": " << valueText << "\\r\\n";
  }
  output << "\\r\\n" << response->body;
  http_send_all(response->fd, output.str());
  http_close_fd(response->fd);
  response->ended = true;
}

void http_accept_once(const http_server_ptr& server, std::intptr_t clientFd, value handler) {
  if (clientFd < 0) {
    return;
  }
  auto response = std::make_shared<http_response_state>();
  response->fd = clientFd;
  response->max_body_bytes = server->max_response_body_bytes;
  try {
    const auto requestText = http_recv_request(clientFd, server);
    const auto produced = call(handler, http_request_object_from_text(requestText), value(response));
    if (is_async(produced)) {
      await_sync(produced);
    }
    if (!response->ended) {
      if (response->streaming) {
        http_finish_stream_response(response);
      } else {
        http_send_response(response);
      }
    }
  } catch (const http_client_request_error& error) {
    if (response->streaming) {
      std::intptr_t ownedClientFd = clientFd;
      http_close_fd(ownedClientFd);
      response->ended = true;
    } else {
      http_send_client_error(clientFd, error.status_code, error.what());
      response->ended = true;
    }
  } catch (...) {
    if (!response->ended) {
      std::intptr_t ownedClientFd = clientFd;
      http_close_fd(ownedClientFd);
      response->ended = true;
    }
  }
  http_server_release_client(server, clientFd);
}

void http_accept_loop(http_server_ptr server, value handler) {
  auto markExitedUnlocked = [&]() {
    std::lock_guard<std::mutex> lock(server->mutex);
    server->accept_loop_exited = true;
    server->shutdown_condition.notify_all();
  };
  for (;;) {
    std::intptr_t serverFd = -1;
    {
      std::lock_guard<std::mutex> lock(server->mutex);
      if (server->closed || server->fd < 0) {
        server->accept_loop_exited = true;
        server->shutdown_condition.notify_all();
        return;
      }
      serverFd = server->fd;
    }

#ifdef _WIN32
    const auto acceptedSocket = ::accept(http_socket_from_handle(serverFd), nullptr, nullptr);
    const auto clientFd = acceptedSocket == INVALID_SOCKET ? static_cast<std::intptr_t>(-1) : http_handle_from_socket(acceptedSocket);
#else
    const auto clientFd = static_cast<std::intptr_t>(::accept(static_cast<int>(serverFd), nullptr, nullptr));
#endif
    if (clientFd < 0) {
      std::lock_guard<std::mutex> lock(server->mutex);
      if (server->closed || server->fd < 0) {
        server->accept_loop_exited = true;
        server->shutdown_condition.notify_all();
        return;
      }
      continue;
    }
    if (!http_server_track_client(server, clientFd)) {
      std::intptr_t ownedClientFd = clientFd;
      http_close_fd(ownedClientFd);
      markExitedUnlocked();
      return;
    }
    http_configure_server_client_socket(clientFd, server->idle_timeout_milliseconds);
    http_accept_once(server, clientFd, handler);
  }
}
} // namespace

value http_request_async(const value& options) {
  return http_async_result([options]() -> value {
    return http_request_blocking(options);
  });
}

${getHttpRequestRuntimePublicFragment()}

${getHttpResponseRuntimePublicFragment()}

${getHttpServerRuntimePublicFragment()}`;
}

import { getHttpRequestRuntimePublicFragment } from "./runtime-http-request-source.js";
import { getHttpResponseRuntimePublicFragment, getHttpResponseRuntimeStateFragment } from "./runtime-http-response-source.js";
import { getHttpServerRuntimePublicFragment, getHttpServerRuntimeStateFragment } from "./runtime-http-server-source.js";

export function getHttpRuntimeHeaderFragment() {
  return `struct http_server_state;
struct http_response_state;
value http_request_async(const value& options);
value http_response_text(const value& response);
value http_response_bytes(const value& response);
value http_request_method(const value& request);
value http_request_path(const value& request);
value http_request_headers(const value& request);
value http_request_body(const value& request);
value http_create_server(const value& handler, const value& options);
value http_close_server(const value& server);
value http_set_status(const value& response, int statusCode);
value http_set_header(const value& response, const std::string& name, const std::string& headerValue);
value http_write_response(const value& response, const value& body);
value http_end_response(const value& response, const value& body);
bool is_http_server_value(const value& input);
bool is_http_response_value(const value& input);`;
}

export function getHttpRuntimeCppFragment() {
  return `${getHttpServerRuntimeStateFragment()}

${getHttpResponseRuntimeStateFragment()}

namespace {
struct http_url_parts {
  std::string host;
  int port = 80;
  std::string path = "/";
};

struct http_request_options {
  std::string method = "GET";
  std::string url;
  std::unordered_map<std::string, std::string> headers;
  std::string body;
  int timeout_milliseconds = -1;
};

struct http_server_options {
  std::string host = "127.0.0.1";
  int port = 0;
  int backlog = 16;
};

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

std::string http_body_text(const value& input) {
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

http_url_parts parse_http_url(const std::string& url) {
  const std::string prefix = "http://";
  if (url.rfind(prefix, 0) != 0) {
    throw std::runtime_error("Jayess http request supports only http:// URLs");
  }
  const auto hostStart = prefix.size();
  const auto pathStart = url.find('/', hostStart);
  const auto hostPort = url.substr(hostStart, pathStart == std::string::npos ? std::string::npos : pathStart - hostStart);
  if (hostPort.empty()) {
    throw std::runtime_error("Jayess http request URL must include a host");
  }

  http_url_parts parts;
  const auto colon = hostPort.find(':');
  if (colon == std::string::npos) {
    parts.host = hostPort;
  } else {
    parts.host = hostPort.substr(0, colon);
    const auto portText = hostPort.substr(colon + 1);
    if (portText.empty()) {
      throw std::runtime_error("Jayess http request URL has an invalid port");
    }
    parts.port = std::stoi(portText);
  }
  if (parts.port < 0 || parts.port > 65535) {
    throw std::runtime_error("Jayess http request port must be between 0 and 65535");
  }
  parts.path = pathStart == std::string::npos ? "/" : url.substr(pathStart);
  return parts;
}

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

#ifndef _WIN32
void http_close_fd(int& fd) {
  if (fd >= 0) {
    ::close(fd);
    fd = -1;
  }
}

int http_connect_socket(const std::string& host, int port) {
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  addrinfo* addresses = nullptr;
  const auto service = std::to_string(port);
  if (::getaddrinfo(host.c_str(), service.c_str(), &hints, &addresses) != 0 || addresses == nullptr) {
    throw std::runtime_error("Unable to resolve Jayess http host");
  }
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);
  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
    const auto fd = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (fd < 0) {
      continue;
    }
    if (::connect(fd, current->ai_addr, current->ai_addrlen) == 0) {
      return fd;
    }
    int owned = fd;
    http_close_fd(owned);
  }
  throw std::runtime_error("Unable to connect Jayess http socket");
}

int http_listen_socket(const http_server_options& options) {
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_PASSIVE;
  addrinfo* addresses = nullptr;
  const auto service = std::to_string(options.port);
  if (::getaddrinfo(options.host.c_str(), service.c_str(), &hints, &addresses) != 0 || addresses == nullptr) {
    throw std::runtime_error("Unable to resolve Jayess http server host");
  }
  std::unique_ptr<addrinfo, decltype(&::freeaddrinfo)> cleanup(addresses, ::freeaddrinfo);
  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
    const auto fd = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (fd < 0) {
      continue;
    }
    int enabled = 1;
    ::setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &enabled, sizeof(enabled));
    if (::bind(fd, current->ai_addr, current->ai_addrlen) == 0 && ::listen(fd, options.backlog) == 0) {
      return fd;
    }
    int owned = fd;
    http_close_fd(owned);
  }
  throw std::runtime_error("Unable to listen with Jayess http server");
}

void http_send_all(int fd, const std::string& text) {
  std::size_t offset = 0;
  while (offset < text.size()) {
    const auto count = ::send(fd, text.data() + offset, text.size() - offset, 0);
    if (count <= 0) {
      throw std::runtime_error("Unable to write Jayess http socket");
    }
    offset += static_cast<std::size_t>(count);
  }
}

std::string http_recv_until(int fd, const std::string& marker) {
  std::string text;
  char buffer[1024];
  while (text.find(marker) == std::string::npos) {
    const auto count = ::recv(fd, buffer, sizeof(buffer), 0);
    if (count <= 0) {
      break;
    }
    text.append(buffer, static_cast<std::size_t>(count));
  }
  return text;
}

std::string http_format_request(const http_request_options& options, const http_url_parts& url) {
  std::ostringstream request;
  request << options.method << " " << url.path << " HTTP/1.1\\r\\n";
  request << "Host: " << url.host << "\\r\\n";
  for (const auto& [name, valueText] : options.headers) {
    request << name << ": " << valueText << "\\r\\n";
  }
  if (!options.body.empty()) {
    request << "Content-Length: " << options.body.size() << "\\r\\n";
  }
  request << "Connection: close\\r\\n\\r\\n";
  request << options.body;
  return request.str();
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
  return make_object({
    {"statusCode", static_cast<double>(statusCode)},
    {"headers", headers},
    {"body", body}
  });
}

value http_request_blocking(const value& optionsValue) {
  const auto options = parse_http_request_options(optionsValue);
  const auto url = parse_http_url(options.url);
  auto fd = http_connect_socket(url.host, url.port);
  try {
    http_send_all(fd, http_format_request(options, url));
    const auto response = http_recv_until(fd, "\\r\\n\\r\\n");
    std::string bodyResponse = response;
    char buffer[1024];
    for (;;) {
      const auto count = ::recv(fd, buffer, sizeof(buffer), 0);
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
  const auto headerText = headerEnd == std::string::npos ? text : text.substr(0, headerEnd);
  const auto body = headerEnd == std::string::npos ? std::string("") : text.substr(headerEnd + 4);
  const auto firstLineEnd = headerText.find("\\r\\n");
  const auto firstLine = firstLineEnd == std::string::npos ? headerText : headerText.substr(0, firstLineEnd);
  std::istringstream lineStream(firstLine);
  std::string method;
  std::string path;
  lineStream >> method >> path;

  auto headers = std::make_shared<object_value>();
  std::istringstream headerStream(headerText);
  std::string line;
  std::getline(headerStream, line);
  while (std::getline(headerStream, line)) {
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

  return make_object({
    {"method", method},
    {"path", path},
    {"headers", headers},
    {"body", body}
  });
}

std::string http_recv_request(int fd) {
  std::string requestText = http_recv_until(fd, "\\r\\n\\r\\n");
  const auto headerEnd = requestText.find("\\r\\n\\r\\n");
  if (headerEnd == std::string::npos) {
    return requestText;
  }
  const auto headerText = requestText.substr(0, headerEnd);
  std::istringstream stream(headerText);
  std::string line;
  std::size_t contentLength = 0;
  while (std::getline(stream, line)) {
    if (!line.empty() && line.back() == '\\r') {
      line.pop_back();
    }
    const auto colon = line.find(':');
    if (colon == std::string::npos) {
      continue;
    }
    const auto name = line.substr(0, colon);
    auto valueText = line.substr(colon + 1);
    if (!valueText.empty() && valueText.front() == ' ') {
      valueText.erase(valueText.begin());
    }
    if (name == "Content-Length" || name == "content-length") {
      contentLength = static_cast<std::size_t>(std::stoul(valueText));
    }
  }
  const auto bodyStart = headerEnd + 4;
  while (requestText.size() - bodyStart < contentLength) {
    char buffer[1024];
    const auto count = ::recv(fd, buffer, sizeof(buffer), 0);
    if (count <= 0) {
      break;
    }
    requestText.append(buffer, static_cast<std::size_t>(count));
  }
  return requestText;
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

void http_accept_once(int clientFd, value handler) {
  if (clientFd < 0) {
    return;
  }
  try {
    const auto requestText = http_recv_request(clientFd);
    auto response = std::make_shared<http_response_state>();
    response->fd = clientFd;
    const auto produced = call(handler, http_request_object_from_text(requestText), value(response));
    if (is_async(produced)) {
      await_sync(produced);
    }
    if (!response->ended) {
      http_send_response(response);
    }
  } catch (...) {
    int ownedClientFd = clientFd;
    http_close_fd(ownedClientFd);
  }
}

void http_accept_loop(http_server_ptr server, value handler) {
  for (;;) {
    int serverFd = -1;
    {
      std::lock_guard<std::mutex> lock(server->mutex);
      if (server->closed || server->fd < 0) {
        return;
      }
      serverFd = server->fd;
    }

    const auto clientFd = ::accept(serverFd, nullptr, nullptr);
    if (clientFd < 0) {
      std::lock_guard<std::mutex> lock(server->mutex);
      if (server->closed || server->fd < 0) {
        return;
      }
      continue;
    }
    http_accept_once(clientFd, handler);
  }
}
#else
value http_request_blocking(const value&) {
  throw std::runtime_error("Jayess http is not available on this host");
}
#endif
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

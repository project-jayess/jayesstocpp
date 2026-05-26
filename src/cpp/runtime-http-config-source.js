export function getHttpConfigRuntimeFragment() {
  return `constexpr std::size_t HTTP_MAX_REQUEST_LINE_BYTES = 4096;
constexpr std::size_t HTTP_MAX_HEADER_BYTES = 16384;
constexpr std::size_t HTTP_MAX_HEADER_COUNT = 100;
constexpr int HTTP_SERVER_READ_TIMEOUT_MILLISECONDS = 5000;
constexpr int HTTP_SERVER_HEADER_TIMEOUT_MILLISECONDS = 5000;
constexpr int HTTP_SERVER_BODY_TIMEOUT_MILLISECONDS = 5000;
constexpr int HTTP_SERVER_SHUTDOWN_GRACE_MILLISECONDS = 1000;
constexpr std::size_t HTTP_DEFAULT_MAX_REQUEST_BODY_BYTES = 1024 * 1024;
constexpr std::size_t HTTP_DEFAULT_MAX_RESPONSE_BODY_BYTES = 1024 * 1024;

struct http_url_parts {
  bool tls = false;
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
  bool tls_options_provided = false;
};

struct http_server_options {
  std::string host = "127.0.0.1";
  int port = 0;
  int backlog = 16;
  std::size_t max_header_bytes = HTTP_MAX_HEADER_BYTES;
  std::size_t max_request_body_bytes = HTTP_DEFAULT_MAX_REQUEST_BODY_BYTES;
  std::size_t max_response_body_bytes = HTTP_DEFAULT_MAX_RESPONSE_BODY_BYTES;
  int idle_timeout_milliseconds = HTTP_SERVER_READ_TIMEOUT_MILLISECONDS;
  int header_timeout_milliseconds = HTTP_SERVER_HEADER_TIMEOUT_MILLISECONDS;
  int body_timeout_milliseconds = HTTP_SERVER_BODY_TIMEOUT_MILLISECONDS;
  bool tls_enabled = false;
};`;
}

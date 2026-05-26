export function getHttpClientRuntimeFragment() {
  return `http_url_parts parse_http_url(const std::string& url) {
  const std::string httpPrefix = "http://";
  const std::string httpsPrefix = "https://";
  bool tls = false;
  std::size_t hostStart = 0;
  if (url.rfind(httpPrefix, 0) == 0) {
    hostStart = httpPrefix.size();
  } else if (url.rfind(httpsPrefix, 0) == 0) {
    tls = true;
    hostStart = httpsPrefix.size();
  } else {
    throw std::runtime_error("Jayess http request supports only http:// and https:// URLs");
  }
  const auto pathStart = url.find('/', hostStart);
  const auto hostPort = url.substr(hostStart, pathStart == std::string::npos ? std::string::npos : pathStart - hostStart);
  if (hostPort.empty()) {
    throw std::runtime_error("Jayess http request URL must include a host");
  }

  http_url_parts parts;
  parts.tls = tls;
  parts.port = tls ? 443 : 80;
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
}`;
}

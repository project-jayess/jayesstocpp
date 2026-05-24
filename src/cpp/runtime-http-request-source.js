export function getHttpRequestRuntimePublicFragment() {
  return `value http_request_method(const value& request) {
  return require_http_object_string_field(request, "method", "Expected Jayess http request object with a method");
}

value http_request_path(const value& request) {
  return require_http_object_string_field(request, "path", "Expected Jayess http request object with a path");
}

value http_request_headers(const value& request) {
  return require_http_object_field(request, "headers", "Expected Jayess http request object with headers");
}

value http_request_body(const value& request) {
  return require_http_object_string_field(request, "body", "Expected Jayess http request object with a string body");
}`;
}

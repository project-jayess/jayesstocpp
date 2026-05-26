import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpMain(targetDir, { header, namespace }) {
  return `#include <chrono>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

bool host_tls_callback(
    const jayess::http_tls_client_request_data& request,
    jayess::http_tls_client_response_data& response,
    std::string& error,
    void* userData) {
  (void)userData;
  if (request.method != "GET" || request.host != "example.test" || request.port != 443 || request.path != "/") {
    error = "unexpected request shape";
    return false;
  }
  if (request.raw_request.find("Host: example.test") == std::string::npos) {
    error = "missing host header";
    return false;
  }
  if (!request.tls_options_provided) {
    error = "missing tls options";
    return false;
  }
  response.status_code = 207;
  response.headers["Content-Type"] = "text/plain";
  response.body = "secure callback";
  return true;
}

int main() {
  ${namespace}::jayess_module_init();
  const int port = 45679;
  auto handler = jayess::make_callable([](const std::vector<jayess::value>& args) -> jayess::value {
    auto request = jayess::argument_at(args, 0);
    auto response = jayess::argument_at(args, 1);
    require(std::get<std::string>(jayess::http_request_method(request)) == "POST", "http request method");
    require(std::get<std::string>(jayess::http_request_path(request)) == "/hello", "http request path");
    require(std::get<std::string>(jayess::http_request_body(request)) == "payload", "http request body");
    jayess::http_set_status(response, 202);
    jayess::http_set_header(response, "Content-Type", "text/plain");
    jayess::http_end_response(response, jayess::value(std::string("hello ") + std::get<std::string>(jayess::http_request_body(request))));
    return jayess::value(std::monostate{});
  });
  auto optionProbe = [&](const std::string& name, jayess::value stored, const std::string& expected) {
    try {
      jayess::http_create_server(handler, jayess::make_object({
        {"host", std::string("127.0.0.1")},
        {"port", 0.0},
        {name, stored}
      }));
      throw std::runtime_error("expected http server option diagnostic");
    } catch (const std::exception& error) {
      require(std::string(error.what()).find(expected) != std::string::npos, "http server option diagnostic");
    }
  };
  optionProbe("maxHeaderBytes", 0.0, "maxHeaderBytes");
  optionProbe("maxBodyBytes", -1.0, "maxBodyBytes");
  optionProbe("idleTimeoutMillis", std::string("bad"), "idleTimeoutMillis");
  optionProbe("headerTimeoutMillis", 0.0, "headerTimeoutMillis");
  optionProbe("bodyTimeoutMillis", -1.0, "bodyTimeoutMillis");
  optionProbe("unexpected", 1.0, "Unsupported option");

  try {
    ${namespace}::invalidHttpsServerCertificate(std::vector<jayess::value>{45690.0});
    throw std::runtime_error("expected https server certificate diagnostic");
  } catch (const std::exception& error) {
    require(std::string(error.what()).find("tls.certificate") != std::string::npos, "https server certificate diagnostic");
  }

  try {
    ${namespace}::httpsServerUnavailable(std::vector<jayess::value>{45691.0});
    throw std::runtime_error("expected https server unavailable diagnostic");
  } catch (const std::exception& error) {
    require(std::string(error.what()).find("HTTPS transport backend is not available") != std::string::npos, "https server unavailable diagnostic");
  }

  try {
    jayess::await_sync(${namespace}::invalidHttpsRequestTrustAnchors(std::vector<jayess::value>{}));
    throw std::runtime_error("expected https request trust anchor diagnostic");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(jayess::exception_to_value(error)).find("trustAnchors") != std::string::npos, "https request trust anchor diagnostic");
  }

  try {
    jayess::await_sync(${namespace}::httpsRequestUnavailable(std::vector<jayess::value>{}));
    throw std::runtime_error("expected https request unavailable diagnostic");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(jayess::exception_to_value(error)).find("HTTPS transport backend is not available") != std::string::npos, "https request unavailable diagnostic");
  }
  require(!jayess::http_tls_client_backend_available(), "http tls backend starts unavailable");
  jayess::http_tls_register_client_backend(host_tls_callback, nullptr);
  require(jayess::http_tls_client_backend_available(), "http tls backend becomes available");
  auto tlsResponse = jayess::await_sync(${namespace}::httpsRequestUnavailable(std::vector<jayess::value>{}));
  const auto& tlsFields = std::get<jayess::object_ptr>(tlsResponse)->fields;
  require(std::get<double>(tlsFields.at("statusCode")) == 207.0, "https callback status");
  require(std::get<std::string>(jayess::http_response_text(tlsResponse)) == "secure callback", "https callback body");

  try {
    jayess::await_sync(${namespace}::unsupportedHttpsAlpn(std::vector<jayess::value>{}));
    throw std::runtime_error("expected https ALPN unsupported diagnostic");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(jayess::exception_to_value(error)).find("TLS ALPN is unsupported") != std::string::npos, "https ALPN unsupported diagnostic");
  }

  jayess::http_create_server(handler, jayess::make_object({
    {"host", std::string("127.0.0.1")},
    {"port", static_cast<double>(port)},
    {"backlog", 4.0}
  }));
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto response = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("POST")},
    {"url", std::string("http://127.0.0.1:45679/hello")},
    {"body", std::string("payload")}
  })));
  const auto& fields = std::get<jayess::object_ptr>(response)->fields;
  require(std::get<double>(fields.at("statusCode")) == 202.0, "http status");
  require(std::get<std::string>(jayess::http_response_text(response)) == "hello payload", "http text body");
  require(std::get<jayess::bytes_ptr>(jayess::http_response_bytes(response))->items.size() == 13, "http bytes body");

  const int helperPort = 45680;
  ${namespace}::serveHelpersOnce(std::vector<jayess::value>{static_cast<double>(helperPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto helperResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45680/hello?kind=json&name=Jayess")}
  })));
  const auto& helperFields = std::get<jayess::object_ptr>(helperResponse)->fields;
  require(std::get<double>(helperFields.at("statusCode")) == 202.0, "http helper status");
  require(std::get<std::string>(jayess::http_response_text(helperResponse)).find("Jayess") != std::string::npos, "http helper json body");

  const int routerPort = 45681;
  ${namespace}::serveRouterOnce(std::vector<jayess::value>{static_cast<double>(routerPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto routedResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45681/hello?name=Router")},
    {"headers", jayess::make_object({{"Accept", std::string("application/json")}})}
  })));
  const auto& routedFields = std::get<jayess::object_ptr>(routedResponse)->fields;
  require(std::get<double>(routedFields.at("statusCode")) == 206.0, "http router status");
  require(std::get<std::string>(jayess::http_response_text(routedResponse)).find("Router") != std::string::npos, "http router json body");

  const int redirectPort = 45682;
  ${namespace}::serveRouterOnce(std::vector<jayess::value>{static_cast<double>(redirectPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto redirectResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45682/redirect")}
  })));
  const auto& redirectFields = std::get<jayess::object_ptr>(redirectResponse)->fields;
  require(std::get<double>(redirectFields.at("statusCode")) == 302.0, "http redirect status");

  const int missingPort = 45683;
  ${namespace}::serveRouterOnce(std::vector<jayess::value>{static_cast<double>(missingPort)});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto missingResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45683/missing")}
  })));
  const auto& missingFields = std::get<jayess::object_ptr>(missingResponse)->fields;
  require(std::get<double>(missingFields.at("statusCode")) == 404.0, "http missing status");

  const std::string streamPath = ${JSON.stringify(`${targetDir}/http-stream.txt`)};
  {
    std::ofstream output(streamPath, std::ios::binary);
    output << "streamed response";
  }
  const int streamPort = 45686;
  auto streamServer = ${namespace}::serveStreamOnce(std::vector<jayess::value>{
    static_cast<double>(streamPort),
    streamPath
  });
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto streamResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45686/stream")}
  })));
  const auto& streamFields = std::get<jayess::object_ptr>(streamResponse)->fields;
  require(std::get<double>(streamFields.at("statusCode")) == 208.0, "http stream status");
  require(std::get<std::string>(jayess::http_response_text(streamResponse)) == "streamed response", "http stream body");
  jayess::http_close_server(streamServer);
  try {
    jayess::http_close_server(streamServer);
    throw std::runtime_error("expected closed server diagnostic");
  } catch (const std::exception& error) {
    require(std::string(error.what()).find("server handle is closed") != std::string::npos, "http double close diagnostic");
  }

  auto matched = ${namespace}::matchRoute(std::vector<jayess::value>{
    jayess::make_object({
      {"method", std::string("POST")},
      {"path", std::string("/submit")},
      {"headers", jayess::make_object({})},
      {"body", std::string("payload")}
    })
  });
  require(std::get<std::string>(matched) == "POST /submit", "http route matching");
  auto matchedParam = ${namespace}::matchRouteParam(std::vector<jayess::value>{
    jayess::make_object({
      {"method", std::string("GET")},
      {"path", std::string("/users/42?include=true")},
      {"headers", jayess::make_object({})},
      {"body", std::string("")}
    })
  });
  require(std::get<std::string>(matchedParam) == "42", "http route param matching ignores query");
  auto bodyHelpers = ${namespace}::bodyHelperResult(std::vector<jayess::value>{
    jayess::make_object({
      {"method", std::string("POST")},
      {"path", std::string("/body")},
      {"headers", jayess::make_object({})},
      {"body", std::string("payload")}
    })
  });
  const auto& bodyItems = std::get<jayess::array_ptr>(bodyHelpers)->items;
  require(std::get<std::string>(bodyItems[0]) == "payload", "http bodyText");
  require(std::get<double>(bodyItems[1]) == 7.0, "http bodyBytes");
  require(std::get<std::string>(bodyItems[2]) == "payload", "http collectBody");
  try {
    ${namespace}::bodyTooLarge(std::vector<jayess::value>{
      jayess::make_object({
        {"method", std::string("POST")},
        {"path", std::string("/body")},
        {"headers", jayess::make_object({})},
        {"body", std::string("payload")}
      })
    });
    throw std::runtime_error("expected body size diagnostic");
  } catch (const jayess::thrown_value& error) {
    require(std::get<std::string>(jayess::exception_to_value(error)).find("exceeded maxBytes") != std::string::npos, "http body maxBytes diagnostic");
  }
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs a minimal jayess:http request/response exchange", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-main.js", "runtime-http-executable", httpMain);
});

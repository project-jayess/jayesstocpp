import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpInvalidMain(targetDir, { header, namespace }) {
  return `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>
#include "${header}"

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <netdb.h>
#include <sys/socket.h>
#include <unistd.h>
#endif

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

#ifdef _WIN32
void ensureWinsockReady() {
  static bool ready = false;
  if (!ready) {
    WSADATA data{};
    if (::WSAStartup(MAKEWORD(2, 2), &data) != 0) {
      throw std::runtime_error("winsock startup failed");
    }
    ready = true;
  }
}

void closeSocket(SOCKET socketValue) {
  ::closesocket(socketValue);
}
#else
void closeSocket(int socketValue) {
  ::close(socketValue);
}
#endif

std::string sendRawHttp(const std::string& payload) {
#ifdef _WIN32
  ensureWinsockReady();
#endif
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  addrinfo* addresses = nullptr;
  if (::getaddrinfo("127.0.0.1", "45691", &hints, &addresses) != 0 || addresses == nullptr) {
    throw std::runtime_error("resolve failed");
  }

  std::string response;
  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
#ifdef _WIN32
    SOCKET socketValue = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socketValue == INVALID_SOCKET) {
      continue;
    }
    if (::connect(socketValue, current->ai_addr, static_cast<int>(current->ai_addrlen)) != 0) {
      closeSocket(socketValue);
      continue;
    }
    if (::send(socketValue, payload.data(), static_cast<int>(payload.size()), 0) <= 0) {
      closeSocket(socketValue);
      break;
    }
    char buffer[1024];
    for (;;) {
      const auto count = ::recv(socketValue, buffer, sizeof(buffer), 0);
      if (count <= 0) {
        break;
      }
      response.append(buffer, static_cast<std::size_t>(count));
    }
    closeSocket(socketValue);
#else
    int socketValue = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socketValue < 0) {
      continue;
    }
    if (::connect(socketValue, current->ai_addr, current->ai_addrlen) != 0) {
      closeSocket(socketValue);
      continue;
    }
    if (::send(socketValue, payload.data(), payload.size(), 0) <= 0) {
      closeSocket(socketValue);
      break;
    }
    char buffer[1024];
    for (;;) {
      const auto count = ::recv(socketValue, buffer, sizeof(buffer), 0);
      if (count <= 0) {
        break;
      }
      response.append(buffer, static_cast<std::size_t>(count));
    }
    closeSocket(socketValue);
#endif
    break;
  }

  ::freeaddrinfo(addresses);
  return response;
}

int main() {
  ${namespace}::jayess_module_init();
  auto server = ${namespace}::serveProbe(std::vector<jayess::value>{45691.0});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  auto malformedLine = sendRawHttp("GET\\r\\nHost: 127.0.0.1\\r\\n\\r\\n");
  require(malformedLine.find("HTTP/1.1 400") == 0, "http malformed request line status");
  require(malformedLine.find("request line is malformed") != std::string::npos, "http malformed request line body");

  std::string tooManyHeaders = "GET / HTTP/1.1\\r\\n";
  for (int index = 0; index < 101; index += 1) {
    tooManyHeaders += "X-Test-" + std::to_string(index) + ": value\\r\\n";
  }
  tooManyHeaders += "\\r\\n";
  auto tooManyHeadersResponse = sendRawHttp(tooManyHeaders);
  require(tooManyHeadersResponse.find("HTTP/1.1 431") == 0, "http too many headers status");
  require(tooManyHeadersResponse.find("too many headers") != std::string::npos, "http too many headers body");

  std::string oversizedHeaders = "GET / HTTP/1.1\\r\\nX-Big: ";
  oversizedHeaders.append(17000, 'a');
  oversizedHeaders += "\\r\\n\\r\\n";
  auto oversizedHeadersResponse = sendRawHttp(oversizedHeaders);
  require(oversizedHeadersResponse.find("HTTP/1.1 431") == 0, "http oversized headers status");
  require(oversizedHeadersResponse.find("headers exceed the current limit") != std::string::npos, "http oversized headers body");

  auto malformedHeader = sendRawHttp("GET / HTTP/1.1\\r\\nBroken-Header\\r\\n\\r\\n");
  require(malformedHeader.find("HTTP/1.1 400") == 0, "http malformed header status");
  require(malformedHeader.find("headers are malformed") != std::string::npos, "http malformed header body");

  auto validResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45691/")}
  })));
  const auto& validFields = std::get<jayess::object_ptr>(validResponse)->fields;
  require(std::get<double>(validFields.at("statusCode")) == 200.0, "http valid request survives invalid probes");
  require(std::get<std::string>(jayess::http_response_text(validResponse)) == "ok", "http valid response body");

  jayess::http_close_server(server);
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ rejects malformed and oversized HTTP requests with explicit diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-invalid-main.js", "runtime-http-invalid-executable", httpInvalidMain);
});

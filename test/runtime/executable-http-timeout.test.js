import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpTimeoutMain(targetDir, { header, namespace }) {
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

using raw_socket = SOCKET;

void closeSocket(raw_socket socketValue) {
  ::closesocket(socketValue);
}
#else
using raw_socket = int;

void closeSocket(raw_socket socketValue) {
  ::close(socketValue);
}
#endif

raw_socket connectRaw() {
#ifdef _WIN32
  ensureWinsockReady();
#endif
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  addrinfo* addresses = nullptr;
  if (::getaddrinfo("127.0.0.1", "45692", &hints, &addresses) != 0 || addresses == nullptr) {
    throw std::runtime_error("resolve failed");
  }

  for (addrinfo* current = addresses; current != nullptr; current = current->ai_next) {
#ifdef _WIN32
    raw_socket socketValue = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socketValue == INVALID_SOCKET) {
      continue;
    }
    if (::connect(socketValue, current->ai_addr, static_cast<int>(current->ai_addrlen)) == 0) {
      ::freeaddrinfo(addresses);
      return socketValue;
    }
#else
    raw_socket socketValue = ::socket(current->ai_family, current->ai_socktype, current->ai_protocol);
    if (socketValue < 0) {
      continue;
    }
    if (::connect(socketValue, current->ai_addr, current->ai_addrlen) == 0) {
      ::freeaddrinfo(addresses);
      return socketValue;
    }
#endif
    closeSocket(socketValue);
  }

  ::freeaddrinfo(addresses);
  throw std::runtime_error("connect failed");
}

void sendAll(raw_socket socketValue, const std::string& payload) {
  std::size_t offset = 0;
  while (offset < payload.size()) {
#ifdef _WIN32
    const auto count = ::send(socketValue, payload.data() + offset, static_cast<int>(payload.size() - offset), 0);
#else
    const auto count = ::send(socketValue, payload.data() + offset, payload.size() - offset, 0);
#endif
    if (count <= 0) {
      throw std::runtime_error("send failed");
    }
    offset += static_cast<std::size_t>(count);
  }
}

std::string recvAll(raw_socket socketValue) {
  std::string response;
  char buffer[1024];
  for (;;) {
#ifdef _WIN32
    const auto count = ::recv(socketValue, buffer, sizeof(buffer), 0);
#else
    const auto count = ::recv(socketValue, buffer, sizeof(buffer), 0);
#endif
    if (count <= 0) {
      break;
    }
    response.append(buffer, static_cast<std::size_t>(count));
  }
  return response;
}

std::string idleTimeoutResponse() {
  auto socketValue = connectRaw();
  std::this_thread::sleep_for(std::chrono::milliseconds(5500));
  auto response = recvAll(socketValue);
  closeSocket(socketValue);
  return response;
}

std::string partialHeaderTimeoutResponse() {
  auto socketValue = connectRaw();
  sendAll(socketValue, "GET / HTTP/1.1\\r\\nHost: 127.0.0.1");
  std::this_thread::sleep_for(std::chrono::milliseconds(5500));
  auto response = recvAll(socketValue);
  closeSocket(socketValue);
  return response;
}

std::string partialBodyTimeoutResponse() {
  auto socketValue = connectRaw();
  sendAll(socketValue, "POST / HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\nContent-Length: 5\\r\\n\\r\\nhi");
  std::this_thread::sleep_for(std::chrono::milliseconds(5500));
  auto response = recvAll(socketValue);
  closeSocket(socketValue);
  return response;
}

int main() {
  ${namespace}::jayess_module_init();
  auto server = ${namespace}::serveProbe(std::vector<jayess::value>{45692.0});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  auto idleResponse = idleTimeoutResponse();
  require(idleResponse.find("HTTP/1.1 408") == 0, "http idle timeout status");
  require(idleResponse.find("headers timed out") != std::string::npos, "http idle timeout body");

  auto partialHeaderResponse = partialHeaderTimeoutResponse();
  require(partialHeaderResponse.find("HTTP/1.1 408") == 0, "http header timeout status");
  require(partialHeaderResponse.find("headers timed out") != std::string::npos, "http header timeout body");

  auto partialBodyResponse = partialBodyTimeoutResponse();
  require(partialBodyResponse.find("HTTP/1.1 408") == 0, "http body timeout status");
  require(partialBodyResponse.find("body timed out") != std::string::npos, "http body timeout body");

  auto validResponse = jayess::await_sync(jayess::http_request_async(jayess::make_object({
    {"method", std::string("GET")},
    {"url", std::string("http://127.0.0.1:45692/")}
  })));
  const auto& validFields = std::get<jayess::object_ptr>(validResponse)->fields;
  require(std::get<double>(validFields.at("statusCode")) == 200.0, "http valid request survives timeout probes");
  require(std::get<std::string>(jayess::http_response_text(validResponse)) == "ok", "http valid timeout response body");

  jayess::http_close_server(server);
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ enforces explicit HTTP server read timeouts", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-invalid-main.js", "runtime-http-timeout-executable", httpTimeoutMain);
});

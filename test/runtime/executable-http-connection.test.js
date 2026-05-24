import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function httpConnectionMain(targetDir, { header, namespace }) {
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

std::string sendRawHttp(int port, const std::string& payload) {
#ifdef _WIN32
  ensureWinsockReady();
#endif
  addrinfo hints{};
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  addrinfo* addresses = nullptr;
  if (::getaddrinfo("127.0.0.1", std::to_string(port).c_str(), &hints, &addresses) != 0 || addresses == nullptr) {
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
#endif
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
    closeSocket(socketValue);
    break;
  }

  ::freeaddrinfo(addresses);
  return response;
}

int main() {
  ${namespace}::jayess_module_init();

  auto closeServer = ${namespace}::serveClosePolicy(std::vector<jayess::value>{45694.0});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));

  auto keepAliveResponse = sendRawHttp(45694, "GET / HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\nConnection: keep-alive\\r\\n\\r\\n");
  require(keepAliveResponse.find("HTTP/1.1 200") == 0, "http keep-alive request status");
  require(keepAliveResponse.find("Connection: close") != std::string::npos, "http keep-alive closes connection");
  require(keepAliveResponse.find("\\r\\n\\r\\nok") != std::string::npos, "http keep-alive response body");

  auto pipelinedResponse = sendRawHttp(45694,
    "GET / HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\n\\r\\n"
    "GET /two HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\n\\r\\n");
  require(pipelinedResponse.find("HTTP/1.1 400") == 0, "http pipelined request status");
  require(pipelinedResponse.find("pipelined requests are not supported") != std::string::npos, "http pipelined request body");

  jayess::http_close_server(closeServer);

  auto implicitServer = ${namespace}::serveImplicitEnd(std::vector<jayess::value>{45695.0});
  std::this_thread::sleep_for(std::chrono::milliseconds(25));
  auto implicitResponse = sendRawHttp(45695, "GET / HTTP/1.1\\r\\nHost: 127.0.0.1\\r\\n\\r\\n");
  require(implicitResponse.find("HTTP/1.1 200") == 0, "http implicit end status");
  require(implicitResponse.find("Connection: close") != std::string::npos, "http implicit end closes connection");
  require(implicitResponse.find("Content-Length: 0") != std::string::npos, "http implicit end content length");

  jayess::http_close_server(implicitServer);
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ enforces close-per-connection HTTP policy and rejects pipelining", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/http-connection-main.js", "runtime-http-connection-executable", httpConnectionMain);
});

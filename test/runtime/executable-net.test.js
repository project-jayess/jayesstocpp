import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function netMain({ header, namespace }) {
  return `#include <chrono>
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

bool isNetAdapterUnavailable(const std::exception& error) {
  return std::string(error.what()).find("Jayess net host adapter is not available") != std::string::npos;
}

int main() {
  try {
    ${namespace}::jayess_module_init();
    const int port = 45678;
    auto handler = jayess::make_callable([](const std::vector<jayess::value>& args) -> jayess::value {
      auto socket = jayess::argument_at(args, 0);
      auto payload = jayess::await_sync(jayess::net_read_async(socket));
      jayess::await_sync(jayess::net_write_async(socket, payload));
      jayess::net_close(socket);
      return jayess::value(std::monostate{});
    });

    auto server = jayess::net_listen("127.0.0.1", port, handler, jayess::make_object({{"reuseAddress", true}}));
    require(std::get<double>(jayess::net_local_port(server)) == port, "server local port");
    require(!std::get<std::string>(jayess::net_local_address(server)).empty(), "server local address");
    std::this_thread::sleep_for(std::chrono::milliseconds(25));
    auto client = jayess::await_sync(jayess::net_connect_async("127.0.0.1", port, jayess::value(std::monostate{})));
    require(std::get<double>(jayess::net_remote_port(client)) == port, "client remote port");
    require(!std::get<std::string>(jayess::net_local_address(client)).empty(), "client local address");
    require(!std::get<std::string>(jayess::net_remote_address(client)).empty(), "client remote address");
    auto bytes = jayess::bytes_from_utf8(jayess::value(std::string("ping")));
    jayess::await_sync(jayess::net_write_async(client, bytes));
    auto response = jayess::await_sync(jayess::net_read_async(client));
    require(std::get<jayess::bytes_ptr>(response)->items.size() == 4, "net response length");
    jayess::net_close(client);
    try {
      jayess::net_local_port(client);
      require(false, "closed client metadata should fail");
    } catch (const std::exception&) {
    }
    jayess::net_close(server);
    try {
      jayess::net_local_address(server);
      require(false, "closed server metadata should fail");
    } catch (const std::exception&) {
    }
    std::cout << "ok\\n";
    return 0;
  } catch (const std::exception& error) {
    if (isNetAdapterUnavailable(error)) {
      std::cout << "skip\\n";
      return 0;
    }
    throw;
  }
}
`;
}

runtimeTest("generated C++ runs a minimal jayess:net loopback exchange", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/net-main.js", "runtime-net-executable", (_targetDir, entry) => netMain(entry));
});

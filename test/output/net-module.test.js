import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile resolves built-in Jayess net module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-net-output");
  const fixture = path.resolve("test/fixtures/modules/net-main.js");
  const result = transpileFile(fixture, targetDir);

  const modulePath = generatedStdlibCppPath(targetDir, "net");
  assert.ok(result.files.some((file) => file.endsWith("net_main_js.cpp")));
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "net-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "net-primitives.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const dependencyPlan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");
  const runtimeFeatures = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_runtime_features.json"), "utf8"));

  assert.match(primitiveSource, /jayessNetConnect/);
  assert.match(primitiveSource, /jayessNetListen/);
  assert.match(primitiveSource, /jayessNetRead/);
  assert.match(primitiveSource, /jayessNetWrite/);
  assert.match(primitiveSource, /jayessNetLocalAddress/);
  assert.match(primitiveSource, /jayessNetLocalPort/);
  assert.match(primitiveSource, /jayessNetRemoteAddress/);
  assert.match(primitiveSource, /jayessNetRemotePort/);
  assert.match(primitiveSource, /jayessNetClose/);
  assert.match(runtimeHeader, /struct net_socket_state/);
  assert.match(runtimeHeader, /value net_connect_async\(const std::string& host, int port, const value& options\);/);
  assert.match(runtimeSource, /value net_listen\(const std::string& host, int port, const value& handler, const value& optionsValue\)/);
  assert.match(runtimeSource, /value net_read_async\(const value& input\)/);
  assert.match(runtimeSource, /value net_write_async\(const value& input, const value& data\)/);
  assert.match(runtimeSource, /value net_local_address\(const value& handle\)/);
  assert.match(runtimeSource, /value net_remote_port\(const value& input\)/);
  assert.match(runtimeSource, /#ifndef _WIN32/);
  assert.match(runtimeSource, /void close_fd_if_open\(net_handle_t& fd\)/);
  assert.match(runtimeSource, /#else/);
  assert.match(runtimeSource, /ensure_winsock_ready/);
  assert.match(runtimeSource, /WSAStartup/);
  assert.match(runtimeSource, /ioctlsocket/);
  assert.match(runtimeSource, /closesocket/);
  assert.match(runtimeSource, /Unable to initialize Jayess net host adapter/);
  assert.match(runtimeSource, /value net_listen_platform/);
  assert.match(runtimeSource, /value net_read_platform/);
  assert.match(runtimeSource, /value net_close_platform/);
  assert.match(moduleSource, /connectWithCancellation/);
  assert.match(moduleSource, /connectWithTimeout/);
  assert.match(moduleSource, /connectWithTimeoutAndCancellation/);
  assert.match(moduleSource, /readWithCancellation/);
  assert.match(moduleSource, /writeWithCancellation/);
  assert.match(dependencyPlan, /"source": "jayess:net"/);
  assert.match(dependencyPlan, /"source": "jayess:async"/);
  assert.ok(runtimeFeatures.fragments.includes("net"));
  assert.ok(runtimeFeatures.fragments.includes("bytes"));
  assert.ok(runtimeFeatures.fragments.includes("async-core"));
});

import fs from "node:fs";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../cpp/runtime-source.js";

export function writeRuntime(targetDirname, options = {}) {
  const runtimeDir = path.join(targetDirname, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  const runtimeHeaderPath = path.join(runtimeDir, "jayess_runtime.hpp");
  const runtimeCppPath = path.join(runtimeDir, "jayess_runtime.cpp");
  fs.writeFileSync(runtimeHeaderPath, getRuntimeHeaderSource({ features: options.features }), "utf8");
  fs.writeFileSync(runtimeCppPath, getRuntimeCppSource({ features: options.features }), "utf8");
  return [runtimeHeaderPath, runtimeCppPath];
}

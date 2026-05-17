import fs from "node:fs";
import path from "node:path";
import { getRuntimeCppSource, getRuntimeHeaderSource } from "../cpp/runtime-source.js";

export function writeRuntime(targetDirname) {
  const runtimeDir = path.join(targetDirname, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });
  const runtimeHeaderPath = path.join(runtimeDir, "jayess_runtime.hpp");
  const runtimeCppPath = path.join(runtimeDir, "jayess_runtime.cpp");
  fs.writeFileSync(runtimeHeaderPath, getRuntimeHeaderSource(), "utf8");
  fs.writeFileSync(runtimeCppPath, getRuntimeCppSource(), "utf8");
  return [runtimeHeaderPath, runtimeCppPath];
}

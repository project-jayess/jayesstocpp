import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const stem = `stdlib_jayess_${subpath}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", subpath, `${stem}.cpp`);
}

test("transpileFile emits GPU module runtime and backend boundary output", (t) => {
  const targetDir = createManagedTempDir(t, "gpu-output");
  const fixture = path.resolve("test/fixtures/modules/gpu-main.js");
  const result = transpileFile(fixture, targetDir);

  const gpuPath = generatedStdlibCppPath(targetDir, "gpu");
  const primitivePath = path.join(targetDir, "native", "gpu-primitives.hpp");
  const headerSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const cppSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const buildHints = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_build_hints.json"), "utf8"));
  const primitiveSource = fs.readFileSync(primitivePath, "utf8");
  const gpuSource = fs.readFileSync(gpuPath, "utf8");

  assert.ok(result.files.includes(gpuPath));
  assert.ok(fs.existsSync(primitivePath));
  assert.match(headerSource, /struct gpu_state/);
  assert.match(headerSource, /bool backend_available = false;/);
  assert.match(headerSource, /bool frame_open = false;/);
  assert.match(headerSource, /std::vector<std::string> commands;/);
  assert.match(headerSource, /using gpu_ptr = std::shared_ptr<gpu_state>;/);
  assert.match(headerSource, /value gpu_clear\(const value& frame, const value& color\);/);
  assert.match(cppSource, /value gpu_clear\(const value& frameValue, const value& colorValue\)/);
  assert.match(cppSource, /gpu_backend_capabilities_for/);
  assert.match(cppSource, /gpu_backend_clear_frame/);
  assert.match(cppSource, /require_gpu_frame_open/);
  assert.match(cppSource, /requires an active frame/);
  assert.match(cppSource, /Jayess GPU createTexture width must be a positive integer/);
  assert.match(cppSource, /frame->commands.push_back\("draw"\)/);
  assert.match(cppSource, /gpu_direct3d_available/);
  assert.match(cppSource, /gpu_metal_available/);
  assert.match(cppSource, /gpu_vulkan_available/);
  assert.match(cppSource, /gpu_opengl_available/);
  assert.match(cppSource, /gpu_opengl_clear_frame/);
  assert.match(cppSource, /Jayess GPU backend is not available/);
  assert.match(primitiveSource, /jayessGpuClear/);
  assert.match(gpuSource, /jayessGpuClear/);
  assert.ok(plan.modules.some((moduleRecord) => moduleRecord.dependencies.some((dependency) => dependency.source === "jayess:gpu")));
  assert.deepEqual(plan.runtimeRequirements.gpu.backends, ["direct3d", "metal", "opengl", "vulkan"]);
  assert.deepEqual(buildHints.runtimeRequirements.gpu.backends, ["direct3d", "metal", "opengl", "vulkan"]);
});

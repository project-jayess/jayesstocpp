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
  assert.match(headerSource, /struct gpu_capabilities/);
  assert.match(headerSource, /gpu_capabilities capabilities;/);
  assert.match(headerSource, /struct gpu_surface_state/);
  assert.match(headerSource, /window_ptr window = nullptr;/);
  assert.match(headerSource, /struct gpu_texture_metadata/);
  assert.match(headerSource, /std::string format;/);
  assert.match(headerSource, /struct gpu_frame_state/);
  assert.match(headerSource, /bool open = false;/);
  assert.match(headerSource, /std::vector<std::string> commands;/);
  assert.match(headerSource, /window_ptr present_window = nullptr;/);
  assert.match(headerSource, /using gpu_ptr = std::shared_ptr<gpu_state>;/);
  assert.match(headerSource, /value gpu_clear\(const value& frame, const value& color\);/);
  assert.match(headerSource, /value gpu_upload_image\(const value& texture, const value& image\);/);
  assert.match(cppSource, /value gpu_clear\(const value& frameValue, const value& colorValue\)/);
  assert.match(cppSource, /gpu_backend_capabilities_for/);
  assert.match(cppSource, /gpu_backend_clear_frame/);
  assert.match(cppSource, /gpu_present_host_frame/);
  assert.match(cppSource, /require_gpu_frame_open/);
  assert.match(cppSource, /requires an active frame/);
  assert.match(cppSource, /Jayess GPU createTexture width must be a positive integer/);
  assert.match(cppSource, /Jayess GPU uploadImage image dimensions must match the target texture/);
  assert.match(cppSource, /frame->frame\.commands.push_back\("draw"\)/);
  assert.match(cppSource, /gpu_validation_available/);
  assert.match(cppSource, /gpu_validation_clear_frame/);
  assert.match(cppSource, /gpu_direct3d_available/);
  assert.match(cppSource, /gpu_metal_available/);
  assert.match(cppSource, /gpu_vulkan_available/);
  assert.match(cppSource, /gpu_opengl_available/);
  assert.match(cppSource, /gpu_present_host_frame\(frame\)/);
  assert.match(cppSource, /gpu_opengl_clear_frame/);
  assert.match(cppSource, /pipeline backend to match the active frame backend/);
  assert.match(cppSource, /Jayess GPU backend is not available/);
  assert.match(primitiveSource, /jayessGpuClear/);
  assert.match(primitiveSource, /jayessGpuUploadImage/);
  assert.match(gpuSource, /jayessGpuClear/);
  assert.match(gpuSource, /jayessGpuUploadImage/);
  assert.ok(plan.modules.some((moduleRecord) => moduleRecord.dependencies.some((dependency) => dependency.source === "jayess:gpu")));
  assert.deepEqual(plan.runtimeRequirements.gpu.backends, ["validation", "direct3d", "metal", "opengl", "vulkan"]);
  assert.deepEqual(plan.runtimeRequirements.gpu.compiledAdaptersByPlatform, {
    windows: ["validation", "direct3d"],
    macos: ["validation", "metal"],
    linux: ["validation", "opengl", "vulkan"]
  });
  assert.deepEqual(buildHints.runtimeRequirements.gpu.backends, ["validation", "direct3d", "metal", "opengl", "vulkan"]);
  assert.deepEqual(buildHints.runtimeRequirements.gpu.compiledAdaptersByPlatform, {
    windows: ["validation", "direct3d"],
    macos: ["validation", "metal"],
    linux: ["validation", "opengl", "vulkan"]
  });
});

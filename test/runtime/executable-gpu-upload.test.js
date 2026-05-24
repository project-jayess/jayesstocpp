import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function gpuUploadMain({ header, namespace }) {
  return `#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

template <typename Callback>
std::string thrown_runtime_message(Callback&& callback) {
  try {
    callback();
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  try {
    ${namespace}::jayess_module_init();

    auto deviceValue = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("validation")}}));
    auto textureValue = jayess::gpu_create_texture(deviceValue, jayess::make_object({{"width", 2.0}, {"height", 1.0}}));
    auto texture = std::get<jayess::gpu_ptr>(textureValue);
    auto image = jayess::image_create(2.0, 1.0, jayess::make_object({
      {"red", 0.0}, {"green", 0.0}, {"blue", 0.0}, {"alpha", 1.0}
    }));
    jayess::image_set_pixel(image, 1.0, 0.0, jayess::make_object({
      {"red", 9.0}, {"green", 8.0}, {"blue", 7.0}, {"alpha", 1.0}
    }));
    auto uploaded = jayess::gpu_upload_image(textureValue, image);
    require(std::get<jayess::gpu_ptr>(uploaded) == texture, "gpu upload returns texture");
    require(texture->texture.initialized == true, "gpu texture upload initialized");
    require(texture->texture.pixels.size() == 8, "gpu texture upload pixel byte count");
    require(texture->texture.pixels.at(0) == 0, "gpu texture upload first red");
    require(texture->texture.pixels.at(4) == 9, "gpu texture upload second red");
    require(texture->texture.pixels.at(5) == 8, "gpu texture upload second green");
    require(texture->texture.pixels.at(6) == 7, "gpu texture upload second blue");
    require(texture->texture.pixels.at(7) == 255, "gpu texture upload second alpha");

    auto wrongSize = thrown_runtime_message([&]() {
      auto mismatchTexture = jayess::gpu_create_texture(deviceValue, jayess::make_object({{"width", 2.0}, {"height", 2.0}}));
      auto mismatchImage = jayess::image_create(1.0, 1.0, jayess::make_object({
        {"red", 1.0}, {"green", 2.0}, {"blue", 3.0}, {"alpha", 1.0}
      }));
      jayess::gpu_upload_image(mismatchTexture, mismatchImage);
    });
    require(wrongSize.find("dimensions must match") != std::string::npos, "gpu upload size diagnostic");

    auto wrongInput = thrown_runtime_message([&]() {
      auto wrongInputTexture = jayess::gpu_create_texture(deviceValue, jayess::make_object({{"width", 1.0}, {"height", 1.0}}));
      jayess::gpu_upload_image(wrongInputTexture, std::string("bad"));
    });
    require(wrongInput.find("image") != std::string::npos, "gpu upload image-handle diagnostic");

    std::cout << "ok\\n";
    return 0;
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      std::cerr << std::get<std::string>(payload) << "\\n";
    }
    return 2;
  } catch (const std::exception& error) {
    std::cerr << error.what() << "\\n";
    return 3;
  }
}
`;
}

runtimeTest("generated C++ runs gpu image upload through the validation backend", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/gpu-upload-main.js", "runtime-gpu-upload", (_targetDir, entry) => gpuUploadMain(entry));
});

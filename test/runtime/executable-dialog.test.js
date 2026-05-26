import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function dialogMain({ header, namespace }) {
  return `#include <iostream>
#include <cstdlib>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto converted = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(converted)) {
      return std::get<std::string>(converted);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

std::string async_rejection_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    auto pending = fn(std::vector<jayess::value>{});
    jayess::await_sync(pending);
  } catch (const jayess::thrown_value& error) {
    auto converted = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(converted)) {
      return std::get<std::string>(converted);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

std::string await_string(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  auto result = jayess::await_sync(fn(std::vector<jayess::value>{}));
  if (!std::holds_alternative<std::string>(result)) {
    throw std::runtime_error("expected string result");
  }
  return std::get<std::string>(result);
}

std::vector<std::string> await_string_array(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  auto result = jayess::await_sync(fn(std::vector<jayess::value>{}));
  if (!std::holds_alternative<jayess::array_ptr>(result)) {
    throw std::runtime_error("expected array result");
  }
  std::vector<std::string> values;
  for (const auto& item : std::get<jayess::array_ptr>(result)->items) {
    if (!std::holds_alternative<std::string>(item)) {
      throw std::runtime_error("expected string array item");
    }
    values.push_back(std::get<std::string>(item));
  }
  return values;
}

jayess::value await_value(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  return jayess::await_sync(fn(std::vector<jayess::value>{}));
}

int main() {
  ${namespace}::jayess_module_init();

  auto invalidOptions = thrown_message(${namespace}::invalidOpenFileOptions);
  require(invalidOptions.find("openFile options must be an object") != std::string::npos, "openFile options diagnostic");

  auto invalidFilters = thrown_message(${namespace}::invalidSaveFileFilters);
  require(invalidFilters.find("filter extensions must be non-empty strings") != std::string::npos, "saveFile filters diagnostic");

  auto invalidDirectory = thrown_message(${namespace}::invalidOpenDirectoryDefaultPath);
  require(invalidDirectory.find("openDirectory option 'defaultPath' must be a string") != std::string::npos, "openDirectory defaultPath diagnostic");

  auto invalidButtons = thrown_message(${namespace}::invalidMessageButtons);
  require(invalidButtons.find("message option 'buttons' must be one of") != std::string::npos, "message buttons diagnostic");

  auto invalidMultiple = thrown_message(${namespace}::invalidOpenFileMultiple);
  require(invalidMultiple.find("openFile option 'multiple' must be a boolean") != std::string::npos, "openFile multiple diagnostic");

  auto invalidOption = thrown_message(${namespace}::invalidOpenFileOption);
  require(invalidOption.find("option is unsupported") != std::string::npos, "openFile unsupported option diagnostic");

#ifdef _WIN32
  _putenv_s("JAYESS_DIALOG_TEST_OPEN_FILE", "C:\\\\temp\\\\picked.txt");
  _putenv_s("JAYESS_DIALOG_TEST_SAVE_FILE", "cancel");
  _putenv_s("JAYESS_DIALOG_TEST_OPEN_DIRECTORY", "C:\\\\temp");
  _putenv_s("JAYESS_DIALOG_TEST_MESSAGE", "yes");

  auto openFileResult = await_string(${namespace}::selectOpenFile);
  require(openFileResult == "C:\\\\temp\\\\picked.txt", "openFile normalized result");

  _putenv_s("JAYESS_DIALOG_TEST_OPEN_FILE", "C:\\\\temp\\\\a.txt;C:\\\\temp\\\\b.txt");
  auto openFilesResult = await_string_array(${namespace}::selectOpenFiles);
  require(openFilesResult.size() == 2, "openFile multiple result size");
  require(openFilesResult[0] == "C:\\\\temp\\\\a.txt", "openFile multiple first path");
  require(openFilesResult[1] == "C:\\\\temp\\\\b.txt", "openFile multiple second path");

  auto saveFileResult = await_value(${namespace}::selectSaveFile);
  require(jayess::is_null(saveFileResult), "saveFile cancellation result");

  auto directoryResult = await_string(${namespace}::selectDirectory);
  require(directoryResult == "C:\\\\temp", "openDirectory normalized result");

  auto messageResult = await_string(${namespace}::askMessage);
  require(messageResult == "yes", "message normalized result");
#elif defined(__APPLE__)
  setenv("JAYESS_DIALOG_TEST_OPEN_FILE", "/tmp/picked.txt", 1);
  setenv("JAYESS_DIALOG_TEST_SAVE_FILE", "cancel", 1);
  setenv("JAYESS_DIALOG_TEST_OPEN_DIRECTORY", "/tmp", 1);
  setenv("JAYESS_DIALOG_TEST_MESSAGE", "no", 1);

  auto openFileResult = await_string(${namespace}::selectOpenFile);
  require(openFileResult == "/tmp/picked.txt", "openFile normalized result");

  setenv("JAYESS_DIALOG_TEST_OPEN_FILE", "/tmp/a.txt;/tmp/b.txt", 1);
  auto openFilesResult = await_string_array(${namespace}::selectOpenFiles);
  require(openFilesResult.size() == 2, "openFile multiple result size");
  require(openFilesResult[0] == "/tmp/a.txt", "openFile multiple first path");
  require(openFilesResult[1] == "/tmp/b.txt", "openFile multiple second path");

  auto saveFileResult = await_value(${namespace}::selectSaveFile);
  require(jayess::is_null(saveFileResult), "saveFile cancellation result");

  auto directoryResult = await_string(${namespace}::selectDirectory);
  require(directoryResult == "/tmp", "openDirectory normalized result");

  auto messageResult = await_string(${namespace}::askMessage);
  require(messageResult == "no", "message normalized result");
#elif defined(__linux__)
  setenv("JAYESS_DIALOG_TEST_OPEN_FILE", "/tmp/picked.txt", 1);
  setenv("JAYESS_DIALOG_TEST_SAVE_FILE", "cancel", 1);
  setenv("JAYESS_DIALOG_TEST_OPEN_DIRECTORY", "/tmp", 1);
  setenv("JAYESS_DIALOG_TEST_MESSAGE", "ok", 1);

  auto openFileResult = await_string(${namespace}::selectOpenFile);
  require(openFileResult == "/tmp/picked.txt", "openFile normalized result");

  setenv("JAYESS_DIALOG_TEST_OPEN_FILE", "/tmp/a.txt;/tmp/b.txt", 1);
  auto openFilesResult = await_string_array(${namespace}::selectOpenFiles);
  require(openFilesResult.size() == 2, "openFile multiple result size");
  require(openFilesResult[0] == "/tmp/a.txt", "openFile multiple first path");
  require(openFilesResult[1] == "/tmp/b.txt", "openFile multiple second path");

  auto saveFileResult = await_value(${namespace}::selectSaveFile);
  require(jayess::is_null(saveFileResult), "saveFile cancellation result");

  auto directoryResult = await_string(${namespace}::selectDirectory);
  require(directoryResult == "/tmp", "openDirectory normalized result");

  auto messageResult = await_string(${namespace}::askMessage);
  require(messageResult == "ok", "message normalized result");
#else
  auto unavailableOpen = async_rejection_message(${namespace}::unavailableOpenFile);
  require(unavailableOpen.find("dialog host adapter is not available") != std::string::npos, "dialog unavailable openFile");

  auto unavailableMessage = async_rejection_message(${namespace}::unavailableMessage);
  require(unavailableMessage.find("dialog host adapter is not available") != std::string::npos, "dialog unavailable message");
#endif

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ validates dialog options and normalizes dialog results by host", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/dialog-main.js", "runtime-dialog", (_targetDir, entry) => dialogMain(entry));
});

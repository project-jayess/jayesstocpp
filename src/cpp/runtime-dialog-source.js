import { getDialogLinuxAdapterCppFragment } from "./runtime-dialog-linux-source.js";
import { getDialogMacosAdapterCppFragment } from "./runtime-dialog-macos-source.js";
import { getDialogWindowsAdapterCppFragment } from "./runtime-dialog-windows-source.js";

export function getDialogRuntimeHeaderFragment() {
  return `value dialog_open_file_async(const value& options);
value dialog_save_file_async(const value& options);
value dialog_open_directory_async(const value& options);
value dialog_message_async(const value& options);`;
}

export function getDialogRuntimeCppFragment() {
  return `namespace {
constexpr const char* DIALOG_UNAVAILABLE_MESSAGE = "Jayess dialog host adapter is not available on this platform";

value dialog_async_result(std::function<value()> operation) {
  const auto result = make_pending_async();
  async_schedule([result, operation = std::move(operation)]() mutable {
    try {
      async_resolve(result, operation());
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
}

[[noreturn]] void throw_dialog_unavailable() {
  throw std::runtime_error(DIALOG_UNAVAILABLE_MESSAGE);
}

object_ptr dialog_require_options_object(const value& input, const std::string& operationName) {
  if (std::holds_alternative<std::monostate>(input)) {
    return std::make_shared<object_value>();
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess dialog " + operationName + " options must be an object");
  }
  return std::get<object_ptr>(input);
}

value dialog_option_value(const object_ptr& options, const std::string& key) {
  const auto iterator = options->fields.find(key);
  if (iterator == options->fields.end()) {
    return std::monostate{};
  }
  return iterator->second;
}

std::string dialog_optional_string_option(const object_ptr& options, const std::string& key, const std::string& operationName) {
  const auto stored = dialog_option_value(options, key);
  if (std::holds_alternative<std::monostate>(stored)) {
    return "";
  }
  if (!std::holds_alternative<std::string>(stored)) {
    throw std::runtime_error("Jayess dialog " + operationName + " option '" + key + "' must be a string");
  }
  return std::get<std::string>(stored);
}

void dialog_validate_filters_option(const object_ptr& options, const std::string& operationName) {
  const auto stored = dialog_option_value(options, "filters");
  if (std::holds_alternative<std::monostate>(stored)) {
    return;
  }
  if (!std::holds_alternative<array_ptr>(stored)) {
    throw std::runtime_error("Jayess dialog " + operationName + " option 'filters' must be an array");
  }
  const auto filters = std::get<array_ptr>(stored);
  for (std::size_t index = 0; index < filters->items.size(); index += 1) {
    const auto& filter = filters->items[index];
    if (!std::holds_alternative<object_ptr>(filter)) {
      throw std::runtime_error("Jayess dialog " + operationName + " filters must contain objects");
    }
    const auto filterObject = std::get<object_ptr>(filter);
    dialog_optional_string_option(filterObject, "name", operationName + " filter");
    const auto extensions = dialog_option_value(filterObject, "extensions");
    if (!std::holds_alternative<array_ptr>(extensions)) {
      throw std::runtime_error("Jayess dialog " + operationName + " filter option 'extensions' must be an array");
    }
    const auto extensionItems = std::get<array_ptr>(extensions);
    for (const auto& extension : extensionItems->items) {
      if (!std::holds_alternative<std::string>(extension) || std::get<std::string>(extension).empty()) {
        throw std::runtime_error("Jayess dialog " + operationName + " filter extensions must be non-empty strings");
      }
    }
  }
}

void dialog_validate_buttons_option(const object_ptr& options) {
  const auto buttons = dialog_optional_string_option(options, "buttons", "message");
  if (buttons.empty()) {
    return;
  }
  if (buttons != "ok" && buttons != "okCancel" && buttons != "yesNo" && buttons != "yesNoCancel") {
    throw std::runtime_error("Jayess dialog message option 'buttons' must be one of: ok, okCancel, yesNo, yesNoCancel");
  }
}

void dialog_validate_kind_option(const object_ptr& options) {
  const auto kind = dialog_optional_string_option(options, "kind", "message");
  if (kind.empty()) {
    return;
  }
  if (kind != "info" && kind != "warning" && kind != "error" && kind != "question") {
    throw std::runtime_error("Jayess dialog message option 'kind' must be one of: info, warning, error, question");
  }
}

void dialog_validate_open_file_options(const value& optionsValue) {
  const auto options = dialog_require_options_object(optionsValue, "openFile");
  dialog_optional_string_option(options, "title", "openFile");
  dialog_optional_string_option(options, "defaultPath", "openFile");
  dialog_validate_filters_option(options, "openFile");
}

void dialog_validate_save_file_options(const value& optionsValue) {
  const auto options = dialog_require_options_object(optionsValue, "saveFile");
  dialog_optional_string_option(options, "title", "saveFile");
  dialog_optional_string_option(options, "defaultPath", "saveFile");
  dialog_validate_filters_option(options, "saveFile");
}

void dialog_validate_open_directory_options(const value& optionsValue) {
  const auto options = dialog_require_options_object(optionsValue, "openDirectory");
  dialog_optional_string_option(options, "title", "openDirectory");
  dialog_optional_string_option(options, "defaultPath", "openDirectory");
}

void dialog_validate_message_options(const value& optionsValue) {
  const auto options = dialog_require_options_object(optionsValue, "message");
  dialog_optional_string_option(options, "title", "message");
  dialog_optional_string_option(options, "message", "message");
  dialog_optional_string_option(options, "detail", "message");
  dialog_validate_kind_option(options);
  dialog_validate_buttons_option(options);
}

${getDialogWindowsAdapterCppFragment()}
${getDialogMacosAdapterCppFragment()}
${getDialogLinuxAdapterCppFragment()}

value dialog_open_file_host(const value& options) {
#if defined(_WIN32)
  if (dialog_windows_platform_available() || dialog_windows_has_override("JAYESS_DIALOG_TEST_OPEN_FILE")) {
    return dialog_windows_open_file(options);
  }
#elif defined(__APPLE__)
  if (dialog_macos_platform_available() || dialog_macos_has_override("JAYESS_DIALOG_TEST_OPEN_FILE")) {
    return dialog_macos_open_file(options);
  }
#elif defined(__linux__)
  return dialog_linux_open_file(options);
#endif
  throw_dialog_unavailable();
}

value dialog_save_file_host(const value& options) {
#if defined(_WIN32)
  if (dialog_windows_platform_available() || dialog_windows_has_override("JAYESS_DIALOG_TEST_SAVE_FILE")) {
    return dialog_windows_save_file(options);
  }
#elif defined(__APPLE__)
  if (dialog_macos_platform_available() || dialog_macos_has_override("JAYESS_DIALOG_TEST_SAVE_FILE")) {
    return dialog_macos_save_file(options);
  }
#elif defined(__linux__)
  return dialog_linux_save_file(options);
#endif
  throw_dialog_unavailable();
}

value dialog_open_directory_host(const value& options) {
#if defined(_WIN32)
  if (dialog_windows_platform_available() || dialog_windows_has_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY")) {
    return dialog_windows_open_directory(options);
  }
#elif defined(__APPLE__)
  if (dialog_macos_platform_available() || dialog_macos_has_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY")) {
    return dialog_macos_open_directory(options);
  }
#elif defined(__linux__)
  return dialog_linux_open_directory(options);
#endif
  throw_dialog_unavailable();
}

value dialog_message_host(const value& options) {
#if defined(_WIN32)
  if (dialog_windows_platform_available() || dialog_windows_has_override("JAYESS_DIALOG_TEST_MESSAGE")) {
    return dialog_windows_message(options);
  }
#elif defined(__APPLE__)
  if (dialog_macos_platform_available() || dialog_macos_has_override("JAYESS_DIALOG_TEST_MESSAGE")) {
    return dialog_macos_message(options);
  }
#elif defined(__linux__)
  return dialog_linux_message(options);
#endif
  throw_dialog_unavailable();
}
} // namespace

value dialog_open_file_async(const value& options) {
  dialog_validate_open_file_options(options);
  return dialog_async_result([options]() -> value {
    return dialog_open_file_host(options);
  });
}

value dialog_save_file_async(const value& options) {
  dialog_validate_save_file_options(options);
  return dialog_async_result([options]() -> value {
    return dialog_save_file_host(options);
  });
}

value dialog_open_directory_async(const value& options) {
  dialog_validate_open_directory_options(options);
  return dialog_async_result([options]() -> value {
    return dialog_open_directory_host(options);
  });
}

value dialog_message_async(const value& options) {
  dialog_validate_message_options(options);
  return dialog_async_result([options]() -> value {
    return dialog_message_host(options);
  });
}`;
}

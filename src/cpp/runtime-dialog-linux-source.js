export function getDialogLinuxAdapterCppFragment() {
  return `#if defined(__linux__)
constexpr const char* JAYESS_DIALOG_LINUX_PORTAL_REASON =
  "Jayess dialog Linux adapter requires the focused xdg-desktop-portal path, which is not available in this runtime slice";

bool dialog_linux_has_override(const char* name) {
  return std::getenv(name) != nullptr;
}

value dialog_linux_picker_override(const char* name, bool multiple) {
  const auto override = std::string(std::getenv(name));
  return dialog_picker_override_result(override, multiple);
}

value dialog_linux_message_override(const char* name) {
  const auto override = std::string(std::getenv(name));
  if (override == "ok" || override == "cancel" || override == "yes" || override == "no") {
    return override;
  }
  throw std::runtime_error("Jayess dialog message test override must be one of: ok, cancel, yes, no");
}

[[noreturn]] void throw_dialog_linux_unavailable() {
  throw std::runtime_error(std::string(DIALOG_UNAVAILABLE_MESSAGE) + " (" + JAYESS_DIALOG_LINUX_PORTAL_REASON + ")");
}

value dialog_linux_open_file(const value& options) {
  if (dialog_linux_has_override("JAYESS_DIALOG_TEST_OPEN_FILE")) {
    return dialog_linux_picker_override("JAYESS_DIALOG_TEST_OPEN_FILE", dialog_open_file_multiple_option(options));
  }
  throw_dialog_linux_unavailable();
}

value dialog_linux_save_file(const value&) {
  if (dialog_linux_has_override("JAYESS_DIALOG_TEST_SAVE_FILE")) {
    return dialog_linux_picker_override("JAYESS_DIALOG_TEST_SAVE_FILE", false);
  }
  throw_dialog_linux_unavailable();
}

value dialog_linux_open_directory(const value&) {
  if (dialog_linux_has_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY")) {
    return dialog_linux_picker_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY", false);
  }
  throw_dialog_linux_unavailable();
}

value dialog_linux_message(const value&) {
  if (dialog_linux_has_override("JAYESS_DIALOG_TEST_MESSAGE")) {
    return dialog_linux_message_override("JAYESS_DIALOG_TEST_MESSAGE");
  }
  throw_dialog_linux_unavailable();
}
#endif`;
}

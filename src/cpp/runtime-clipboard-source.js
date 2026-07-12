import { getClipboardLinuxAdapterCppFragment } from "./runtime-clipboard-linux-source.js";
import { getClipboardMacosAdapterCppFragment } from "./runtime-clipboard-macos-source.js";
import { getClipboardWindowsAdapterCppFragment } from "./runtime-clipboard-windows-source.js";

export function getClipboardRuntimeHeaderFragment() {
  return `value clipboard_read_text();
value clipboard_write_text(const value& text);
value clipboard_clear();`;
}

export function getClipboardRuntimeCppFragment() {
  return `namespace {
[[noreturn]] void throw_clipboard_unavailable();

${getClipboardWindowsAdapterCppFragment()}
${getClipboardMacosAdapterCppFragment()}
${getClipboardLinuxAdapterCppFragment()}

[[noreturn]] void throw_clipboard_unavailable() {
  throw std::runtime_error("Jayess clipboard host adapter is not available on this platform");
}
} // namespace

value clipboard_read_text() {
  if (!clipboard_platform_available()) {
    throw_clipboard_unavailable();
  }
  return clipboard_platform_read_text();
}

value clipboard_write_text(const value& textValue) {
  if (!std::holds_alternative<std::string>(textValue)) {
    throw std::runtime_error("Jayess clipboard writeText expects a string");
  }
  if (!clipboard_platform_available()) {
    throw_clipboard_unavailable();
  }
  return clipboard_platform_write_text(std::get<std::string>(textValue));
}

value clipboard_clear() {
  if (!clipboard_platform_available()) {
    throw_clipboard_unavailable();
  }
  return clipboard_platform_clear();
}`;
}

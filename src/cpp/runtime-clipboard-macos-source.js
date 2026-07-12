export function getClipboardMacosAdapterCppFragment() {
  return `#if defined(__APPLE__)
bool clipboard_platform_available() {
  return false;
}

std::string clipboard_platform_read_text() {
  throw_clipboard_unavailable();
}

bool clipboard_platform_write_text(const std::string&) {
  throw_clipboard_unavailable();
}

bool clipboard_platform_clear() {
  throw_clipboard_unavailable();
}
#endif`;
}

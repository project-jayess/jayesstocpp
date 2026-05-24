export function getClipboardWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
bool clipboard_platform_available() {
  return false;
}
#endif`;
}

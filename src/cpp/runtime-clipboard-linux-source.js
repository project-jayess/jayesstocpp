export function getClipboardLinuxAdapterCppFragment() {
  return `#if !defined(_WIN32) && !defined(__APPLE__)
bool clipboard_platform_available() {
  return false;
}
#endif`;
}

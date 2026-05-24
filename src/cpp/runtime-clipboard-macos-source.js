export function getClipboardMacosAdapterCppFragment() {
  return `#if defined(__APPLE__)
bool clipboard_platform_available() {
  return false;
}
#endif`;
}

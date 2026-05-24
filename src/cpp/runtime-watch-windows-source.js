export function getWatchWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
std::string watch_platform_name() {
  return "windows";
}
#endif`;
}

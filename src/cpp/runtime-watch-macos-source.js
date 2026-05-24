export function getWatchMacosAdapterCppFragment() {
  return `#if defined(__APPLE__)
std::string watch_platform_name() {
  return "macos";
}
#endif`;
}

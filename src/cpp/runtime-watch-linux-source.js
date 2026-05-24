export function getWatchLinuxAdapterCppFragment() {
  return `#if defined(__linux__)
std::string watch_platform_name() {
  return "linux";
}
#endif`;
}

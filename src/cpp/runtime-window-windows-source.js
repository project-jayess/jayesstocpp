export function getWindowWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
bool window_platform_available() {
  return false;
}

void window_platform_create(const window_ptr&) {
  throw_window_unavailable();
}

void window_platform_show(const window_ptr&) {
  throw_window_unavailable();
}

void window_platform_close(const window_ptr&) {
}

void window_platform_set_title(const window_ptr&) {
  throw_window_unavailable();
}

void window_platform_present(const window_ptr&, const window_canvas_pixels&) {
  throw_window_unavailable();
}

void window_platform_poll_events(const window_ptr&) {
}
#endif`;
}

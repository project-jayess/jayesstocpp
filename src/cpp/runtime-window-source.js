import { getWindowLinuxAdapterCppFragment } from "./runtime-window-linux-source.js";
import { getWindowMacosAdapterCppFragment } from "./runtime-window-macos-source.js";
import { getWindowWindowsAdapterCppFragment } from "./runtime-window-windows-source.js";

export function getWindowRuntimeHeaderFragment() {
  return `struct window_state {
  int width = 0;
  int height = 0;
  std::string title;
  bool closed = false;
  bool close_requested = false;
  bool shown = false;
  std::string adapter;
  void* host_display = nullptr;
  unsigned long host_window = 0;
  unsigned long host_close_atom = 0;
  int presented_width = 0;
  int presented_height = 0;
  std::vector<value> events;
};

value window_create(const value& options);
value window_show(const value& window);
value window_close(const value& window);
value window_should_close(const value& window);
value window_request_close(const value& window);
value window_poll_events(const value& window);
value window_present(const value& window, const value& canvas);
value window_width(const value& window);
value window_height(const value& window);
value window_set_title(const value& window, const value& title);`;
}

export function getWindowRuntimeCppFragment() {
  return `namespace {
[[noreturn]] void throw_window_unavailable(const char* detail = nullptr);
[[noreturn]] void throw_window_adapter_unavailable(const char* adapter, const char* detail = nullptr);

struct window_canvas_pixels {
  image_ptr image;
  int width = 0;
  int height = 0;
  const std::vector<unsigned char>* pixels = nullptr;
};

void window_push_close_event(const window_ptr& window);
void window_push_resize_event(const window_ptr& window, int width, int height);
void window_push_key_event(const window_ptr& window, const std::string& type, const std::string& key);
void window_push_mouse_move_event(const window_ptr& window, int x, int y);
void window_push_mouse_button_event(const window_ptr& window, const std::string& type, int button, int x, int y);

${getWindowWindowsAdapterCppFragment()}
${getWindowMacosAdapterCppFragment()}
${getWindowLinuxAdapterCppFragment()}

const char* window_default_unavailable_detail() {
#if defined(_WIN32)
  return "Windows Win32 adapter is not available on this host";
#elif defined(__APPLE__)
  return "macOS Cocoa adapter is not available on this host";
#elif defined(__linux__)
  return "Linux window support requires a usable X11 or Wayland adapter on this host";
#else
  return "no supported window adapter is compiled for this host";
#endif
}

[[noreturn]] void throw_window_unavailable(const char* detail) {
  std::string message = "Jayess window host adapter is not available on this platform";
  const char* resolvedDetail = detail == nullptr ? window_default_unavailable_detail() : detail;
  if (resolvedDetail != nullptr && resolvedDetail[0] != '\\0') {
    message += " (";
    message += resolvedDetail;
    message += ")";
  }
  throw std::runtime_error(message);
}

[[noreturn]] void throw_window_adapter_unavailable(const char* adapter, const char* detail) {
  std::string detailMessage;
#if defined(_WIN32)
  detailMessage = "Windows ";
#elif defined(__APPLE__)
  detailMessage = "macOS ";
#elif defined(__linux__)
  detailMessage = "Linux ";
#else
  detailMessage = "";
#endif
  detailMessage += adapter;
  detailMessage += " adapter is not available on this host";
  if (detail != nullptr && detail[0] != '\\0') {
    detailMessage += ": ";
    detailMessage += detail;
  }
  throw_window_unavailable(detailMessage.c_str());
}

window_ptr require_window_value(const value& input, bool allowClosed = false) {
  if (!std::holds_alternative<window_ptr>(input)) {
    throw_invalid_handle("window", "window");
  }
  auto window = std::get<window_ptr>(input);
  if (window->closed && !allowClosed) {
    throw_closed_handle("window", "window");
  }
  return window;
}

int window_option_integer(const object_ptr& options, const std::string& key, int fallback, const std::string& message) {
  const auto found = options->fields.find(key);
  if (found == options->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<double>(found->second)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(found->second);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric <= 0.0 || numeric > static_cast<double>((std::numeric_limits<int>::max)())) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

std::string window_option_string(const object_ptr& options, const std::string& key, const std::string& fallback, const std::string& message) {
  const auto found = options->fields.find(key);
  if (found == options->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<std::string>(found->second)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(found->second);
}

object_ptr require_window_options(const value& input) {
  if (std::holds_alternative<std::monostate>(input)) {
    return std::make_shared<object_value>();
  }
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess window create expects an options object or null");
  }
  return std::get<object_ptr>(input);
}

std::string window_normalize_key(const std::string& key) {
  if (key.size() == 1) {
    const auto ch = static_cast<unsigned char>(key[0]);
    if (std::isalpha(ch)) {
      return std::string(1, static_cast<char>(std::tolower(ch)));
    }
    if (std::isdigit(ch) || key == " ") {
      return key;
    }
  }
  if (key == "ArrowLeft" || key == "ArrowRight" || key == "ArrowUp" || key == "ArrowDown" ||
      key == "Escape" || key == "Enter" || key == "Tab" || key == "Space" ||
      key == "Shift" || key == "Control" || key == "Alt" || key == "Meta") {
    return key;
  }
  return "unknown";
}

std::string window_normalize_mouse_button(int button) {
  if (button == 0) {
    return "left";
  }
  if (button == 1) {
    return "middle";
  }
  if (button == 2) {
    return "right";
  }
  return "unknown";
}

std::string window_event_code_for_key(const std::string& key) {
  if (key == " ") {
    return "Space";
  }
  if (key.size() == 1) {
    const auto ch = static_cast<unsigned char>(key[0]);
    if (std::isalpha(ch)) {
      return std::string("Key") + static_cast<char>(std::toupper(ch));
    }
    if (std::isdigit(ch)) {
      return std::string("Digit") + key;
    }
  }
  return window_normalize_key(key);
}

value window_event(std::vector<std::pair<std::string, value>> fields) {
  return make_object(std::move(fields));
}

void window_mark_shown(const window_ptr& window) {
  window->shown = true;
}

void window_mark_closed(const window_ptr& window) {
  window->closed = true;
  window->close_requested = true;
  window->shown = false;
}

void window_record_presented_size(const window_ptr& window, int width, int height) {
  window->presented_width = width;
  window->presented_height = height;
}

void window_push_close_event(const window_ptr& window) {
  window->close_requested = true;
  window->events.push_back(window_event({{"type", std::string("close")}}));
}

void window_push_resize_event(const window_ptr& window, int width, int height) {
  window->width = width;
  window->height = height;
  window->events.push_back(window_event({
    {"type", std::string("resize")},
    {"width", static_cast<double>(width)},
    {"height", static_cast<double>(height)}
  }));
}

void window_push_key_event(const window_ptr& window, const std::string& type, const std::string& key) {
  const auto normalized = window_normalize_key(key);
  window->events.push_back(window_event({
    {"type", type},
    {"key", normalized},
    {"code", window_event_code_for_key(normalized)},
    {"pressed", type == "keyDown"}
  }));
}

void window_push_mouse_move_event(const window_ptr& window, int x, int y) {
  window->events.push_back(window_event({
    {"type", std::string("mouseMove")},
    {"x", static_cast<double>(x)},
    {"y", static_cast<double>(y)}
  }));
}

void window_push_mouse_button_event(const window_ptr& window, const std::string& type, int button, int x, int y) {
  window->events.push_back(window_event({
    {"type", type},
    {"button", window_normalize_mouse_button(button)},
    {"x", static_cast<double>(x)},
    {"y", static_cast<double>(y)},
    {"pressed", type == "mouseDown"}
  }));
}

image_ptr require_canvas_image_value(const value& canvasValue) {
  if (!std::holds_alternative<object_ptr>(canvasValue)) {
    throw std::runtime_error("Jayess window present expects a canvas object");
  }
  const auto canvas = std::get<object_ptr>(canvasValue);
  const auto image = canvas->fields.find("image");
  if (image == canvas->fields.end() || !std::holds_alternative<image_ptr>(image->second)) {
    throw std::runtime_error("Jayess window present expects a jayess:canvas object");
  }
  return std::get<image_ptr>(image->second);
}

window_canvas_pixels require_window_canvas_pixels(const value& canvasValue) {
  const auto image = require_canvas_image_value(canvasValue);
  return window_canvas_pixels{image, image->width, image->height, &image->pixels};
}
} // namespace

value window_create(const value& optionsValue) {
  const auto options = require_window_options(optionsValue);
  auto window = std::make_shared<window_state>();
  window->width = window_option_integer(options, "width", 640, "Jayess window width must be a positive integer");
  window->height = window_option_integer(options, "height", 480, "Jayess window height must be a positive integer");
  window->title = window_option_string(options, "title", "", "Jayess window title must be a string");
  if (!window_platform_available()) {
    throw_window_unavailable();
  }
  window_platform_create(window);
  window_push_resize_event(window, window->width, window->height);
  return window;
}

value window_show(const value& windowValue) {
  auto window = require_window_value(windowValue);
  if (window->shown) {
    return windowValue;
  }
  if (!window_platform_available()) {
    throw_window_unavailable();
  }
  window_platform_show(window);
  window_mark_shown(window);
  return windowValue;
}

value window_close(const value& windowValue) {
  auto window = require_window_value(windowValue);
  window_platform_close(window);
  if (!window->close_requested) {
    window_push_close_event(window);
  }
  window_mark_closed(window);
  return value(std::monostate{});
}

value window_should_close(const value& windowValue) {
  auto window = require_window_value(windowValue, true);
  return window->closed || window->close_requested;
}

value window_request_close(const value& windowValue) {
  auto window = require_window_value(windowValue);
  if (!window->close_requested) {
    window_push_close_event(window);
  }
  return windowValue;
}

value window_poll_events(const value& windowValue) {
  auto window = require_window_value(windowValue, true);
  if (!window->closed) {
    window_platform_poll_events(window);
  }
  auto events = window->events;
  window->events.clear();
  return make_array(std::move(events));
}

value window_present(const value& windowValue, const value& canvasValue) {
  auto window = require_window_value(windowValue);
  const auto pixels = require_window_canvas_pixels(canvasValue);
  window_record_presented_size(window, pixels.width, pixels.height);
  if (!window_platform_available()) {
    throw_window_unavailable();
  }
  window_platform_present(window, pixels);
  return windowValue;
}

value window_width(const value& windowValue) {
  return static_cast<double>(require_window_value(windowValue)->width);
}

value window_height(const value& windowValue) {
  return static_cast<double>(require_window_value(windowValue)->height);
}

value window_set_title(const value& windowValue, const value& titleValue) {
  auto window = require_window_value(windowValue);
  if (!std::holds_alternative<std::string>(titleValue)) {
    throw std::runtime_error("Jayess window title must be a string");
  }
  window->title = std::get<std::string>(titleValue);
  if (!window_platform_available()) {
    throw_window_unavailable();
  }
  window_platform_set_title(window);
  return windowValue;
}`;
}

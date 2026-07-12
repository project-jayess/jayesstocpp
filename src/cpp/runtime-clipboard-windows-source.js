export function getClipboardWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
std::wstring clipboard_windows_utf8_to_wide(const std::string& text) {
  if (text.empty()) {
    return std::wstring();
  }
  int length = MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), nullptr, 0);
  if (length <= 0) {
    throw std::runtime_error("Jayess clipboard could not encode text as UTF-16");
  }
  std::wstring wide(static_cast<std::size_t>(length), L'\\0');
  MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), wide.data(), length);
  return wide;
}

std::string clipboard_windows_wide_to_utf8(const wchar_t* text) {
  if (text == nullptr || text[0] == L'\\0') {
    return std::string();
  }
  int length = WideCharToMultiByte(CP_UTF8, 0, text, -1, nullptr, 0, nullptr, nullptr);
  if (length <= 1) {
    return std::string();
  }
  std::string utf8(static_cast<std::size_t>(length - 1), '\\0');
  WideCharToMultiByte(CP_UTF8, 0, text, -1, utf8.data(), length, nullptr, nullptr);
  return utf8;
}

struct clipboard_windows_open_guard {
  bool opened = false;

  clipboard_windows_open_guard() {
    opened = OpenClipboard(nullptr) != 0;
  }

  ~clipboard_windows_open_guard() {
    if (opened) {
      CloseClipboard();
    }
  }
};

bool clipboard_platform_available() {
  return true;
}

std::string clipboard_platform_read_text() {
  clipboard_windows_open_guard guard;
  if (!guard.opened) {
    throw std::runtime_error("Jayess clipboard could not open the Windows clipboard");
  }
  if (IsClipboardFormatAvailable(CF_UNICODETEXT) == 0) {
    return std::string();
  }
  HANDLE handle = GetClipboardData(CF_UNICODETEXT);
  if (handle == nullptr) {
    return std::string();
  }
  const wchar_t* text = static_cast<const wchar_t*>(GlobalLock(handle));
  if (text == nullptr) {
    return std::string();
  }
  std::string utf8 = clipboard_windows_wide_to_utf8(text);
  GlobalUnlock(handle);
  return utf8;
}

bool clipboard_platform_write_text(const std::string& text) {
  std::wstring wide = clipboard_windows_utf8_to_wide(text);
  const std::size_t bytes = (wide.size() + 1U) * sizeof(wchar_t);
  HGLOBAL memory = GlobalAlloc(GMEM_MOVEABLE, bytes);
  if (memory == nullptr) {
    throw std::runtime_error("Jayess clipboard could not allocate Windows clipboard memory");
  }
  void* locked = GlobalLock(memory);
  if (locked == nullptr) {
    GlobalFree(memory);
    throw std::runtime_error("Jayess clipboard could not lock Windows clipboard memory");
  }
  std::memcpy(locked, wide.c_str(), bytes);
  GlobalUnlock(memory);

  clipboard_windows_open_guard guard;
  if (!guard.opened) {
    GlobalFree(memory);
    throw std::runtime_error("Jayess clipboard could not open the Windows clipboard");
  }
  if (EmptyClipboard() == 0) {
    GlobalFree(memory);
    throw std::runtime_error("Jayess clipboard could not clear the Windows clipboard");
  }
  if (SetClipboardData(CF_UNICODETEXT, memory) == nullptr) {
    GlobalFree(memory);
    throw std::runtime_error("Jayess clipboard could not write Windows clipboard text");
  }
  return true;
}

bool clipboard_platform_clear() {
  clipboard_windows_open_guard guard;
  if (!guard.opened) {
    throw std::runtime_error("Jayess clipboard could not open the Windows clipboard");
  }
  return EmptyClipboard() != 0;
}
#endif`;
}

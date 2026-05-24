export function getDialogWindowsAdapterCppFragment() {
  return `#if defined(_WIN32)
using jayess_dialog_hwnd = void*;
using jayess_dialog_hmodule = void*;
using jayess_dialog_dword = unsigned long;
using jayess_dialog_uint = unsigned int;
using jayess_dialog_word = unsigned short;
using jayess_dialog_wparam = std::uintptr_t;
using jayess_dialog_lparam = std::intptr_t;
using jayess_dialog_callback_fn = int (*)(jayess_dialog_hwnd, jayess_dialog_uint, jayess_dialog_lparam, jayess_dialog_lparam);

struct jayess_open_file_name_a {
  jayess_dialog_dword lStructSize;
  jayess_dialog_hwnd hwndOwner;
  void* hInstance;
  const char* lpstrFilter;
  char* lpstrCustomFilter;
  jayess_dialog_dword nMaxCustFilter;
  jayess_dialog_dword nFilterIndex;
  char* lpstrFile;
  jayess_dialog_dword nMaxFile;
  char* lpstrFileTitle;
  jayess_dialog_dword nMaxFileTitle;
  const char* lpstrInitialDir;
  const char* lpstrTitle;
  jayess_dialog_dword Flags;
  jayess_dialog_word nFileOffset;
  jayess_dialog_word nFileExtension;
  const char* lpstrDefExt;
  jayess_dialog_lparam lCustData;
  void* lpfnHook;
  const char* lpTemplateName;
  void* pvReserved;
  jayess_dialog_dword dwReserved;
  jayess_dialog_dword FlagsEx;
};

struct jayess_browse_info_a {
  jayess_dialog_hwnd hwndOwner;
  void* pidlRoot;
  char* pszDisplayName;
  const char* lpszTitle;
  jayess_dialog_uint ulFlags;
  jayess_dialog_callback_fn lpfn;
  jayess_dialog_lparam lParam;
  int iImage;
};

using jayess_get_open_file_name_a_fn = int (*)(jayess_open_file_name_a*);
using jayess_get_save_file_name_a_fn = int (*)(jayess_open_file_name_a*);
using jayess_commdlg_extended_error_fn = jayess_dialog_dword (*)();
using jayess_message_box_a_fn = int (*)(jayess_dialog_hwnd, const char*, const char*, jayess_dialog_uint);
using jayess_sh_browse_for_folder_a_fn = void* (*)(const jayess_browse_info_a*);
using jayess_sh_get_path_from_id_list_a_fn = int (*)(const void*, char*);
using jayess_send_message_a_fn = std::intptr_t (*)(jayess_dialog_hwnd, jayess_dialog_uint, jayess_dialog_wparam, jayess_dialog_lparam);
using jayess_co_task_mem_free_fn = void (*)(void*);

struct jayess_windows_dialog_api {
  jayess_dialog_hmodule user32 = nullptr;
  jayess_dialog_hmodule comdlg32 = nullptr;
  jayess_dialog_hmodule shell32 = nullptr;
  jayess_dialog_hmodule ole32 = nullptr;
  jayess_get_open_file_name_a_fn get_open_file_name = nullptr;
  jayess_get_save_file_name_a_fn get_save_file_name = nullptr;
  jayess_commdlg_extended_error_fn commdlg_extended_error = nullptr;
  jayess_message_box_a_fn message_box = nullptr;
  jayess_sh_browse_for_folder_a_fn browse_for_folder = nullptr;
  jayess_sh_get_path_from_id_list_a_fn get_path_from_id_list = nullptr;
  jayess_send_message_a_fn send_message = nullptr;
  jayess_co_task_mem_free_fn co_task_mem_free = nullptr;
  bool attempted = false;
};

constexpr jayess_dialog_dword JAYESS_OFN_EXPLORER = 0x00080000UL;
constexpr jayess_dialog_dword JAYESS_OFN_NOCHANGEDIR = 0x00000008UL;
constexpr jayess_dialog_dword JAYESS_OFN_FILEMUSTEXIST = 0x00001000UL;
constexpr jayess_dialog_dword JAYESS_OFN_PATHMUSTEXIST = 0x00000800UL;
constexpr jayess_dialog_dword JAYESS_OFN_OVERWRITEPROMPT = 0x00000002UL;
constexpr jayess_dialog_uint JAYESS_BIF_RETURNONLYFSDIRS = 0x00000001U;
constexpr jayess_dialog_uint JAYESS_BIF_NEWDIALOGSTYLE = 0x00000040U;
constexpr jayess_dialog_uint JAYESS_MB_OK = 0x00000000U;
constexpr jayess_dialog_uint JAYESS_MB_OKCANCEL = 0x00000001U;
constexpr jayess_dialog_uint JAYESS_MB_YESNO = 0x00000004U;
constexpr jayess_dialog_uint JAYESS_MB_YESNOCANCEL = 0x00000003U;
constexpr jayess_dialog_uint JAYESS_MB_ICONHAND = 0x00000010U;
constexpr jayess_dialog_uint JAYESS_MB_ICONQUESTION = 0x00000020U;
constexpr jayess_dialog_uint JAYESS_MB_ICONEXCLAMATION = 0x00000030U;
constexpr jayess_dialog_uint JAYESS_MB_ICONINFORMATION = 0x00000040U;
constexpr jayess_dialog_uint JAYESS_MB_TASKMODAL = 0x00002000U;
constexpr int JAYESS_IDOK = 1;
constexpr int JAYESS_IDYES = 6;
constexpr int JAYESS_IDNO = 7;
constexpr jayess_dialog_uint JAYESS_BFFM_INITIALIZED = 1U;
constexpr jayess_dialog_uint JAYESS_BFFM_SETSELECTIONA = 0x0467U;
constexpr std::size_t JAYESS_DIALOG_PATH_BUFFER_BYTES = 4096;

jayess_windows_dialog_api& dialog_windows_api() {
  static jayess_windows_dialog_api api;
  return api;
}

std::string dialog_windows_filter_buffer(const object_ptr& options, const std::string& operationName) {
  const auto stored = dialog_option_value(options, "filters");
  if (std::holds_alternative<std::monostate>(stored)) {
    std::string fallback = "All Files";
    fallback.push_back('\\0');
    fallback += "*.*";
    fallback.push_back('\\0');
    fallback.push_back('\\0');
    return fallback;
  }

  std::string encoded;
  const auto filters = std::get<array_ptr>(stored);
  for (const auto& filter : filters->items) {
    const auto filterObject = std::get<object_ptr>(filter);
    auto name = dialog_optional_string_option(filterObject, "name", operationName + " filter");
    if (name.empty()) {
      name = "Files";
    }
    encoded += name;
    encoded.push_back('\\0');

    const auto extensions = std::get<array_ptr>(dialog_option_value(filterObject, "extensions"));
    for (std::size_t index = 0; index < extensions->items.size(); index += 1) {
      if (index > 0) {
        encoded.push_back(';');
      }
      encoded += "*.";
      encoded += std::get<std::string>(extensions->items[index]);
    }
    encoded.push_back('\\0');
  }
  encoded.push_back('\\0');
  return encoded;
}

std::string dialog_windows_initial_directory(const std::string& defaultPath) {
  if (defaultPath.empty()) {
    return "";
  }
  const std::filesystem::path pathValue(defaultPath);
  if (!pathValue.has_filename()) {
    return pathValue.string();
  }
  const auto filename = pathValue.filename().string();
  if (filename.find('.') == std::string::npos) {
    return pathValue.string();
  }
  if (pathValue.has_parent_path()) {
    return pathValue.parent_path().string();
  }
  return "";
}

bool dialog_windows_platform_available() {
  auto& api = dialog_windows_api();
  if (api.attempted) {
    return api.get_open_file_name != nullptr
      && api.get_save_file_name != nullptr
      && api.commdlg_extended_error != nullptr
      && api.message_box != nullptr
      && api.browse_for_folder != nullptr
      && api.get_path_from_id_list != nullptr
      && api.send_message != nullptr
      && api.co_task_mem_free != nullptr;
  }

  api.attempted = true;
  api.user32 = LoadLibraryA("user32.dll");
  api.comdlg32 = LoadLibraryA("comdlg32.dll");
  api.shell32 = LoadLibraryA("shell32.dll");
  api.ole32 = LoadLibraryA("ole32.dll");
  if (api.user32 == nullptr || api.comdlg32 == nullptr || api.shell32 == nullptr || api.ole32 == nullptr) {
    return false;
  }

  api.get_open_file_name = reinterpret_cast<jayess_get_open_file_name_a_fn>(GetProcAddress(static_cast<HMODULE>(api.comdlg32), "GetOpenFileNameA"));
  api.get_save_file_name = reinterpret_cast<jayess_get_save_file_name_a_fn>(GetProcAddress(static_cast<HMODULE>(api.comdlg32), "GetSaveFileNameA"));
  api.commdlg_extended_error = reinterpret_cast<jayess_commdlg_extended_error_fn>(GetProcAddress(static_cast<HMODULE>(api.comdlg32), "CommDlgExtendedError"));
  api.message_box = reinterpret_cast<jayess_message_box_a_fn>(GetProcAddress(static_cast<HMODULE>(api.user32), "MessageBoxA"));
  api.browse_for_folder = reinterpret_cast<jayess_sh_browse_for_folder_a_fn>(GetProcAddress(static_cast<HMODULE>(api.shell32), "SHBrowseForFolderA"));
  api.get_path_from_id_list = reinterpret_cast<jayess_sh_get_path_from_id_list_a_fn>(GetProcAddress(static_cast<HMODULE>(api.shell32), "SHGetPathFromIDListA"));
  api.send_message = reinterpret_cast<jayess_send_message_a_fn>(GetProcAddress(static_cast<HMODULE>(api.user32), "SendMessageA"));
  api.co_task_mem_free = reinterpret_cast<jayess_co_task_mem_free_fn>(GetProcAddress(static_cast<HMODULE>(api.ole32), "CoTaskMemFree"));
  return api.get_open_file_name != nullptr
    && api.get_save_file_name != nullptr
    && api.commdlg_extended_error != nullptr
    && api.message_box != nullptr
    && api.browse_for_folder != nullptr
    && api.get_path_from_id_list != nullptr
    && api.send_message != nullptr
    && api.co_task_mem_free != nullptr;
}

bool dialog_windows_env_value(const char* name, std::string& output) {
  char* value = nullptr;
  std::size_t size = 0;
  if (_dupenv_s(&value, &size, name) != 0 || value == nullptr) {
    output.clear();
    return false;
  }
  output.assign(value);
  std::free(value);
  return true;
}

bool dialog_windows_has_override(const char* name) {
  std::string output;
  return dialog_windows_env_value(name, output);
}

value dialog_windows_picker_override(const char* name) {
  std::string override;
  dialog_windows_env_value(name, override);
  if (override == "cancel") {
    return std::monostate{};
  }
  return override;
}

value dialog_windows_message_override(const char* name) {
  std::string override;
  dialog_windows_env_value(name, override);
  if (override == "ok" || override == "cancel" || override == "yes" || override == "no") {
    return override;
  }
  throw std::runtime_error("Jayess dialog message test override must be one of: ok, cancel, yes, no");
}

std::runtime_error dialog_windows_common_dialog_error(const std::string& operationName, jayess_dialog_dword errorCode) {
  return std::runtime_error("Jayess dialog " + operationName + " Win32 common dialog failed with code " + std::to_string(errorCode));
}

int dialog_windows_browse_callback(jayess_dialog_hwnd hwnd, jayess_dialog_uint message, jayess_dialog_lparam, jayess_dialog_lparam data) {
  if (message != JAYESS_BFFM_INITIALIZED || data == 0) {
    return 0;
  }
  auto& api = dialog_windows_api();
  if (api.send_message == nullptr) {
    return 0;
  }
  api.send_message(hwnd, JAYESS_BFFM_SETSELECTIONA, 1, data);
  return 0;
}

value dialog_windows_open_file(const value& optionsValue) {
  if (dialog_windows_has_override("JAYESS_DIALOG_TEST_OPEN_FILE")) {
    return dialog_windows_picker_override("JAYESS_DIALOG_TEST_OPEN_FILE");
  }

  const auto options = dialog_require_options_object(optionsValue, "openFile");
  const auto title = dialog_optional_string_option(options, "title", "openFile");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "openFile");
  auto filterBuffer = dialog_windows_filter_buffer(options, "openFile");
  auto initialDirectory = dialog_windows_initial_directory(defaultPath);
  std::array<char, JAYESS_DIALOG_PATH_BUFFER_BYTES> fileBuffer{};
  if (defaultPath.size() >= fileBuffer.size()) {
    throw std::runtime_error("Jayess dialog openFile option 'defaultPath' is too long for the current Windows adapter");
  }
  std::memcpy(fileBuffer.data(), defaultPath.c_str(), defaultPath.size());

  jayess_open_file_name_a dialog{};
  dialog.lStructSize = sizeof(dialog);
  dialog.lpstrFilter = filterBuffer.c_str();
  dialog.lpstrFile = fileBuffer.data();
  dialog.nMaxFile = static_cast<jayess_dialog_dword>(fileBuffer.size());
  dialog.lpstrInitialDir = initialDirectory.empty() ? nullptr : initialDirectory.c_str();
  dialog.lpstrTitle = title.empty() ? nullptr : title.c_str();
  dialog.Flags = JAYESS_OFN_EXPLORER | JAYESS_OFN_NOCHANGEDIR | JAYESS_OFN_FILEMUSTEXIST | JAYESS_OFN_PATHMUSTEXIST;

  auto& api = dialog_windows_api();
  if (api.get_open_file_name(&dialog) != 0) {
    return std::string(fileBuffer.data());
  }
  const auto errorCode = api.commdlg_extended_error();
  if (errorCode == 0) {
    return std::monostate{};
  }
  throw dialog_windows_common_dialog_error("openFile", errorCode);
}

value dialog_windows_save_file(const value& optionsValue) {
  if (dialog_windows_has_override("JAYESS_DIALOG_TEST_SAVE_FILE")) {
    return dialog_windows_picker_override("JAYESS_DIALOG_TEST_SAVE_FILE");
  }

  const auto options = dialog_require_options_object(optionsValue, "saveFile");
  const auto title = dialog_optional_string_option(options, "title", "saveFile");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "saveFile");
  auto filterBuffer = dialog_windows_filter_buffer(options, "saveFile");
  auto initialDirectory = dialog_windows_initial_directory(defaultPath);
  std::array<char, JAYESS_DIALOG_PATH_BUFFER_BYTES> fileBuffer{};
  if (defaultPath.size() >= fileBuffer.size()) {
    throw std::runtime_error("Jayess dialog saveFile option 'defaultPath' is too long for the current Windows adapter");
  }
  std::memcpy(fileBuffer.data(), defaultPath.c_str(), defaultPath.size());

  jayess_open_file_name_a dialog{};
  dialog.lStructSize = sizeof(dialog);
  dialog.lpstrFilter = filterBuffer.c_str();
  dialog.lpstrFile = fileBuffer.data();
  dialog.nMaxFile = static_cast<jayess_dialog_dword>(fileBuffer.size());
  dialog.lpstrInitialDir = initialDirectory.empty() ? nullptr : initialDirectory.c_str();
  dialog.lpstrTitle = title.empty() ? nullptr : title.c_str();
  dialog.Flags = JAYESS_OFN_EXPLORER | JAYESS_OFN_NOCHANGEDIR | JAYESS_OFN_OVERWRITEPROMPT | JAYESS_OFN_PATHMUSTEXIST;

  auto& api = dialog_windows_api();
  if (api.get_save_file_name(&dialog) != 0) {
    return std::string(fileBuffer.data());
  }
  const auto errorCode = api.commdlg_extended_error();
  if (errorCode == 0) {
    return std::monostate{};
  }
  throw dialog_windows_common_dialog_error("saveFile", errorCode);
}

value dialog_windows_open_directory(const value& optionsValue) {
  if (dialog_windows_has_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY")) {
    return dialog_windows_picker_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY");
  }

  const auto options = dialog_require_options_object(optionsValue, "openDirectory");
  const auto title = dialog_optional_string_option(options, "title", "openDirectory");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "openDirectory");
  std::array<char, JAYESS_DIALOG_PATH_BUFFER_BYTES> displayName{};
  std::array<char, JAYESS_DIALOG_PATH_BUFFER_BYTES> directoryPath{};
  auto& api = dialog_windows_api();

  jayess_browse_info_a browseInfo{};
  browseInfo.pszDisplayName = displayName.data();
  browseInfo.lpszTitle = title.empty() ? nullptr : title.c_str();
  browseInfo.ulFlags = JAYESS_BIF_RETURNONLYFSDIRS | JAYESS_BIF_NEWDIALOGSTYLE;
  browseInfo.lpfn = defaultPath.empty() ? nullptr : dialog_windows_browse_callback;
  browseInfo.lParam = defaultPath.empty() ? 0 : static_cast<jayess_dialog_lparam>(reinterpret_cast<std::uintptr_t>(defaultPath.c_str()));

  void* selection = api.browse_for_folder(&browseInfo);
  if (selection == nullptr) {
    return std::monostate{};
  }

  const auto copied = api.get_path_from_id_list(selection, directoryPath.data());
  api.co_task_mem_free(selection);
  if (copied == 0) {
    throw std::runtime_error("Jayess dialog openDirectory Win32 adapter could not normalize the selected folder path");
  }
  return std::string(directoryPath.data());
}

jayess_dialog_uint dialog_windows_message_flags(const object_ptr& options) {
  const auto buttons = dialog_optional_string_option(options, "buttons", "message");
  const auto kind = dialog_optional_string_option(options, "kind", "message");

  jayess_dialog_uint flags = JAYESS_MB_TASKMODAL;
  if (buttons == "okCancel") {
    flags |= JAYESS_MB_OKCANCEL;
  } else if (buttons == "yesNo") {
    flags |= JAYESS_MB_YESNO;
  } else if (buttons == "yesNoCancel") {
    flags |= JAYESS_MB_YESNOCANCEL;
  } else {
    flags |= JAYESS_MB_OK;
  }

  if (kind == "warning") {
    flags |= JAYESS_MB_ICONEXCLAMATION;
  } else if (kind == "error") {
    flags |= JAYESS_MB_ICONHAND;
  } else if (kind == "question") {
    flags |= JAYESS_MB_ICONQUESTION;
  } else {
    flags |= JAYESS_MB_ICONINFORMATION;
  }
  return flags;
}

value dialog_windows_message(const value& optionsValue) {
  if (dialog_windows_has_override("JAYESS_DIALOG_TEST_MESSAGE")) {
    return dialog_windows_message_override("JAYESS_DIALOG_TEST_MESSAGE");
  }

  const auto options = dialog_require_options_object(optionsValue, "message");
  const auto title = dialog_optional_string_option(options, "title", "message");
  const auto messageText = dialog_optional_string_option(options, "message", "message");
  const auto detail = dialog_optional_string_option(options, "detail", "message");
  std::string body = messageText;
  if (!detail.empty()) {
    if (!body.empty()) {
      body += "\\n\\n";
    }
    body += detail;
  }

  auto& api = dialog_windows_api();
  const auto result = api.message_box(nullptr, body.c_str(), title.empty() ? "Jayess" : title.c_str(), dialog_windows_message_flags(options));
  if (result == JAYESS_IDOK) {
    return std::string("ok");
  }
  if (result == JAYESS_IDYES) {
    return std::string("yes");
  }
  if (result == JAYESS_IDNO) {
    return std::string("no");
  }
  return std::string("cancel");
}
#endif`;
}

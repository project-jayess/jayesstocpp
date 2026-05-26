export function getDialogMacosAdapterCppFragment() {
  return `#if defined(__APPLE__)
using jayess_dialog_objc_id = void*;
using jayess_dialog_objc_class = void*;
using jayess_dialog_objc_sel = void*;
using jayess_dialog_objc_bool = signed char;
using jayess_dialog_nsinteger = long;
using jayess_dialog_nsuinteger = unsigned long;

using jayess_dialog_objc_get_class_fn = jayess_dialog_objc_class (*)(const char*);
using jayess_dialog_sel_register_name_fn = jayess_dialog_objc_sel (*)(const char*);
using jayess_dialog_objc_msg_send_raw_fn = void* (*)();

struct jayess_macos_dialog_api {
  void* objc_library = nullptr;
  void* appkit_library = nullptr;
  jayess_dialog_objc_get_class_fn get_class = nullptr;
  jayess_dialog_sel_register_name_fn register_selector = nullptr;
  jayess_dialog_objc_msg_send_raw_fn msg_send = nullptr;
  bool attempted = false;
};

constexpr jayess_dialog_nsinteger JAYESS_NS_MODAL_RESPONSE_OK = 1;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_FIRST_BUTTON = 1000;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_SECOND_BUTTON = 1001;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_THIRD_BUTTON = 1002;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_STYLE_WARNING = 0;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_STYLE_INFORMATIONAL = 1;
constexpr jayess_dialog_nsinteger JAYESS_NS_ALERT_STYLE_CRITICAL = 2;

jayess_macos_dialog_api& dialog_macos_api() {
  static jayess_macos_dialog_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
  api.objc_library = dlopen("/usr/lib/libobjc.A.dylib", RTLD_LAZY | RTLD_LOCAL);
  api.appkit_library = dlopen("/System/Library/Frameworks/AppKit.framework/AppKit", RTLD_LAZY | RTLD_LOCAL);
  if (api.objc_library == nullptr || api.appkit_library == nullptr) {
    return api;
  }
  api.get_class = reinterpret_cast<jayess_dialog_objc_get_class_fn>(dlsym(api.objc_library, "objc_getClass"));
  api.register_selector = reinterpret_cast<jayess_dialog_sel_register_name_fn>(dlsym(api.objc_library, "sel_registerName"));
  api.msg_send = reinterpret_cast<jayess_dialog_objc_msg_send_raw_fn>(dlsym(api.objc_library, "objc_msgSend"));
  return api;
}

bool dialog_macos_platform_available() {
  auto& api = dialog_macos_api();
  return api.objc_library != nullptr
    && api.appkit_library != nullptr
    && api.get_class != nullptr
    && api.register_selector != nullptr
    && api.msg_send != nullptr;
}

jayess_dialog_objc_sel dialog_macos_selector(const char* name) {
  return dialog_macos_api().register_selector(name);
}

jayess_dialog_objc_id dialog_macos_autorelease_pool() {
  auto& api = dialog_macos_api();
  auto poolClass = api.get_class("NSAutoreleasePool");
  auto allocFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto initFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto pool = allocFn(poolClass, dialog_macos_selector("alloc"));
  return initFn(pool, dialog_macos_selector("init"));
}

void dialog_macos_drain_pool(jayess_dialog_objc_id pool) {
  if (pool == nullptr) {
    return;
  }
  auto& api = dialog_macos_api();
  auto drainFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  drainFn(pool, dialog_macos_selector("drain"));
}

jayess_dialog_objc_id dialog_macos_string(const std::string& text) {
  auto& api = dialog_macos_api();
  auto stringClass = api.get_class("NSString");
  auto allocFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto initFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, const char*)>(api.msg_send);
  auto stringObject = allocFn(stringClass, dialog_macos_selector("alloc"));
  return initFn(stringObject, dialog_macos_selector("initWithUTF8String:"), text.c_str());
}

std::string dialog_macos_utf8(jayess_dialog_objc_id stringObject) {
  if (stringObject == nullptr) {
    return "";
  }
  auto& api = dialog_macos_api();
  auto utf8Fn = reinterpret_cast<const char* (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto* text = utf8Fn(stringObject, dialog_macos_selector("UTF8String"));
  if (text == nullptr) {
    return "";
  }
  return text;
}

jayess_dialog_objc_id dialog_macos_file_url(const std::string& path) {
  auto& api = dialog_macos_api();
  auto urlClass = api.get_class("NSURL");
  auto urlFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  return urlFn(urlClass, dialog_macos_selector("fileURLWithPath:"), dialog_macos_string(path));
}

jayess_dialog_objc_id dialog_macos_mutable_array() {
  auto& api = dialog_macos_api();
  auto arrayClass = api.get_class("NSMutableArray");
  auto arrayFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  return arrayFn(arrayClass, dialog_macos_selector("array"));
}

void dialog_macos_add_array_item(jayess_dialog_objc_id arrayObject, jayess_dialog_objc_id itemObject) {
  auto& api = dialog_macos_api();
  auto addFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  addFn(arrayObject, dialog_macos_selector("addObject:"), itemObject);
}

bool dialog_macos_has_override(const char* name) {
  return std::getenv(name) != nullptr;
}

value dialog_macos_picker_override(const char* name) {
  const auto override = std::string(std::getenv(name));
  return dialog_picker_override_result(override, false);
}

value dialog_macos_open_file_override(const char* name, bool multiple) {
  const auto override = std::string(std::getenv(name));
  return dialog_picker_override_result(override, multiple);
}

value dialog_macos_message_override(const char* name) {
  const auto override = std::string(std::getenv(name));
  if (override == "ok" || override == "cancel" || override == "yes" || override == "no") {
    return override;
  }
  throw std::runtime_error("Jayess dialog message test override must be one of: ok, cancel, yes, no");
}

void dialog_macos_apply_title(jayess_dialog_objc_id panel, const std::string& title) {
  if (title.empty()) {
    return;
  }
  auto& api = dialog_macos_api();
  auto setTitleFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  setTitleFn(panel, dialog_macos_selector("setTitle:"), dialog_macos_string(title));
}

void dialog_macos_apply_directory(jayess_dialog_objc_id panel, const std::string& defaultPath) {
  if (defaultPath.empty()) {
    return;
  }
  auto& api = dialog_macos_api();
  auto setDirectoryFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  setDirectoryFn(panel, dialog_macos_selector("setDirectoryURL:"), dialog_macos_file_url(defaultPath));
}

void dialog_macos_apply_filters(jayess_dialog_objc_id panel, const object_ptr& options) {
  const auto stored = dialog_option_value(options, "filters");
  if (std::holds_alternative<std::monostate>(stored)) {
    return;
  }
  auto arrayObject = dialog_macos_mutable_array();
  const auto filters = std::get<array_ptr>(stored);
  for (const auto& filter : filters->items) {
    const auto filterObject = std::get<object_ptr>(filter);
    const auto extensions = std::get<array_ptr>(dialog_option_value(filterObject, "extensions"));
    for (const auto& extension : extensions->items) {
      dialog_macos_add_array_item(arrayObject, dialog_macos_string(std::get<std::string>(extension)));
    }
  }
  auto& api = dialog_macos_api();
  auto setTypesFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  setTypesFn(panel, dialog_macos_selector("setAllowedFileTypes:"), arrayObject);
}

void dialog_macos_apply_default_name(jayess_dialog_objc_id panel, const std::string& defaultName) {
  if (defaultName.empty()) {
    return;
  }
  auto& api = dialog_macos_api();
  auto setNameFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  setNameFn(panel, dialog_macos_selector("setNameFieldStringValue:"), dialog_macos_string(defaultName));
}

value dialog_macos_panel_urls_result(jayess_dialog_objc_id panel) {
  auto& api = dialog_macos_api();
  auto urlsFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto countFn = reinterpret_cast<jayess_dialog_nsuinteger (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto itemFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_nsuinteger)>(api.msg_send);
  auto pathFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);

  auto urls = urlsFn(panel, dialog_macos_selector("URLs"));
  std::vector<value> paths;
  const auto count = countFn(urls, dialog_macos_selector("count"));
  for (jayess_dialog_nsuinteger index = 0; index < count; index += 1) {
    const auto url = itemFn(urls, dialog_macos_selector("objectAtIndex:"), index);
    const auto pathObject = pathFn(url, dialog_macos_selector("path"));
    paths.push_back(dialog_macos_utf8(pathObject));
  }
  return make_array(std::move(paths));
}

value dialog_macos_open_file(const value& optionsValue) {
  auto& api = dialog_macos_api();
  const auto options = dialog_require_options_object(optionsValue, "openFile");
  const auto title = dialog_optional_string_option(options, "title", "openFile");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "openFile");
  const auto multiple = dialog_optional_bool_option(options, "multiple", "openFile");
  if (dialog_macos_has_override("JAYESS_DIALOG_TEST_OPEN_FILE")) {
    return dialog_macos_open_file_override("JAYESS_DIALOG_TEST_OPEN_FILE", multiple);
  }

  auto pool = dialog_macos_autorelease_pool();
  auto panelClass = api.get_class("NSOpenPanel");
  auto openPanelFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto panel = openPanelFn(panelClass, dialog_macos_selector("openPanel"));
  auto boolFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_bool)>(api.msg_send);
  boolFn(panel, dialog_macos_selector("setCanChooseFiles:"), 1);
  boolFn(panel, dialog_macos_selector("setCanChooseDirectories:"), 0);
  boolFn(panel, dialog_macos_selector("setAllowsMultipleSelection:"), multiple ? 1 : 0);
  dialog_macos_apply_title(panel, title);
  dialog_macos_apply_directory(panel, defaultPath);
  dialog_macos_apply_filters(panel, options);

  auto runFn = reinterpret_cast<jayess_dialog_nsinteger (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto response = runFn(panel, dialog_macos_selector("runModal"));
  if (response != JAYESS_NS_MODAL_RESPONSE_OK) {
    dialog_macos_drain_pool(pool);
    return std::monostate{};
  }

  if (multiple) {
    auto result = dialog_macos_panel_urls_result(panel);
    dialog_macos_drain_pool(pool);
    return result;
  }

  auto urlFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto pathFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto url = urlFn(panel, dialog_macos_selector("URL"));
  const auto pathObject = pathFn(url, dialog_macos_selector("path"));
  const auto result = dialog_macos_utf8(pathObject);
  dialog_macos_drain_pool(pool);
  return result;
}

value dialog_macos_save_file(const value& optionsValue) {
  if (dialog_macos_has_override("JAYESS_DIALOG_TEST_SAVE_FILE")) {
    return dialog_macos_picker_override("JAYESS_DIALOG_TEST_SAVE_FILE");
  }

  auto& api = dialog_macos_api();
  auto pool = dialog_macos_autorelease_pool();
  const auto options = dialog_require_options_object(optionsValue, "saveFile");
  const auto title = dialog_optional_string_option(options, "title", "saveFile");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "saveFile");
  const auto defaultName = dialog_optional_string_option(options, "defaultName", "saveFile");

  auto panelClass = api.get_class("NSSavePanel");
  auto savePanelFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto panel = savePanelFn(panelClass, dialog_macos_selector("savePanel"));
  dialog_macos_apply_title(panel, title);
  dialog_macos_apply_directory(panel, defaultPath);
  dialog_macos_apply_default_name(panel, defaultName);
  dialog_macos_apply_filters(panel, options);

  auto runFn = reinterpret_cast<jayess_dialog_nsinteger (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto response = runFn(panel, dialog_macos_selector("runModal"));
  if (response != JAYESS_NS_MODAL_RESPONSE_OK) {
    dialog_macos_drain_pool(pool);
    return std::monostate{};
  }

  auto urlFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto pathFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto url = urlFn(panel, dialog_macos_selector("URL"));
  const auto pathObject = pathFn(url, dialog_macos_selector("path"));
  const auto result = dialog_macos_utf8(pathObject);
  dialog_macos_drain_pool(pool);
  return result;
}

value dialog_macos_open_directory(const value& optionsValue) {
  if (dialog_macos_has_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY")) {
    return dialog_macos_picker_override("JAYESS_DIALOG_TEST_OPEN_DIRECTORY");
  }

  auto& api = dialog_macos_api();
  auto pool = dialog_macos_autorelease_pool();
  const auto options = dialog_require_options_object(optionsValue, "openDirectory");
  const auto title = dialog_optional_string_option(options, "title", "openDirectory");
  const auto defaultPath = dialog_optional_string_option(options, "defaultPath", "openDirectory");

  auto panelClass = api.get_class("NSOpenPanel");
  auto openPanelFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto panel = openPanelFn(panelClass, dialog_macos_selector("openPanel"));
  auto boolFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_bool)>(api.msg_send);
  boolFn(panel, dialog_macos_selector("setCanChooseFiles:"), 0);
  boolFn(panel, dialog_macos_selector("setCanChooseDirectories:"), 1);
  boolFn(panel, dialog_macos_selector("setAllowsMultipleSelection:"), 0);
  dialog_macos_apply_title(panel, title);
  dialog_macos_apply_directory(panel, defaultPath);

  auto runFn = reinterpret_cast<jayess_dialog_nsinteger (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto response = runFn(panel, dialog_macos_selector("runModal"));
  if (response != JAYESS_NS_MODAL_RESPONSE_OK) {
    dialog_macos_drain_pool(pool);
    return std::monostate{};
  }

  auto urlFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto pathFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto url = urlFn(panel, dialog_macos_selector("URL"));
  const auto pathObject = pathFn(url, dialog_macos_selector("path"));
  const auto result = dialog_macos_utf8(pathObject);
  dialog_macos_drain_pool(pool);
  return result;
}

jayess_dialog_nsinteger dialog_macos_alert_style(const object_ptr& options) {
  const auto kind = dialog_optional_string_option(options, "kind", "message");
  if (kind == "error") {
    return JAYESS_NS_ALERT_STYLE_CRITICAL;
  }
  if (kind == "warning") {
    return JAYESS_NS_ALERT_STYLE_WARNING;
  }
  return JAYESS_NS_ALERT_STYLE_INFORMATIONAL;
}

value dialog_macos_message(const value& optionsValue) {
  if (dialog_macos_has_override("JAYESS_DIALOG_TEST_MESSAGE")) {
    return dialog_macos_message_override("JAYESS_DIALOG_TEST_MESSAGE");
  }

  auto& api = dialog_macos_api();
  auto pool = dialog_macos_autorelease_pool();
  const auto options = dialog_require_options_object(optionsValue, "message");
  const auto title = dialog_optional_string_option(options, "title", "message");
  const auto messageText = dialog_optional_string_option(options, "message", "message");
  const auto detail = dialog_optional_string_option(options, "detail", "message");
  const auto buttons = dialog_optional_string_option(options, "buttons", "message");

  auto alertClass = api.get_class("NSAlert");
  auto allocFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto initFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  auto alert = allocFn(alertClass, dialog_macos_selector("alloc"));
  alert = initFn(alert, dialog_macos_selector("init"));

  auto setStringFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  auto setStyleFn = reinterpret_cast<void (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_nsinteger)>(api.msg_send);
  auto addButtonFn = reinterpret_cast<jayess_dialog_objc_id (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel, jayess_dialog_objc_id)>(api.msg_send);
  setStringFn(alert, dialog_macos_selector("setMessageText:"), dialog_macos_string(title.empty() ? messageText : title));
  if (!detail.empty() || !title.empty()) {
    setStringFn(alert, dialog_macos_selector("setInformativeText:"), dialog_macos_string(title.empty() ? detail : messageText + (detail.empty() ? "" : "\\n\\n" + detail)));
  }
  setStyleFn(alert, dialog_macos_selector("setAlertStyle:"), dialog_macos_alert_style(options));

  if (buttons == "yesNo") {
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("Yes"));
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("No"));
  } else if (buttons == "yesNoCancel") {
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("Yes"));
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("No"));
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("Cancel"));
  } else if (buttons == "okCancel") {
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("OK"));
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("Cancel"));
  } else {
    addButtonFn(alert, dialog_macos_selector("addButtonWithTitle:"), dialog_macos_string("OK"));
  }

  auto runFn = reinterpret_cast<jayess_dialog_nsinteger (*)(jayess_dialog_objc_id, jayess_dialog_objc_sel)>(api.msg_send);
  const auto response = runFn(alert, dialog_macos_selector("runModal"));
  dialog_macos_drain_pool(pool);

  if (buttons == "yesNo") {
    return response == JAYESS_NS_ALERT_SECOND_BUTTON ? std::string("no") : std::string("yes");
  }
  if (buttons == "yesNoCancel") {
    if (response == JAYESS_NS_ALERT_SECOND_BUTTON) {
      return std::string("no");
    }
    if (response == JAYESS_NS_ALERT_THIRD_BUTTON) {
      return std::string("cancel");
    }
    return std::string("yes");
  }
  if (buttons == "okCancel") {
    return response == JAYESS_NS_ALERT_SECOND_BUTTON ? std::string("cancel") : std::string("ok");
  }
  return std::string("ok");
}
#endif`;
}

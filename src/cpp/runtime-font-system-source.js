export function getFontSystemRuntimePrivateFragment() {
  return `bool font_option_bool(const value& options, const std::string& key, bool fallback) {
  const auto stored = font_option_field(options, key);
  if (std::holds_alternative<std::monostate>(stored)) {
    return fallback;
  }
  if (!std::holds_alternative<bool>(stored)) {
    throw std::runtime_error("Jayess font option must be boolean: " + key);
  }
  return std::get<bool>(stored);
}

std::vector<std::string> font_option_string_array(const value& options, const std::string& key, std::vector<std::string> fallback) {
  const auto stored = font_option_field(options, key);
  if (std::holds_alternative<std::monostate>(stored)) {
    return fallback;
  }
  if (!std::holds_alternative<array_ptr>(stored)) {
    throw std::runtime_error("Jayess font option must be an array of strings: " + key);
  }
  std::vector<std::string> output;
  for (const auto& item : std::get<array_ptr>(stored)->items) {
    if (!std::holds_alternative<std::string>(item)) {
      throw std::runtime_error("Jayess font option must be an array of strings: " + key);
    }
    const auto text = std::get<std::string>(item);
    if (!text.empty()) {
      output.push_back(text);
    }
  }
  return output;
}

std::string font_system_platform() {
#if defined(_WIN32)
  return "windows";
#elif defined(__APPLE__)
  return "macos";
#elif defined(__linux__)
  return "linux";
#else
  return "unknown";
#endif
}

std::vector<std::string> font_system_default_search_paths() {
#if defined(_WIN32)
#if defined(_MSC_VER)
  char* windirValue = nullptr;
  std::size_t windirSize = 0U;
  std::string root = "C:/Windows";
  if (_dupenv_s(&windirValue, &windirSize, "WINDIR") == 0 && windirValue != nullptr) {
    const auto text = std::string(windirValue);
    if (!text.empty()) {
      root = text;
    }
    std::free(windirValue);
  }
#else
  const char* windirValue = std::getenv("WINDIR");
  const auto root = windirValue == nullptr || std::string(windirValue).empty() ? std::string("C:/Windows") : std::string(windirValue);
#endif
  return {std::filesystem::path(root).append("Fonts").string()};
#elif defined(__APPLE__)
  return {"/System/Library/Fonts", "/Library/Fonts"};
#elif defined(__linux__)
  return {
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/truetype/noto",
    "/usr/share/fonts/opentype/noto",
    "/usr/share/fonts"
  };
#else
  return {};
#endif
}

std::vector<std::string> font_system_default_candidates() {
#if defined(_WIN32)
  return {"segoeui.ttf", "arial.ttf"};
#elif defined(__APPLE__)
  return {"SFNS.ttf", ".SFNS.ttf", "Arial.ttf", "Helvetica.ttc"};
#elif defined(__linux__)
  return {"DejaVuSans.ttf", "NotoSans-Regular.ttf", "Arial.ttf"};
#else
  return {};
#endif
}

value font_system_fallback_handle(const std::string& name, const value& options, const std::string& diagnostic) {
  const auto charWidth = font_option_number(options, "charWidth", 5.0);
  const auto charHeight = font_option_number(options, "charHeight", 7.0);
  const auto advance = font_option_number(options, "advance", charWidth + 1.0);
  const auto baseline = font_option_number(options, "baseline", charHeight - 1.0);
  const auto lineHeight = font_option_number(options, "lineHeight", charHeight + 1.0);
  const auto ascent = font_option_number(options, "ascent", baseline);
  const auto descent = font_option_number(options, "descent", lineHeight - baseline);
  return make_object({
    {"kind", std::string("system-font-fallback")},
    {"name", name},
    {"family", std::string("jayess-default-5x7")},
    {"sourcePath", std::string("")},
    {"sourceFormat", std::string("bitmap")},
    {"decodedFormat", std::string("bitmap")},
    {"systemFont", true},
    {"platform", font_system_platform()},
    {"fallbackUsed", true},
    {"diagnostic", diagnostic},
    {"ascent", ascent},
    {"descent", descent},
    {"charWidth", charWidth},
    {"charHeight", charHeight},
    {"advance", advance},
    {"baseline", baseline},
    {"lineHeight", lineHeight},
    {"fallbackGlyph", std::string("?")}
  });
}

void font_mark_system_handle(value& handle) {
  auto object = std::get<object_ptr>(handle);
  object->fields["systemFont"] = true;
  object->fields["platform"] = font_system_platform();
  object->fields["fallbackUsed"] = false;
}

value font_try_system_font(const std::string& name, const std::string& pathText, const value& options) {
  const auto kind = font_detect_kind(pathText);
  if (kind == "ttf" || kind == "otf-truetype") {
    font_validate_sfnt_directory(font_read_file(pathText));
    auto handle = font_make_handle(name, pathText, kind == "otf-truetype" ? "otf" : "ttf", "truetype", false, options);
    font_mark_system_handle(handle);
    return handle;
  }
  if (kind == "woff" || kind == "woff2") {
    const auto bytes = font_read_file(pathText);
    if (kind == "woff") {
      (void)font_reconstruct_woff_sfnt(bytes);
    } else {
      (void)font_reconstruct_woff2_sfnt(bytes);
    }
    const auto decodedFormat = font_woff_flavor(bytes);
    if (decodedFormat != "truetype") {
      throw std::runtime_error("Jayess system font web font flavor is unsupported");
    }
    auto handle = font_make_handle(name, pathText, kind, decodedFormat, true, options);
    font_mark_system_handle(handle);
    return handle;
  }
  throw std::runtime_error("Jayess system font file format is unsupported");
}`;
}

export function getFontSystemRuntimeCppFragment() {
  return `value font_system_default(const value& name, const value& options) {
  const auto fontName = font_optional_name(name, "system-default");
  if (font_option_bool(options, "disabled", false)) {
    return font_system_fallback_handle(fontName, options, "Jayess system font discovery was disabled");
  }

  const auto searchPaths = font_option_string_array(options, "searchPaths", font_system_default_search_paths());
  const auto candidates = font_option_string_array(options, "candidates", font_system_default_candidates());
  if (searchPaths.empty() || candidates.empty()) {
    return font_system_fallback_handle(fontName, options, "Jayess system font discovery had no search paths or candidates");
  }

  std::string lastDiagnostic = "Jayess system font discovery found no usable font";
  for (const auto& directory : searchPaths) {
    const auto root = std::filesystem::path(directory);
    for (const auto& candidate : candidates) {
      const auto fontPath = root / candidate;
      if (!std::filesystem::is_regular_file(fontPath)) {
        continue;
      }
      try {
        return font_try_system_font(fontName, fontPath.string(), options);
      } catch (const std::exception& error) {
        lastDiagnostic = error.what();
      }
    }
  }

  return font_system_fallback_handle(fontName, options, lastDiagnostic);
}`;
}

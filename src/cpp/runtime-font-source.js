import {
  getFontSystemRuntimeCppFragment,
  getFontSystemRuntimePrivateFragment
} from "./runtime-font-system-source.js";

export function getFontRuntimeHeaderFragment() {
  return `value font_kind(const value& path);
value font_load(const value& name, const value& path, const value& options);
value font_system_default(const value& name, const value& options);`;
}

export function getFontRuntimeCppFragment() {
  return `namespace {
std::string font_require_path(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess font path must be a string");
  }
  return std::get<std::string>(input);
}

std::string font_optional_name(const value& input, const std::string& fallback) {
  if (std::holds_alternative<std::monostate>(input)) {
    return fallback;
  }
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess font name must be a string or null");
  }
  const auto name = std::get<std::string>(input);
  return name.empty() ? fallback : name;
}

value font_option_field(const value& options, const std::string& key) {
  if (!std::holds_alternative<object_ptr>(options)) {
    return {};
  }
  const auto object = std::get<object_ptr>(options);
  const auto found = object->fields.find(key);
  if (found == object->fields.end()) {
    return {};
  }
  return found->second;
}

double font_option_number(const value& options, const std::string& key, double fallback) {
  const auto stored = font_option_field(options, key);
  if (std::holds_alternative<std::monostate>(stored)) {
    return fallback;
  }
  if (!std::holds_alternative<double>(stored)) {
    throw std::runtime_error("Jayess font option must be numeric: " + key);
  }
  const auto number = std::get<double>(stored);
  if (!std::isfinite(number) || number < 0.0) {
    throw std::runtime_error("Jayess font option must be a non-negative finite number: " + key);
  }
  return number;
}

std::string font_option_string(const value& options, const std::string& key, const std::string& fallback) {
  const auto stored = font_option_field(options, key);
  if (std::holds_alternative<std::monostate>(stored)) {
    return fallback;
  }
  if (!std::holds_alternative<std::string>(stored)) {
    throw std::runtime_error("Jayess font option must be a string: " + key);
  }
  const auto text = std::get<std::string>(stored);
  return text.empty() ? fallback : text;
}

std::string font_lower(std::string input) {
  std::transform(input.begin(), input.end(), input.begin(), [](unsigned char item) {
    return static_cast<char>(std::tolower(item));
  });
  return input;
}

std::string font_extension(const std::string& pathText) {
  return font_lower(std::filesystem::path(pathText).extension().generic_string());
}

std::string font_stem(const std::string& pathText) {
  const auto stem = std::filesystem::path(pathText).stem().generic_string();
  return stem.empty() ? "jayess-font" : stem;
}

std::vector<unsigned char> font_read_prefix(const std::string& pathText) {
  std::ifstream stream(std::filesystem::path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Jayess font file is missing or unreadable");
  }
  std::vector<unsigned char> bytes(16U);
  stream.read(reinterpret_cast<char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
  bytes.resize(static_cast<std::size_t>(stream.gcount()));
  return bytes;
}

std::vector<unsigned char> font_read_file(const std::string& pathText) {
  std::ifstream stream(std::filesystem::path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Jayess font file is missing or unreadable");
  }
  std::vector<unsigned char> bytes;
  stream.seekg(0, std::ios::end);
  const auto size = stream.tellg();
  if (size < 0) {
    throw std::runtime_error("Jayess font file size could not be read");
  }
  stream.seekg(0, std::ios::beg);
  bytes.resize(static_cast<std::size_t>(size));
  if (!bytes.empty()) {
    stream.read(reinterpret_cast<char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
  }
  return bytes;
}

std::uint16_t font_read_u16(const std::vector<unsigned char>& bytes, std::size_t offset, const std::string& message) {
  if (offset + 2U > bytes.size()) {
    throw std::runtime_error(message);
  }
  return static_cast<std::uint16_t>((static_cast<std::uint16_t>(bytes[offset]) << 8U) | static_cast<std::uint16_t>(bytes[offset + 1U]));
}

std::uint32_t font_read_u32(const std::vector<unsigned char>& bytes, std::size_t offset, const std::string& message) {
  if (offset + 4U > bytes.size()) {
    throw std::runtime_error(message);
  }
  return (static_cast<std::uint32_t>(bytes[offset]) << 24U)
    | (static_cast<std::uint32_t>(bytes[offset + 1U]) << 16U)
    | (static_cast<std::uint32_t>(bytes[offset + 2U]) << 8U)
    | static_cast<std::uint32_t>(bytes[offset + 3U]);
}

bool font_has_signature(const std::vector<unsigned char>& bytes, const char* signature) {
  return bytes.size() >= 4U
    && bytes[0] == static_cast<unsigned char>(signature[0])
    && bytes[1] == static_cast<unsigned char>(signature[1])
    && bytes[2] == static_cast<unsigned char>(signature[2])
    && bytes[3] == static_cast<unsigned char>(signature[3]);
}

bool font_has_true_type_version(const std::vector<unsigned char>& bytes) {
  return bytes.size() >= 4U && bytes[0] == 0x00U && bytes[1] == 0x01U && bytes[2] == 0x00U && bytes[3] == 0x00U;
}

void font_validate_sfnt_directory(const std::vector<unsigned char>& bytes) {
  if (bytes.size() < 12U) {
    throw std::runtime_error("Jayess font sfnt table directory is truncated");
  }
  const auto tableCount = font_read_u16(bytes, 4U, "Jayess font sfnt table directory is truncated");
  constexpr std::uint16_t kMaxReasonableTables = 256U;
  if (tableCount > kMaxReasonableTables) {
    throw std::runtime_error("Jayess font sfnt table directory has too many tables");
  }
  const auto directoryBytes = 12U + static_cast<std::size_t>(tableCount) * 16U;
  if (directoryBytes > bytes.size()) {
    throw std::runtime_error("Jayess font sfnt table directory is invalid");
  }
}

void font_append_u16(std::vector<unsigned char>& bytes, std::uint16_t value) {
  bytes.push_back(static_cast<unsigned char>((value >> 8U) & 0xffU));
  bytes.push_back(static_cast<unsigned char>(value & 0xffU));
}

void font_append_u32(std::vector<unsigned char>& bytes, std::uint32_t value) {
  bytes.push_back(static_cast<unsigned char>((value >> 24U) & 0xffU));
  bytes.push_back(static_cast<unsigned char>((value >> 16U) & 0xffU));
  bytes.push_back(static_cast<unsigned char>((value >> 8U) & 0xffU));
  bytes.push_back(static_cast<unsigned char>(value & 0xffU));
}

std::uint16_t font_max_power_two_exponent(std::uint16_t value) {
  std::uint16_t exponent = 0U;
  std::uint16_t current = 1U;
  while (static_cast<std::uint16_t>(current * 2U) <= value) {
    current = static_cast<std::uint16_t>(current * 2U);
    exponent = static_cast<std::uint16_t>(exponent + 1U);
  }
  return exponent;
}

std::uint32_t font_align4(std::uint32_t value) {
  return (value + 3U) & ~3U;
}

std::vector<unsigned char> font_zlib_stored_decode(const std::vector<unsigned char>& bytes, std::size_t offset, std::uint32_t length, std::uint32_t expectedSize) {
  if (offset + length > bytes.size() || length < 6U) {
    throw std::runtime_error("Jayess font WOFF compression metadata references invalid table data");
  }
  const auto end = offset + static_cast<std::size_t>(length);
  std::size_t cursor = offset;
  const auto cmf = bytes[cursor++];
  const auto flg = bytes[cursor++];
  if ((cmf & 0x0fU) != 8U || ((static_cast<unsigned int>(cmf) << 8U) + flg) % 31U != 0U) {
    throw std::runtime_error("Jayess font WOFF compressed table uses unsupported zlib metadata");
  }

  std::vector<unsigned char> output;
  while (cursor + 4U <= end) {
    const auto blockHeader = bytes[cursor++];
    const auto finalBlock = (blockHeader & 0x01U) != 0U;
    const auto blockType = (blockHeader >> 1U) & 0x03U;
    if (blockType != 0U) {
      throw std::runtime_error("Jayess font WOFF compressed table requires deflate compression support that is not implemented yet");
    }
    if (cursor + 4U > end) {
      throw std::runtime_error("Jayess font WOFF compressed table is truncated");
    }
    const auto blockLength = static_cast<std::uint16_t>(bytes[cursor] | (static_cast<std::uint16_t>(bytes[cursor + 1U]) << 8U));
    const auto inverseLength = static_cast<std::uint16_t>(bytes[cursor + 2U] | (static_cast<std::uint16_t>(bytes[cursor + 3U]) << 8U));
    cursor += 4U;
    if (static_cast<std::uint16_t>(blockLength ^ 0xffffU) != inverseLength) {
      throw std::runtime_error("Jayess font WOFF compressed table has invalid stored-block length metadata");
    }
    if (cursor + blockLength > end) {
      throw std::runtime_error("Jayess font WOFF compressed table is truncated");
    }
    output.insert(output.end(), bytes.begin() + static_cast<std::ptrdiff_t>(cursor), bytes.begin() + static_cast<std::ptrdiff_t>(cursor + blockLength));
    cursor += blockLength;
    if (finalBlock) {
      break;
    }
  }

  if (output.size() != expectedSize) {
    throw std::runtime_error("Jayess font WOFF compressed table decompressed to an unexpected size");
  }
  return output;
}

void font_validate_woff(const std::vector<unsigned char>& bytes);
void font_validate_woff2(const std::vector<unsigned char>& bytes);

std::vector<unsigned char> font_reconstruct_woff_sfnt(const std::vector<unsigned char>& bytes) {
  font_validate_woff(bytes);
  const auto tableCount = font_read_u16(bytes, 12U, "Jayess font WOFF compression metadata is truncated");
  const auto totalSfntSize = font_read_u32(bytes, 16U, "Jayess font WOFF compression metadata is truncated");
  std::vector<unsigned char> sfnt;
  sfnt.reserve(totalSfntSize);
  sfnt.insert(sfnt.end(), bytes.begin() + 4, bytes.begin() + 8);

  const auto exponent = font_max_power_two_exponent(tableCount);
  const auto searchRange = static_cast<std::uint16_t>((1U << exponent) * 16U);
  const auto entrySelector = exponent;
  const auto rangeShift = static_cast<std::uint16_t>(tableCount * 16U - searchRange);
  font_append_u16(sfnt, tableCount);
  font_append_u16(sfnt, searchRange);
  font_append_u16(sfnt, entrySelector);
  font_append_u16(sfnt, rangeShift);

  std::vector<std::vector<unsigned char>> tablePayloads;
  tablePayloads.reserve(tableCount);
  std::uint32_t tableWriteOffset = 12U + static_cast<std::uint32_t>(tableCount) * 16U;
  for (std::uint16_t index = 0; index < tableCount; index += 1U) {
    const auto entryOffset = 44U + static_cast<std::size_t>(index) * 20U;
    const auto tableOffset = font_read_u32(bytes, entryOffset + 4U, "Jayess font WOFF compression metadata has an invalid table directory");
    const auto compLength = font_read_u32(bytes, entryOffset + 8U, "Jayess font WOFF compression metadata has an invalid table directory");
    const auto origLength = font_read_u32(bytes, entryOffset + 12U, "Jayess font WOFF compression metadata has an invalid table directory");
    const auto checksum = font_read_u32(bytes, entryOffset + 16U, "Jayess font WOFF compression metadata has an invalid table directory");
    if (tableOffset + compLength > bytes.size()) {
      throw std::runtime_error("Jayess font WOFF compression metadata references invalid table data");
    }
    std::vector<unsigned char> payload;
    if (compLength == origLength) {
      payload.insert(payload.end(), bytes.begin() + tableOffset, bytes.begin() + tableOffset + compLength);
    } else {
      payload = font_zlib_stored_decode(bytes, tableOffset, compLength, origLength);
    }
    if (payload.size() != origLength) {
      throw std::runtime_error("Jayess font WOFF table payload size is invalid");
    }
    sfnt.insert(sfnt.end(), bytes.begin() + static_cast<std::ptrdiff_t>(entryOffset), bytes.begin() + static_cast<std::ptrdiff_t>(entryOffset + 4U));
    font_append_u32(sfnt, checksum);
    font_append_u32(sfnt, tableWriteOffset);
    font_append_u32(sfnt, origLength);
    tablePayloads.push_back(std::move(payload));
    tableWriteOffset = font_align4(tableWriteOffset + origLength);
  }

  for (const auto& payload : tablePayloads) {
    sfnt.insert(sfnt.end(), payload.begin(), payload.end());
    while (sfnt.size() % 4U != 0U) {
      sfnt.push_back(0U);
    }
  }
  if (sfnt.size() != totalSfntSize) {
    throw std::runtime_error("Jayess font WOFF reconstructed sfnt size does not match metadata");
  }
  font_validate_sfnt_directory(sfnt);
  return sfnt;
}

std::vector<unsigned char> font_reconstruct_woff2_sfnt(const std::vector<unsigned char>& bytes) {
  font_validate_woff2(bytes);
  const auto tableCount = font_read_u16(bytes, 12U, "Jayess font WOFF2 transform data is truncated");
  const auto totalSfntSize = font_read_u32(bytes, 16U, "Jayess font WOFF2 transform data is truncated");
  const auto compressedSize = font_read_u32(bytes, 20U, "Jayess font WOFF2 transform data is truncated");
  if (compressedSize != 0U || tableCount != 0U) {
    throw std::runtime_error("Jayess font WOFF2 Brotli table reconstruction is not implemented for non-empty fonts yet");
  }
  std::vector<unsigned char> sfnt;
  sfnt.reserve(totalSfntSize);
  sfnt.insert(sfnt.end(), bytes.begin() + 4, bytes.begin() + 8);
  font_append_u16(sfnt, 0U);
  font_append_u16(sfnt, 0U);
  font_append_u16(sfnt, 0U);
  font_append_u16(sfnt, 0U);
  font_validate_sfnt_directory(sfnt);
  return sfnt;
}

std::string font_woff_flavor(const std::vector<unsigned char>& bytes) {
  if (bytes.size() < 44U) {
    throw std::runtime_error("Jayess font WOFF compression metadata is truncated");
  }
  std::vector<unsigned char> flavor{bytes[4], bytes[5], bytes[6], bytes[7]};
  if (font_has_true_type_version(flavor) || font_has_signature(flavor, "true")) {
    return "truetype";
  }
  if (font_has_signature(flavor, "OTTO")) {
    return "cff";
  }
  return "unknown";
}

void font_validate_woff(const std::vector<unsigned char>& bytes) {
  if (bytes.size() < 44U) {
    throw std::runtime_error("Jayess font WOFF compression metadata is truncated");
  }
  const auto length = font_read_u32(bytes, 8U, "Jayess font WOFF compression metadata is truncated");
  const auto tableCount = font_read_u16(bytes, 12U, "Jayess font WOFF compression metadata is truncated");
  const auto totalSfntSize = font_read_u32(bytes, 16U, "Jayess font WOFF compression metadata is truncated");
  if (length != bytes.size()) {
    throw std::runtime_error("Jayess font WOFF compression metadata length does not match file size");
  }
  if (totalSfntSize < 12U) {
    throw std::runtime_error("Jayess font WOFF compression metadata has an invalid sfnt size");
  }
  const auto directoryBytes = 44U + static_cast<std::size_t>(tableCount) * 20U;
  if (directoryBytes > bytes.size()) {
    throw std::runtime_error("Jayess font WOFF compression metadata has an invalid table directory");
  }
}

void font_validate_woff2(const std::vector<unsigned char>& bytes) {
  if (bytes.size() < 48U) {
    throw std::runtime_error("Jayess font WOFF2 transform data is truncated");
  }
  const auto length = font_read_u32(bytes, 8U, "Jayess font WOFF2 transform data is truncated");
  const auto tableCount = font_read_u16(bytes, 12U, "Jayess font WOFF2 transform data is truncated");
  const auto totalSfntSize = font_read_u32(bytes, 16U, "Jayess font WOFF2 transform data is truncated");
  const auto compressedSize = font_read_u32(bytes, 20U, "Jayess font WOFF2 transform data is truncated");
  if (length != bytes.size()) {
    throw std::runtime_error("Jayess font WOFF2 transform data length does not match file size");
  }
  if (totalSfntSize < 12U) {
    throw std::runtime_error("Jayess font WOFF2 transform data has an invalid sfnt size");
  }
  if (compressedSize != 0U || tableCount != 0U) {
    throw std::runtime_error("Jayess font WOFF2 transform data requires decoder support that is not implemented yet");
  }
}

std::string font_detect_kind(const std::string& pathText) {
  const auto extension = font_extension(pathText);
  if (extension == ".json") {
    return "bitmap-json";
  }

  const auto bytes = font_read_prefix(pathText);
  if (font_has_true_type_version(bytes) || font_has_signature(bytes, "true")) {
    return extension == ".otf" ? "otf-truetype" : "ttf";
  }
  if (font_has_signature(bytes, "OTTO")) {
    return "otf-cff";
  }
  if (font_has_signature(bytes, "wOFF")) {
    return "woff";
  }
  if (font_has_signature(bytes, "wOF2")) {
    return "woff2";
  }
  return "unknown";
}

value font_make_handle(
  const std::string& name,
  const std::string& pathText,
  const std::string& sourceFormat,
  const std::string& decodedFormat,
  bool compressed,
  const value& options
) {
  const auto family = font_option_string(options, "family", name);
  const auto charWidth = font_option_number(options, "charWidth", 5.0);
  const auto charHeight = font_option_number(options, "charHeight", 7.0);
  const auto advance = font_option_number(options, "advance", charWidth + 1.0);
  const auto baseline = font_option_number(options, "baseline", charHeight - 1.0);
  const auto lineHeight = font_option_number(options, "lineHeight", charHeight + 1.0);
  const auto ascent = font_option_number(options, "ascent", baseline);
  const auto descent = font_option_number(options, "descent", lineHeight - baseline);
  const auto fallbackGlyph = font_option_string(options, "fallbackGlyph", "?");
  const auto rasterizer = font_option_string(options, "rasterizer", "fallback");
  if (rasterizer != "fallback") {
    throw std::runtime_error("Jayess font rasterization is unsupported for file-backed fonts");
  }
  return make_object({
    {"kind", std::string("vector-font")},
    {"name", name},
    {"family", family},
    {"sourcePath", pathText},
    {"sourceFormat", sourceFormat},
    {"decodedFormat", decodedFormat},
    {"outlineFormat", std::string("glyf")},
    {"compressed", compressed},
    {"metricsOnly", true},
    {"ascent", ascent},
    {"descent", descent},
    {"charWidth", charWidth},
    {"charHeight", charHeight},
    {"advance", advance},
    {"baseline", baseline},
    {"lineHeight", lineHeight},
    {"glyphCache", make_object({})},
    {"fallbackGlyph", fallbackGlyph},
    {"fallbackGlyphName", std::string("jayess-default-question")}
  });
}

${getFontSystemRuntimePrivateFragment()}
} // namespace

value font_kind(const value& path) {
  return font_detect_kind(font_require_path(path));
}

value font_load(const value& name, const value& path, const value& options) {
  (void)options;
  const auto pathText = font_require_path(path);
  const auto kind = font_detect_kind(pathText);
  const auto fontName = font_optional_name(name, font_stem(pathText));

  if (kind == "ttf" || kind == "otf-truetype") {
    font_validate_sfnt_directory(font_read_file(pathText));
    return font_make_handle(fontName, pathText, kind == "otf-truetype" ? "otf" : "ttf", "truetype", false, options);
  }
  if (kind == "otf-cff") {
    throw std::runtime_error("Jayess font OTF/CFF outlines are not supported yet; use a TrueType glyf font");
  }
  if (kind == "woff" || kind == "woff2") {
    const auto bytes = font_read_file(pathText);
    std::vector<unsigned char> sfnt;
    if (kind == "woff") {
      sfnt = font_reconstruct_woff_sfnt(bytes);
    } else {
      sfnt = font_reconstruct_woff2_sfnt(bytes);
    }
    (void)sfnt;
    const auto decodedFormat = font_woff_flavor(bytes);
    if (decodedFormat == "cff") {
      throw std::runtime_error("Jayess font WOFF CFF outlines are not supported yet; use a TrueType glyf font");
    }
    if (decodedFormat != "truetype") {
      throw std::runtime_error("Jayess font web font flavor is unsupported");
    }
    return font_make_handle(fontName, pathText, kind, decodedFormat, true, options);
  }
  if (kind == "bitmap-json") {
    throw std::runtime_error("Jayess font bitmap JSON files are loaded by the Jayess font module");
  }

  throw std::runtime_error("Jayess font file format is unsupported");
}

${getFontSystemRuntimeCppFragment()}`;
}

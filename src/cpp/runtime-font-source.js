import {
  getFontSystemRuntimeCppFragment,
  getFontSystemRuntimePrivateFragment
} from "./runtime-font-system-source.js";

export function getFontRuntimeHeaderFragment() {
  return `value font_kind(const value& path);
value font_load(const value& name, const value& path, const value& options);
value font_glyph_rows(const value& fontValue, const value& charValue);
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

std::filesystem::path font_resolve_existing_path(const std::string& pathText) {
  const auto direct = std::filesystem::path(pathText);
  if (std::filesystem::exists(direct)) {
    return direct;
  }
  const auto generatedSibling = std::filesystem::path("..") / "cpp" / direct;
  if (std::filesystem::exists(generatedSibling)) {
    return generatedSibling;
  }
  const auto parentSibling = std::filesystem::path("..") / direct;
  if (std::filesystem::exists(parentSibling)) {
    return parentSibling;
  }
  return direct;
}

std::vector<unsigned char> font_read_prefix(const std::string& pathText) {
  std::ifstream stream(font_resolve_existing_path(pathText), std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Jayess font file is missing or unreadable");
  }
  std::vector<unsigned char> bytes(16U);
  stream.read(reinterpret_cast<char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
  bytes.resize(static_cast<std::size_t>(stream.gcount()));
  return bytes;
}

std::vector<unsigned char> font_read_file(const std::string& pathText) {
  std::ifstream stream(font_resolve_existing_path(pathText), std::ios::binary);
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
  const auto charWidth = font_option_number(options, "charWidth", 8.0);
  const auto charHeight = font_option_number(options, "charHeight", 12.0);
  const auto advance = font_option_number(options, "advance", charWidth + 1.0);
  const auto baseline = font_option_number(options, "baseline", charHeight - 1.0);
  const auto lineHeight = font_option_number(options, "lineHeight", charHeight + 1.0);
  const auto ascent = font_option_number(options, "ascent", baseline);
  const auto descent = font_option_number(options, "descent", lineHeight - baseline);
  const auto fallbackGlyph = font_option_string(options, "fallbackGlyph", "?");
  return make_object({
    {"kind", std::string("vector-font")},
    {"name", name},
    {"family", family},
    {"sourcePath", pathText},
    {"sourceFormat", sourceFormat},
    {"decodedFormat", decodedFormat},
    {"outlineFormat", std::string("glyf")},
    {"compressed", compressed},
    {"metricsOnly", decodedFormat != "truetype"},
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

std::int16_t font_read_i16(const std::vector<unsigned char>& bytes, std::size_t offset, const std::string& message) {
  return static_cast<std::int16_t>(font_read_u16(bytes, offset, message));
}

double font_object_number(const object_ptr& object, const std::string& key, double fallback) {
  const auto found = object->fields.find(key);
  if (found == object->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<double>(found->second)) {
    return fallback;
  }
  return std::get<double>(found->second);
}

std::string font_object_string(const object_ptr& object, const std::string& key, const std::string& fallback) {
  const auto found = object->fields.find(key);
  if (found == object->fields.end() || std::holds_alternative<std::monostate>(found->second)) {
    return fallback;
  }
  if (!std::holds_alternative<std::string>(found->second)) {
    return fallback;
  }
  return std::get<std::string>(found->second);
}

std::uint32_t font_utf8_codepoint(const std::string& text) {
  if (text.empty()) {
    return 0U;
  }
  const auto first = static_cast<unsigned char>(text[0]);
  if (first < 0x80U) {
    return first;
  }
  if ((first & 0xe0U) == 0xc0U && text.size() >= 2U) {
    return ((first & 0x1fU) << 6U) | (static_cast<unsigned char>(text[1]) & 0x3fU);
  }
  if ((first & 0xf0U) == 0xe0U && text.size() >= 3U) {
    return ((first & 0x0fU) << 12U)
      | ((static_cast<unsigned char>(text[1]) & 0x3fU) << 6U)
      | (static_cast<unsigned char>(text[2]) & 0x3fU);
  }
  if ((first & 0xf8U) == 0xf0U && text.size() >= 4U) {
    return ((first & 0x07U) << 18U)
      | ((static_cast<unsigned char>(text[1]) & 0x3fU) << 12U)
      | ((static_cast<unsigned char>(text[2]) & 0x3fU) << 6U)
      | (static_cast<unsigned char>(text[3]) & 0x3fU);
  }
  return 0U;
}

struct font_table_record {
  std::uint32_t offset = 0U;
  std::uint32_t length = 0U;
};

using font_table_map = std::unordered_map<std::string, font_table_record>;

std::string font_table_tag(const std::vector<unsigned char>& bytes, std::size_t offset) {
  if (offset + 4U > bytes.size()) {
    throw std::runtime_error("Jayess font table tag is truncated");
  }
  return std::string{
    static_cast<char>(bytes[offset]),
    static_cast<char>(bytes[offset + 1U]),
    static_cast<char>(bytes[offset + 2U]),
    static_cast<char>(bytes[offset + 3U])
  };
}

font_table_map font_tables(const std::vector<unsigned char>& bytes) {
  font_validate_sfnt_directory(bytes);
  const auto tableCount = font_read_u16(bytes, 4U, "Jayess font sfnt table directory is truncated");
  font_table_map tables;
  for (std::uint16_t index = 0; index < tableCount; index += 1U) {
    const auto offset = 12U + static_cast<std::size_t>(index) * 16U;
    const auto tag = font_table_tag(bytes, offset);
    const auto tableOffset = font_read_u32(bytes, offset + 8U, "Jayess font table record is truncated");
    const auto tableLength = font_read_u32(bytes, offset + 12U, "Jayess font table record is truncated");
    if (tableOffset + tableLength > bytes.size()) {
      throw std::runtime_error("Jayess font table record references invalid data");
    }
    tables[tag] = font_table_record{tableOffset, tableLength};
  }
  return tables;
}

font_table_record font_required_table(const font_table_map& tables, const std::string& tag) {
  const auto found = tables.find(tag);
  if (found == tables.end()) {
    throw std::runtime_error("Jayess font missing required table " + tag);
  }
  return found->second;
}

std::uint16_t font_glyph_id_format4(const std::vector<unsigned char>& bytes, std::uint32_t cmapOffset, std::uint32_t codepoint) {
  const auto segCount = font_read_u16(bytes, cmapOffset + 6U, "Jayess font cmap format 4 is truncated") / 2U;
  const auto endCodes = cmapOffset + 14U;
  const auto startCodes = endCodes + static_cast<std::size_t>(segCount) * 2U + 2U;
  const auto idDeltas = startCodes + static_cast<std::size_t>(segCount) * 2U;
  const auto idRangeOffsets = idDeltas + static_cast<std::size_t>(segCount) * 2U;
  for (std::uint16_t index = 0; index < segCount; index += 1U) {
    const auto endCode = font_read_u16(bytes, endCodes + static_cast<std::size_t>(index) * 2U, "Jayess font cmap endCode is truncated");
    const auto startCode = font_read_u16(bytes, startCodes + static_cast<std::size_t>(index) * 2U, "Jayess font cmap startCode is truncated");
    if (codepoint < startCode || codepoint > endCode) {
      continue;
    }
    const auto delta = font_read_i16(bytes, idDeltas + static_cast<std::size_t>(index) * 2U, "Jayess font cmap idDelta is truncated");
    const auto rangeOffsetLocation = idRangeOffsets + static_cast<std::size_t>(index) * 2U;
    const auto rangeOffset = font_read_u16(bytes, rangeOffsetLocation, "Jayess font cmap idRangeOffset is truncated");
    if (rangeOffset == 0U) {
      return static_cast<std::uint16_t>((codepoint + delta) & 0xffffU);
    }
    const auto glyphOffset = rangeOffsetLocation + rangeOffset + static_cast<std::size_t>(codepoint - startCode) * 2U;
    const auto glyph = font_read_u16(bytes, glyphOffset, "Jayess font cmap glyphIdArray is truncated");
    if (glyph == 0U) {
      return 0U;
    }
    return static_cast<std::uint16_t>((glyph + delta) & 0xffffU);
  }
  return 0U;
}

std::uint16_t font_glyph_id_format12(const std::vector<unsigned char>& bytes, std::uint32_t cmapOffset, std::uint32_t codepoint) {
  const auto groups = font_read_u32(bytes, cmapOffset + 12U, "Jayess font cmap format 12 is truncated");
  std::size_t cursor = cmapOffset + 16U;
  for (std::uint32_t index = 0; index < groups; index += 1U) {
    const auto startChar = font_read_u32(bytes, cursor, "Jayess font cmap format 12 group is truncated");
    const auto endChar = font_read_u32(bytes, cursor + 4U, "Jayess font cmap format 12 group is truncated");
    const auto startGlyph = font_read_u32(bytes, cursor + 8U, "Jayess font cmap format 12 group is truncated");
    if (codepoint >= startChar && codepoint <= endChar) {
      return static_cast<std::uint16_t>(startGlyph + codepoint - startChar);
    }
    cursor += 12U;
  }
  return 0U;
}

std::uint16_t font_glyph_id(const std::vector<unsigned char>& bytes, const font_table_map& tables, std::uint32_t codepoint) {
  const auto cmap = font_required_table(tables, "cmap");
  const auto subtables = font_read_u16(bytes, cmap.offset + 2U, "Jayess font cmap table is truncated");
  std::uint32_t best4 = 0U;
  std::uint32_t best12 = 0U;
  for (std::uint16_t index = 0; index < subtables; index += 1U) {
    const auto entry = cmap.offset + 4U + static_cast<std::size_t>(index) * 8U;
    const auto platform = font_read_u16(bytes, entry, "Jayess font cmap encoding record is truncated");
    const auto encoding = font_read_u16(bytes, entry + 2U, "Jayess font cmap encoding record is truncated");
    const auto subOffset = cmap.offset + font_read_u32(bytes, entry + 4U, "Jayess font cmap encoding record is truncated");
    const auto format = font_read_u16(bytes, subOffset, "Jayess font cmap subtable is truncated");
    if (format == 12U && (platform == 3U || platform == 0U)) {
      best12 = subOffset;
      if (encoding == 10U) {
        break;
      }
    } else if (format == 4U && best4 == 0U && (platform == 3U || platform == 0U)) {
      best4 = subOffset;
    }
  }
  if (best12 != 0U) {
    return font_glyph_id_format12(bytes, best12, codepoint);
  }
  if (best4 != 0U && codepoint <= 0xffffU) {
    return font_glyph_id_format4(bytes, best4, codepoint);
  }
  return 0U;
}

struct font_point {
  double x = 0.0;
  double y = 0.0;
  bool on = false;
};

struct font_polygon {
  std::vector<font_point> points;
};

std::uint32_t font_loca_offset(const std::vector<unsigned char>& bytes, const font_table_map& tables, std::uint16_t glyphId, bool longOffsets) {
  const auto loca = font_required_table(tables, "loca");
  if (longOffsets) {
    return font_read_u32(bytes, loca.offset + static_cast<std::size_t>(glyphId) * 4U, "Jayess font loca table is truncated");
  }
  return static_cast<std::uint32_t>(font_read_u16(bytes, loca.offset + static_cast<std::size_t>(glyphId) * 2U, "Jayess font loca table is truncated")) * 2U;
}

void font_append_quadratic(std::vector<font_point>& output, font_point from, font_point control, font_point to) {
  constexpr int steps = 8;
  for (int step = 1; step <= steps; step += 1) {
    const auto t = static_cast<double>(step) / static_cast<double>(steps);
    const auto mt = 1.0 - t;
    output.push_back(font_point{
      mt * mt * from.x + 2.0 * mt * t * control.x + t * t * to.x,
      mt * mt * from.y + 2.0 * mt * t * control.y + t * t * to.y,
      true
    });
  }
}

font_point font_midpoint(font_point left, font_point right) {
  return font_point{(left.x + right.x) / 2.0, (left.y + right.y) / 2.0, true};
}

font_polygon font_flatten_contour(const std::vector<font_point>& contour) {
  font_polygon polygon;
  if (contour.empty()) {
    return polygon;
  }
  std::size_t startIndex = 0U;
  font_point current;
  if (contour[0].on) {
    current = contour[0];
    startIndex = 1U;
  } else if (contour.back().on) {
    current = contour.back();
  } else {
    current = font_midpoint(contour.back(), contour[0]);
  }
  polygon.points.push_back(current);
  std::size_t index = startIndex;
  while (index < contour.size() + startIndex) {
    const auto point = contour[index % contour.size()];
    if (point.on) {
      polygon.points.push_back(point);
      current = point;
      index += 1U;
    } else {
      const auto next = contour[(index + 1U) % contour.size()];
      const auto end = next.on ? next : font_midpoint(point, next);
      font_append_quadratic(polygon.points, current, point, end);
      current = end;
      index += next.on ? 2U : 1U;
    }
  }
  return polygon;
}

bool font_even_odd_contains(const std::vector<font_polygon>& polygons, double x, double y) {
  bool inside = false;
  for (const auto& polygon : polygons) {
    const auto& points = polygon.points;
    if (points.size() < 3U) {
      continue;
    }
    std::size_t previous = points.size() - 1U;
    for (std::size_t current = 0U; current < points.size(); current += 1U) {
      const auto& a = points[current];
      const auto& b = points[previous];
      if (((a.y > y) != (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) {
        inside = !inside;
      }
      previous = current;
    }
  }
  return inside;
}

std::vector<font_polygon> font_read_glyph_polygons(
  const std::vector<unsigned char>& bytes,
  const font_table_map& tables,
  std::uint16_t glyphId,
  bool longOffsets,
  int depth
) {
  if (depth > 8) {
    return {};
  }
  const auto glyf = font_required_table(tables, "glyf");
  const auto start = font_loca_offset(bytes, tables, glyphId, longOffsets);
  const auto end = font_loca_offset(bytes, tables, static_cast<std::uint16_t>(glyphId + 1U), longOffsets);
  if (end <= start) {
    return {};
  }
  const auto offset = glyf.offset + start;
  const auto contourCount = font_read_i16(bytes, offset, "Jayess font glyph header is truncated");
  if (contourCount < 0) {
    std::vector<font_polygon> combined;
    std::size_t cursor = offset + 10U;
    bool more = true;
    while (more) {
      const auto flags = font_read_u16(bytes, cursor, "Jayess font composite glyph is truncated");
      const auto componentGlyph = font_read_u16(bytes, cursor + 2U, "Jayess font composite glyph is truncated");
      cursor += 4U;
      double dx = 0.0;
      double dy = 0.0;
      if ((flags & 0x0001U) != 0U) {
        dx = font_read_i16(bytes, cursor, "Jayess font composite glyph args are truncated");
        dy = font_read_i16(bytes, cursor + 2U, "Jayess font composite glyph args are truncated");
        cursor += 4U;
      } else {
        dx = static_cast<std::int8_t>(bytes[cursor]);
        dy = static_cast<std::int8_t>(bytes[cursor + 1U]);
        cursor += 2U;
      }
      double scaleX = 1.0;
      double scaleY = 1.0;
      if ((flags & 0x0008U) != 0U) {
        scaleX = scaleY = static_cast<double>(font_read_i16(bytes, cursor, "Jayess font composite scale is truncated")) / 16384.0;
        cursor += 2U;
      } else if ((flags & 0x0040U) != 0U) {
        scaleX = static_cast<double>(font_read_i16(bytes, cursor, "Jayess font composite scale is truncated")) / 16384.0;
        scaleY = static_cast<double>(font_read_i16(bytes, cursor + 2U, "Jayess font composite scale is truncated")) / 16384.0;
        cursor += 4U;
      } else if ((flags & 0x0080U) != 0U) {
        cursor += 8U;
      }
      auto parts = font_read_glyph_polygons(bytes, tables, componentGlyph, longOffsets, depth + 1);
      for (auto& polygon : parts) {
        for (auto& point : polygon.points) {
          point.x = point.x * scaleX + dx;
          point.y = point.y * scaleY + dy;
        }
        combined.push_back(std::move(polygon));
      }
      more = (flags & 0x0020U) != 0U;
    }
    return combined;
  }
  if (contourCount == 0) {
    return {};
  }
  std::vector<std::uint16_t> endPts;
  endPts.reserve(static_cast<std::size_t>(contourCount));
  auto cursor = offset + 10U;
  for (std::int16_t index = 0; index < contourCount; index += 1) {
    endPts.push_back(font_read_u16(bytes, cursor, "Jayess font simple glyph contour metadata is truncated"));
    cursor += 2U;
  }
  const auto instructionLength = font_read_u16(bytes, cursor, "Jayess font simple glyph instruction metadata is truncated");
  cursor += 2U + instructionLength;
  const auto pointCount = static_cast<std::size_t>(endPts.back()) + 1U;
  std::vector<unsigned char> flags;
  flags.reserve(pointCount);
  while (flags.size() < pointCount) {
    const auto flag = bytes[cursor++];
    flags.push_back(flag);
    if ((flag & 0x08U) != 0U) {
      const auto repeat = bytes[cursor++];
      for (unsigned char count = 0U; count < repeat; count += 1U) {
        flags.push_back(flag);
      }
    }
  }
  std::vector<font_point> points(pointCount);
  std::int32_t x = 0;
  for (std::size_t index = 0; index < pointCount; index += 1U) {
    const auto flag = flags[index];
    if ((flag & 0x02U) != 0U) {
      const auto delta = static_cast<std::int32_t>(bytes[cursor++]);
      x += (flag & 0x10U) != 0U ? delta : -delta;
    } else if ((flag & 0x10U) == 0U) {
      x += font_read_i16(bytes, cursor, "Jayess font simple glyph x coordinate is truncated");
      cursor += 2U;
    }
    points[index].x = static_cast<double>(x);
    points[index].on = (flag & 0x01U) != 0U;
  }
  std::int32_t y = 0;
  for (std::size_t index = 0; index < pointCount; index += 1U) {
    const auto flag = flags[index];
    if ((flag & 0x04U) != 0U) {
      const auto delta = static_cast<std::int32_t>(bytes[cursor++]);
      y += (flag & 0x20U) != 0U ? delta : -delta;
    } else if ((flag & 0x20U) == 0U) {
      y += font_read_i16(bytes, cursor, "Jayess font simple glyph y coordinate is truncated");
      cursor += 2U;
    }
    points[index].y = static_cast<double>(y);
  }
  std::vector<font_polygon> polygons;
  std::size_t startPoint = 0U;
  for (const auto endPoint : endPts) {
    std::vector<font_point> contour;
    for (std::size_t index = startPoint; index <= endPoint; index += 1U) {
      contour.push_back(points[index]);
    }
    polygons.push_back(font_flatten_contour(contour));
    startPoint = static_cast<std::size_t>(endPoint) + 1U;
  }
  return polygons;
}

struct font_horizontal_metric {
  std::uint16_t advanceWidth = 0;
  std::int16_t leftSideBearing = 0;
};

font_horizontal_metric font_read_horizontal_metric(
  const std::vector<std::uint8_t>& bytes,
  const std::unordered_map<std::string, font_table_record>& tables,
  std::uint16_t glyphId,
  std::uint16_t numberOfHMetrics
) {
  const auto hmtx = font_required_table(tables, "hmtx");
  if (numberOfHMetrics == 0U) {
    throw std::runtime_error("Jayess font hhea table has no horizontal metrics");
  }
  if (glyphId < numberOfHMetrics) {
    const auto offset = hmtx.offset + static_cast<std::uint32_t>(glyphId) * 4U;
    return {
      font_read_u16(bytes, offset, "Jayess font hmtx advance is truncated"),
      font_read_i16(bytes, offset + 2U, "Jayess font hmtx bearing is truncated")
    };
  }
  const auto lastMetricOffset = hmtx.offset + static_cast<std::uint32_t>(numberOfHMetrics - 1U) * 4U;
  const auto lsbOffset = hmtx.offset
    + static_cast<std::uint32_t>(numberOfHMetrics) * 4U
    + static_cast<std::uint32_t>(glyphId - numberOfHMetrics) * 2U;
  return {
    font_read_u16(bytes, lastMetricOffset, "Jayess font hmtx fallback advance is truncated"),
    font_read_i16(bytes, lsbOffset, "Jayess font hmtx fallback bearing is truncated")
  };
}

bool font_coverage_enabled(char value) {
  return value >= '1' && value <= '9';
}

std::vector<std::string> font_preserve_thin_strokes(const std::vector<std::string>& rows, int pixelHeight) {
  if (pixelHeight <= 0 || pixelHeight > 24 || rows.empty()) {
    return rows;
  }
  auto strengthened = rows;
  const auto height = static_cast<int>(rows.size());
  const auto width = static_cast<int>(rows[0].size());
  for (int row = 0; row < height; row += 1) {
    for (int column = 0; column < width; column += 1) {
      if (rows[static_cast<std::size_t>(row)][static_cast<std::size_t>(column)] != '0') {
        continue;
      }
      const auto left = column > 0 && font_coverage_enabled(rows[static_cast<std::size_t>(row)][static_cast<std::size_t>(column - 1)]);
      const auto right = column + 1 < width && font_coverage_enabled(rows[static_cast<std::size_t>(row)][static_cast<std::size_t>(column + 1)]);
      const auto up = row > 0 && font_coverage_enabled(rows[static_cast<std::size_t>(row - 1)][static_cast<std::size_t>(column)]);
      const auto down = row + 1 < height && font_coverage_enabled(rows[static_cast<std::size_t>(row + 1)][static_cast<std::size_t>(column)]);
      const auto upLeft = row > 0 && column > 0 && font_coverage_enabled(rows[static_cast<std::size_t>(row - 1)][static_cast<std::size_t>(column - 1)]);
      const auto upRight = row > 0 && column + 1 < width && font_coverage_enabled(rows[static_cast<std::size_t>(row - 1)][static_cast<std::size_t>(column + 1)]);
      const auto downLeft = row + 1 < height && column > 0 && font_coverage_enabled(rows[static_cast<std::size_t>(row + 1)][static_cast<std::size_t>(column - 1)]);
      const auto downRight = row + 1 < height && column + 1 < width && font_coverage_enabled(rows[static_cast<std::size_t>(row + 1)][static_cast<std::size_t>(column + 1)]);
      if ((left && right) || (up && down) || (upLeft && downRight) || (upRight && downLeft)) {
        strengthened[static_cast<std::size_t>(row)][static_cast<std::size_t>(column)] = '1';
      }
    }
  }
  return strengthened;
}

std::vector<std::string> font_rasterize_rows(
  const std::vector<font_polygon>& polygons,
  int pixelHeight,
  double ascender,
  double descender,
  double advanceWidth
) {
  std::vector<std::string> rows;
  if (pixelHeight <= 0 || polygons.empty()) {
    return rows;
  }
  auto metricHeight = ascender - descender;
  if (metricHeight <= 0.0 || advanceWidth <= 0.0) {
    return rows;
  }
  const auto scale = static_cast<double>(pixelHeight) / metricHeight;
  const auto width = static_cast<int>(std::max(1.0, std::ceil(advanceWidth * scale)));
  rows.resize(static_cast<std::size_t>(pixelHeight), std::string(static_cast<std::size_t>(width), '0'));
  constexpr int samples = 5;
  constexpr int totalSamples = samples * samples;
  for (int row = 0; row < pixelHeight; row += 1) {
    for (int column = 0; column < width; column += 1) {
      int covered = 0;
      for (int sy = 0; sy < samples; sy += 1) {
        for (int sx = 0; sx < samples; sx += 1) {
          const auto sampleX = static_cast<double>(column) + (static_cast<double>(sx) + 0.5) / static_cast<double>(samples);
          const auto sampleY = static_cast<double>(row) + (static_cast<double>(sy) + 0.5) / static_cast<double>(samples);
          const auto fontX = sampleX / scale;
          const auto fontY = ascender - (sampleY / scale);
          if (font_even_odd_contains(polygons, fontX, fontY)) {
            covered += 1;
          }
        }
      }
      if (covered > 0) {
        const auto bucket = std::max(1, static_cast<int>(std::ceil(static_cast<double>(covered) * 9.0 / static_cast<double>(totalSamples))));
        rows[static_cast<std::size_t>(row)][static_cast<std::size_t>(column)] = static_cast<char>('0' + bucket);
      }
    }
  }
  return font_preserve_thin_strokes(rows, pixelHeight);
}

value font_rows_value(const std::vector<std::string>& rows) {
  std::vector<value> values;
  values.reserve(rows.size());
  for (const auto& row : rows) {
    values.push_back(row);
  }
  return make_array(std::move(values));
}

value font_render_glyph_rows(const value& fontValue, const value& charValue) {
  if (!std::holds_alternative<object_ptr>(fontValue) || !std::holds_alternative<std::string>(charValue)) {
    throw std::runtime_error("Jayess font glyphRows expects a font and character");
  }
  const auto font = std::get<object_ptr>(fontValue);
  const auto pathText = font_object_string(font, "sourcePath", "");
  const auto sourceFormat = font_object_string(font, "sourceFormat", "");
  const auto decodedFormat = font_object_string(font, "decodedFormat", "");
  if (pathText.empty() || decodedFormat == "cff" || sourceFormat == "woff2") {
    return make_array({});
  }
  auto bytes = font_read_file(pathText);
  if (sourceFormat == "woff") {
    bytes = font_reconstruct_woff_sfnt(bytes);
  }
  const auto tables = font_tables(bytes);
  const auto head = font_required_table(tables, "head");
  const auto hhea = font_required_table(tables, "hhea");
  const auto maxp = font_required_table(tables, "maxp");
  const auto unitsPerEm = font_read_u16(bytes, head.offset + 18U, "Jayess font head units-per-em is truncated");
  auto ascender = static_cast<double>(font_read_i16(bytes, hhea.offset + 4U, "Jayess font hhea ascender is truncated"));
  auto descender = static_cast<double>(font_read_i16(bytes, hhea.offset + 6U, "Jayess font hhea descender is truncated"));
  const auto numberOfHMetrics = font_read_u16(bytes, hhea.offset + 34U, "Jayess font hhea metric count is truncated");
  const auto glyphCount = font_read_u16(bytes, maxp.offset + 4U, "Jayess font maxp table is truncated");
  const auto longOffsets = font_read_i16(bytes, head.offset + 50U, "Jayess font head table is truncated") == 1;
  const auto codepoint = font_utf8_codepoint(std::get<std::string>(charValue));
  const auto glyphId = font_glyph_id(bytes, tables, codepoint);
  if (glyphId == 0U || glyphId >= glyphCount) {
    return make_array({});
  }
  const auto charHeight = static_cast<int>(std::max(1.0, std::round(font_object_number(font, "charHeight", 12.0))));
  if (ascender <= descender) {
    ascender = static_cast<double>(unitsPerEm);
    descender = 0.0;
  }
  const auto metric = font_read_horizontal_metric(bytes, tables, glyphId, numberOfHMetrics);
  return font_rows_value(font_rasterize_rows(
    font_read_glyph_polygons(bytes, tables, glyphId, longOffsets, 0),
    charHeight,
    ascender,
    descender,
    static_cast<double>(metric.advanceWidth)
  ));
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

value font_glyph_rows(const value& fontValue, const value& charValue) {
  return font_render_glyph_rows(fontValue, charValue);
}

${getFontSystemRuntimeCppFragment()}`;
}

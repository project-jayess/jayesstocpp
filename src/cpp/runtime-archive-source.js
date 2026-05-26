export function getArchiveRuntimeHeaderFragment() {
  return `value archive_create_tar(const value& entries);
value archive_extract_tar(const value& bytes);`;
}

export function getArchiveRuntimeCppFragment() {
  return `namespace {
bytes_ptr require_archive_bytes(const value& input, const std::string& message) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bytes_ptr>(input);
}

array_ptr require_archive_entries(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess archive entries must be an array");
  }
  return std::get<array_ptr>(input);
}

object_ptr require_archive_entry(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess archive entry must be an object");
  }
  return std::get<object_ptr>(input);
}

std::string require_archive_string(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

value archive_object_field(const object_ptr& object, const std::string& key) {
  const auto found = object->fields.find(key);
  return found == object->fields.end() ? value(std::monostate{}) : found->second;
}

bool archive_is_windows_absolute_path(const std::string& input) {
  return input.size() >= 2 && std::isalpha(static_cast<unsigned char>(input[0])) && input[1] == ':';
}

bool archive_has_field(const object_ptr& object, const std::string& key) {
  return object->fields.find(key) != object->fields.end();
}

std::string archive_normalize_path(const std::string& input) {
  if (input.empty() || input.front() == '/' || input.find('\\\\') != std::string::npos || archive_is_windows_absolute_path(input)) {
    throw std::runtime_error("Jayess archive entry path must be relative");
  }
  auto normalizedInput = input;
  while (!normalizedInput.empty() && normalizedInput.back() == '/') {
    normalizedInput.pop_back();
  }
  if (normalizedInput.empty()) {
    throw std::runtime_error("Jayess archive entry path must be relative");
  }
  std::vector<std::string> parts;
  std::stringstream stream(normalizedInput);
  std::string part;
  while (std::getline(stream, part, '/')) {
    if (part.empty()) {
      throw std::runtime_error("Jayess archive entry path must not contain empty path segments");
    }
    if (part == ".") {
      throw std::runtime_error("Jayess archive entry path must not contain . segments");
    }
    if (part == "..") {
      throw std::runtime_error("Jayess archive entry path must not contain ..");
    }
    parts.push_back(part);
  }
  if (parts.empty()) {
    throw std::runtime_error("Jayess archive entry path must be relative");
  }
  std::string output = parts[0];
  for (std::size_t index = 1; index < parts.size(); ++index) {
    output += "/";
    output += parts[index];
  }
  if (output.size() > 100) {
    throw std::runtime_error("Jayess archive first tar slice supports paths up to 100 bytes");
  }
  return output;
}

std::string archive_entry_type(const object_ptr& entry) {
  const auto typeValue = archive_object_field(entry, "type");
  if (std::holds_alternative<std::monostate>(typeValue)) {
    return "file";
  }
  const auto type = require_archive_string(typeValue, "Jayess archive entry type must be a string");
  if (type != "file" && type != "directory") {
    throw std::runtime_error("Jayess archive tar slice supports only regular file and directory entries");
  }
  return type;
}

std::vector<unsigned char> archive_entry_content(const object_ptr& entry) {
  const auto bytesValue = archive_object_field(entry, "bytes");
  if (!std::holds_alternative<std::monostate>(bytesValue)) {
    return require_archive_bytes(bytesValue, "Jayess archive entry bytes must be jayess:bytes")->items;
  }
  const auto textValue = archive_object_field(entry, "text");
  if (!std::holds_alternative<std::monostate>(textValue)) {
    const auto text = require_archive_string(textValue, "Jayess archive entry text must be a string");
    return std::vector<unsigned char>(text.begin(), text.end());
  }
  const auto contentValue = archive_object_field(entry, "content");
  if (!std::holds_alternative<std::monostate>(contentValue)) {
    if (std::holds_alternative<std::string>(contentValue)) {
      const auto text = std::get<std::string>(contentValue);
      return std::vector<unsigned char>(text.begin(), text.end());
    }
    return require_archive_bytes(contentValue, "Jayess archive entry content must be a string or bytes")->items;
  }
  return {};
}

int archive_entry_mode(const object_ptr& entry, bool directory) {
  const auto modeValue = archive_object_field(entry, "mode");
  if (std::holds_alternative<std::monostate>(modeValue)) {
    return directory ? 0755 : 0644;
  }
  if (!std::holds_alternative<double>(modeValue)) {
    throw std::runtime_error("Jayess archive entry mode must be a number");
  }
  const auto numeric = std::get<double>(modeValue);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0 || numeric > 07777.0) {
    throw std::runtime_error("Jayess archive entry mode must be an integer mode");
  }
  return static_cast<int>(numeric);
}

std::uint64_t archive_entry_mtime(const object_ptr& entry) {
  const auto mtimeValue = archive_object_field(entry, "mtime");
  if (std::holds_alternative<std::monostate>(mtimeValue)) {
    return 0;
  }
  if (!std::holds_alternative<double>(mtimeValue)) {
    throw std::runtime_error("Jayess archive entry mtime must be a number");
  }
  const auto numeric = std::get<double>(mtimeValue);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric || numeric < 0.0) {
    throw std::runtime_error("Jayess archive entry mtime must be a non-negative integer");
  }
  return static_cast<std::uint64_t>(numeric);
}

void archive_write_octal(std::vector<unsigned char>& header, std::size_t offset, std::size_t width, std::uint64_t value) {
  std::ostringstream text;
  text << std::oct << value;
  auto digits = text.str();
  if (digits.size() + 1 > width) {
    throw std::runtime_error("Jayess archive tar field is too large");
  }
  const auto padding = width - digits.size() - 1;
  for (std::size_t index = 0; index < padding; ++index) {
    header[offset + index] = '0';
  }
  for (std::size_t index = 0; index < digits.size(); ++index) {
    header[offset + padding + index] = static_cast<unsigned char>(digits[index]);
  }
  header[offset + width - 1] = 0;
}

std::uint64_t archive_read_octal(const std::vector<unsigned char>& bytes, std::size_t offset, std::size_t width) {
  std::uint64_t value = 0;
  for (std::size_t index = 0; index < width; ++index) {
    const auto item = bytes[offset + index];
    if (item == 0 || item == ' ') {
      break;
    }
    if (item < '0' || item > '7') {
      throw std::runtime_error("Jayess archive found unsupported tar header");
    }
    value = value * 8U + static_cast<std::uint64_t>(item - '0');
  }
  return value;
}

bool archive_zero_block(const std::vector<unsigned char>& bytes, std::size_t offset) {
  for (std::size_t index = 0; index < 512; ++index) {
    if (bytes[offset + index] != 0) {
      return false;
    }
  }
  return true;
}

void archive_append_padding(std::vector<unsigned char>& output, std::size_t size) {
  const auto remainder = size % 512U;
  if (remainder == 0) {
    return;
  }
  output.insert(output.end(), 512U - remainder, 0);
}

std::vector<unsigned char> archive_create_tar_bytes(const value& entriesValue) {
  const auto entries = require_archive_entries(entriesValue);
  std::vector<unsigned char> output;
  std::vector<std::string> seenPaths;
  for (const auto& item : entries->items) {
    const auto entry = require_archive_entry(item);
    const auto type = archive_entry_type(entry);
    const auto directory = type == "directory";
    if (directory && (archive_has_field(entry, "bytes") || archive_has_field(entry, "text") || archive_has_field(entry, "content"))) {
      throw std::runtime_error("Jayess archive directory entries must not include content");
    }
    const auto path = archive_normalize_path(require_archive_string(archive_object_field(entry, "path"), "Jayess archive entry path is required"));
    if (std::find(seenPaths.begin(), seenPaths.end(), path) != seenPaths.end()) {
      throw std::runtime_error("Jayess archive entry paths must be unique");
    }
    seenPaths.push_back(path);
    const auto content = directory ? std::vector<unsigned char>{} : archive_entry_content(entry);
    std::vector<unsigned char> header(512, 0);
    std::copy(path.begin(), path.end(), header.begin());
    archive_write_octal(header, 100, 8, static_cast<std::uint64_t>(archive_entry_mode(entry, directory)));
    archive_write_octal(header, 108, 8, 0);
    archive_write_octal(header, 116, 8, 0);
    archive_write_octal(header, 124, 12, static_cast<std::uint64_t>(content.size()));
    archive_write_octal(header, 136, 12, archive_entry_mtime(entry));
    for (std::size_t index = 148; index < 156; ++index) {
      header[index] = ' ';
    }
    header[156] = directory ? '5' : '0';
    const std::string magic = "ustar";
    std::copy(magic.begin(), magic.end(), header.begin() + 257);
    header[262] = 0;
    header[263] = '0';
    header[264] = '0';
    unsigned int checksum = 0;
    for (const auto byte : header) {
      checksum += byte;
    }
    archive_write_octal(header, 148, 8, checksum);
    header[154] = 0;
    header[155] = ' ';
    output.insert(output.end(), header.begin(), header.end());
    output.insert(output.end(), content.begin(), content.end());
    archive_append_padding(output, content.size());
  }
  output.insert(output.end(), 1024, 0);
  return output;
}

value archive_make_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}
} // namespace

value archive_create_tar(const value& entries) {
  return archive_make_bytes(archive_create_tar_bytes(entries));
}

value archive_extract_tar(const value& input) {
  const auto bytes = require_archive_bytes(input, "Jayess archive extractTar expects bytes input");
  std::vector<value> entries;
  std::vector<std::string> seenPaths;
  std::size_t offset = 0;
  while (offset + 512 <= bytes->items.size()) {
    if (archive_zero_block(bytes->items, offset)) {
      break;
    }
    const auto typeflag = bytes->items[offset + 156];
    if (typeflag != '0' && typeflag != 0 && typeflag != '5') {
      throw std::runtime_error("Jayess archive extractTar supports only regular file and directory entries");
    }
    std::string pathText;
    for (std::size_t index = 0; index < 100 && bytes->items[offset + index] != 0; ++index) {
      pathText.push_back(static_cast<char>(bytes->items[offset + index]));
    }
    pathText = archive_normalize_path(pathText);
    if (std::find(seenPaths.begin(), seenPaths.end(), pathText) != seenPaths.end()) {
      throw std::runtime_error("Jayess archive entry paths must be unique");
    }
    seenPaths.push_back(pathText);
    const auto size = archive_read_octal(bytes->items, offset + 124, 12);
    const auto mode = archive_read_octal(bytes->items, offset + 100, 8);
    const auto mtime = archive_read_octal(bytes->items, offset + 136, 12);
    const auto contentOffset = offset + 512;
    if (contentOffset + size > bytes->items.size()) {
      throw std::runtime_error("Jayess archive extractTar found incomplete entry content");
    }
    if (typeflag == '5' && size != 0) {
      throw std::runtime_error("Jayess archive directory entries must not include content");
    }
    std::vector<unsigned char> content(
      bytes->items.begin() + static_cast<std::ptrdiff_t>(contentOffset),
      bytes->items.begin() + static_cast<std::ptrdiff_t>(contentOffset + size)
    );
    const auto text = std::string(content.begin(), content.end());
    entries.push_back(make_object({
      {"path", pathText},
      {"type", typeflag == '5' ? std::string("directory") : std::string("file")},
      {"mode", static_cast<double>(mode)},
      {"mtime", static_cast<double>(mtime)},
      {"size", static_cast<double>(size)},
      {"bytes", archive_make_bytes(content)},
      {"text", text}
    }));
    offset = contentOffset + static_cast<std::size_t>(size);
    const auto remainder = offset % 512U;
    if (remainder != 0) {
      offset += 512U - remainder;
    }
  }
  return make_array(std::move(entries));
}
}`;
}

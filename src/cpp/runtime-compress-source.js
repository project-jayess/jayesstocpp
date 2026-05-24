export function getCompressRuntimeHeaderFragment() {
  return `value compress_deflate(const value& bytes);
value compress_inflate(const value& bytes);
value compress_gzip(const value& bytes);
value compress_gunzip(const value& bytes);`;
}

export function getCompressRuntimeCppFragment() {
  return `namespace {
bytes_ptr require_compress_bytes(const value& input, const std::string& operation) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error("Jayess compress " + operation + " expects bytes");
  }
  return std::get<bytes_ptr>(input);
}

value compress_make_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}

void compress_write_u16(std::vector<unsigned char>& output, std::uint16_t value) {
  output.push_back(static_cast<unsigned char>(value & 0xffU));
  output.push_back(static_cast<unsigned char>((value >> 8U) & 0xffU));
}

void compress_write_u32(std::vector<unsigned char>& output, std::uint32_t value) {
  output.push_back(static_cast<unsigned char>(value & 0xffU));
  output.push_back(static_cast<unsigned char>((value >> 8U) & 0xffU));
  output.push_back(static_cast<unsigned char>((value >> 16U) & 0xffU));
  output.push_back(static_cast<unsigned char>((value >> 24U) & 0xffU));
}

std::uint16_t compress_read_u16(const std::vector<unsigned char>& input, std::size_t offset, const std::string& message) {
  if (offset + 1U >= input.size()) {
    throw std::runtime_error(message);
  }
  return static_cast<std::uint16_t>(input[offset] | (static_cast<std::uint16_t>(input[offset + 1U]) << 8U));
}

std::uint32_t compress_crc32(const std::vector<unsigned char>& input) {
  std::uint32_t crc = 0xffffffffU;
  for (const auto byte : input) {
    crc ^= static_cast<std::uint32_t>(byte);
    for (int bit = 0; bit < 8; bit += 1) {
      const auto mask = static_cast<std::uint32_t>(0U - (crc & 1U));
      crc = (crc >> 1U) ^ (0xedb88320U & mask);
    }
  }
  return crc ^ 0xffffffffU;
}

std::vector<unsigned char> compress_deflate_stored_bytes(const std::vector<unsigned char>& input) {
  std::vector<unsigned char> output;
  std::size_t offset = 0;
  do {
    const auto remaining = input.size() - offset;
    const auto chunk = std::min<std::size_t>(remaining, 65535U);
    const bool finalBlock = offset + chunk >= input.size();
    output.push_back(finalBlock ? 0x01U : 0x00U);
    compress_write_u16(output, static_cast<std::uint16_t>(chunk));
    compress_write_u16(output, static_cast<std::uint16_t>(~static_cast<std::uint16_t>(chunk)));
    output.insert(output.end(), input.begin() + static_cast<std::ptrdiff_t>(offset), input.begin() + static_cast<std::ptrdiff_t>(offset + chunk));
    offset += chunk;
  } while (offset < input.size());
  return output;
}

std::vector<unsigned char> compress_inflate_stored_bytes(const std::vector<unsigned char>& input) {
  std::vector<unsigned char> output;
  std::size_t offset = 0;
  while (true) {
    if (offset + 5U > input.size()) {
      throw std::runtime_error("Jayess compress inflate found malformed deflate data");
    }
    const auto header = input[offset++];
    const auto finalBlock = (header & 0x01U) != 0U;
    const auto blockType = (header >> 1U) & 0x03U;
    if (blockType != 0U) {
      throw std::runtime_error("Jayess compress inflate supports stored deflate blocks only");
    }
    const auto length = compress_read_u16(input, offset, "Jayess compress inflate found malformed deflate length");
    offset += 2U;
    const auto inverted = compress_read_u16(input, offset, "Jayess compress inflate found malformed deflate length");
    offset += 2U;
    if (static_cast<std::uint16_t>(length ^ 0xffffU) != inverted) {
      throw std::runtime_error("Jayess compress inflate found invalid deflate length check");
    }
    if (offset + length > input.size()) {
      throw std::runtime_error("Jayess compress inflate found truncated deflate data");
    }
    output.insert(output.end(), input.begin() + static_cast<std::ptrdiff_t>(offset), input.begin() + static_cast<std::ptrdiff_t>(offset + length));
    offset += length;
    if (finalBlock) {
      if (offset != input.size()) {
        throw std::runtime_error("Jayess compress inflate found trailing deflate data");
      }
      return output;
    }
  }
}
} // namespace

value compress_deflate(const value& bytesValue) {
  const auto bytes = require_compress_bytes(bytesValue, "deflate");
  return compress_make_bytes(compress_deflate_stored_bytes(bytes->items));
}

value compress_inflate(const value& bytesValue) {
  const auto bytes = require_compress_bytes(bytesValue, "inflate");
  return compress_make_bytes(compress_inflate_stored_bytes(bytes->items));
}

value compress_gzip(const value& bytesValue) {
  const auto bytes = require_compress_bytes(bytesValue, "gzip");
  std::vector<unsigned char> output = {0x1fU, 0x8bU, 0x08U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0xffU};
  auto deflated = compress_deflate_stored_bytes(bytes->items);
  output.insert(output.end(), deflated.begin(), deflated.end());
  compress_write_u32(output, compress_crc32(bytes->items));
  compress_write_u32(output, static_cast<std::uint32_t>(bytes->items.size() & 0xffffffffU));
  return compress_make_bytes(std::move(output));
}

value compress_gunzip(const value& bytesValue) {
  const auto bytes = require_compress_bytes(bytesValue, "gunzip");
  const auto& input = bytes->items;
  if (input.size() < 18U || input[0] != 0x1fU || input[1] != 0x8bU || input[2] != 0x08U || input[3] != 0x00U) {
    throw std::runtime_error("Jayess compress gunzip found malformed gzip data");
  }
  const auto bodyStart = 10U;
  const auto trailerStart = input.size() - 8U;
  std::vector<unsigned char> deflated(input.begin() + bodyStart, input.begin() + static_cast<std::ptrdiff_t>(trailerStart));
  auto inflated = compress_inflate_stored_bytes(deflated);
  const auto expectedCrc = static_cast<std::uint32_t>(input[trailerStart])
    | (static_cast<std::uint32_t>(input[trailerStart + 1U]) << 8U)
    | (static_cast<std::uint32_t>(input[trailerStart + 2U]) << 16U)
    | (static_cast<std::uint32_t>(input[trailerStart + 3U]) << 24U);
  const auto expectedSize = static_cast<std::uint32_t>(input[trailerStart + 4U])
    | (static_cast<std::uint32_t>(input[trailerStart + 5U]) << 8U)
    | (static_cast<std::uint32_t>(input[trailerStart + 6U]) << 16U)
    | (static_cast<std::uint32_t>(input[trailerStart + 7U]) << 24U);
  if (compress_crc32(inflated) != expectedCrc || static_cast<std::uint32_t>(inflated.size() & 0xffffffffU) != expectedSize) {
    throw std::runtime_error("Jayess compress gunzip found invalid gzip checksum");
  }
  return compress_make_bytes(std::move(inflated));
}`;
}

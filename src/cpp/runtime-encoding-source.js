export function getEncodingRuntimeHeaderFragment() {
  return `value encoding_base64_encode(const value& input);
value encoding_base64_decode(const value& text);
value encoding_hex_encode(const value& input);
value encoding_hex_decode(const value& text);
value encoding_ascii_encode(const value& text);
value encoding_ascii_decode(const value& input);
value encoding_utf16_encode(const value& text);
value encoding_utf16_decode(const value& input);
value encoding_uri_encode(const value& text);
value encoding_uri_decode(const value& text);`;
}

export function getEncodingRuntimeCppFragment() {
  return `namespace {
const char* kBase64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

bytes_ptr require_encoding_bytes(const value& input, const std::string& message) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bytes_ptr>(input);
}

std::string require_encoding_text(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

int decode_base64_character(char character) {
  if (character >= 'A' && character <= 'Z') {
    return character - 'A';
  }
  if (character >= 'a' && character <= 'z') {
    return character - 'a' + 26;
  }
  if (character >= '0' && character <= '9') {
    return character - '0' + 52;
  }
  if (character == '+') {
    return 62;
  }
  if (character == '/') {
    return 63;
  }
  return -1;
}

int decode_hex_character(char character) {
  if (character >= '0' && character <= '9') {
    return character - '0';
  }
  if (character >= 'a' && character <= 'f') {
    return character - 'a' + 10;
  }
  if (character >= 'A' && character <= 'F') {
    return character - 'A' + 10;
  }
  return -1;
}

value make_encoding_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}

bool is_uri_unreserved(unsigned char character) {
  return std::isalnum(character) || character == '-' || character == '_' || character == '.' || character == '~';
}
} // namespace

value encoding_base64_encode(const value& input) {
  const auto bytes = require_encoding_bytes(input, "Jayess encoding base64Encode expects bytes input");
  std::string encoded;
  encoded.reserve(((bytes->items.size() + 2) / 3) * 4);

  for (std::size_t index = 0; index < bytes->items.size(); index += 3) {
    const auto first = bytes->items[index];
    const auto second = index + 1 < bytes->items.size() ? bytes->items[index + 1] : 0;
    const auto third = index + 2 < bytes->items.size() ? bytes->items[index + 2] : 0;
    const auto triple = (static_cast<unsigned int>(first) << 16)
      | (static_cast<unsigned int>(second) << 8)
      | static_cast<unsigned int>(third);

    encoded.push_back(kBase64Alphabet[(triple >> 18) & 0x3f]);
    encoded.push_back(kBase64Alphabet[(triple >> 12) & 0x3f]);
    encoded.push_back(index + 1 < bytes->items.size() ? kBase64Alphabet[(triple >> 6) & 0x3f] : '=');
    encoded.push_back(index + 2 < bytes->items.size() ? kBase64Alphabet[triple & 0x3f] : '=');
  }

  return encoded;
}

value encoding_base64_decode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding base64Decode expects string input");
  if (input.size() % 4 != 0) {
    throw std::runtime_error("Jayess encoding base64Decode expects padded base64 text");
  }

  std::vector<unsigned char> decoded;
  decoded.reserve((input.size() / 4) * 3);
  for (std::size_t index = 0; index < input.size(); index += 4) {
    const int first = decode_base64_character(input[index]);
    const int second = decode_base64_character(input[index + 1]);
    const bool thirdPad = input[index + 2] == '=';
    const bool fourthPad = input[index + 3] == '=';
    const int third = thirdPad ? 0 : decode_base64_character(input[index + 2]);
    const int fourth = fourthPad ? 0 : decode_base64_character(input[index + 3]);
    if (first < 0 || second < 0 || third < 0 || fourth < 0 || (thirdPad && !fourthPad)) {
      throw std::runtime_error("Jayess encoding base64Decode received malformed base64 text");
    }

    const auto triple = (static_cast<unsigned int>(first) << 18)
      | (static_cast<unsigned int>(second) << 12)
      | (static_cast<unsigned int>(third) << 6)
      | static_cast<unsigned int>(fourth);
    decoded.push_back(static_cast<unsigned char>((triple >> 16) & 0xff));
    if (!thirdPad) {
      decoded.push_back(static_cast<unsigned char>((triple >> 8) & 0xff));
    }
    if (!fourthPad) {
      decoded.push_back(static_cast<unsigned char>(triple & 0xff));
    }
  }

  return make_encoding_bytes(std::move(decoded));
}

value encoding_hex_encode(const value& input) {
  const auto bytes = require_encoding_bytes(input, "Jayess encoding hexEncode expects bytes input");
  std::ostringstream stream;
  stream << std::hex << std::setfill('0');
  for (const auto byte : bytes->items) {
    stream << std::setw(2) << static_cast<int>(byte);
  }
  return stream.str();
}

value encoding_hex_decode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding hexDecode expects string input");
  if (input.size() % 2 != 0) {
    throw std::runtime_error("Jayess encoding hexDecode expects an even-length string");
  }

  std::vector<unsigned char> decoded;
  decoded.reserve(input.size() / 2);
  for (std::size_t index = 0; index < input.size(); index += 2) {
    const int high = decode_hex_character(input[index]);
    const int low = decode_hex_character(input[index + 1]);
    if (high < 0 || low < 0) {
      throw std::runtime_error("Jayess encoding hexDecode received malformed hex text");
    }
    decoded.push_back(static_cast<unsigned char>((high << 4) | low));
  }
  return make_encoding_bytes(std::move(decoded));
}

value encoding_ascii_encode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding asciiEncode expects string input");
  std::vector<unsigned char> encoded;
  encoded.reserve(input.size());
  for (const unsigned char character : input) {
    if (character > 0x7f) {
      throw std::runtime_error("Jayess encoding asciiEncode received non-ASCII text");
    }
    encoded.push_back(character);
  }
  return make_encoding_bytes(std::move(encoded));
}

value encoding_ascii_decode(const value& input) {
  const auto bytes = require_encoding_bytes(input, "Jayess encoding asciiDecode expects bytes input");
  std::string decoded;
  decoded.reserve(bytes->items.size());
  for (const auto byte : bytes->items) {
    if (byte > 0x7f) {
      throw std::runtime_error("Jayess encoding asciiDecode received non-ASCII bytes");
    }
    decoded.push_back(static_cast<char>(byte));
  }
  return decoded;
}

value encoding_utf16_encode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding utf16Encode expects string input");
  std::vector<unsigned char> encoded;
  encoded.reserve(input.size() * 2);
  for (const unsigned char character : input) {
    if (character > 0x7f) {
      throw std::runtime_error("Jayess encoding utf16Encode supports ASCII text in this slice");
    }
    encoded.push_back(character);
    encoded.push_back(0);
  }
  return make_encoding_bytes(std::move(encoded));
}

value encoding_utf16_decode(const value& input) {
  const auto bytes = require_encoding_bytes(input, "Jayess encoding utf16Decode expects bytes input");
  if (bytes->items.size() % 2 != 0) {
    throw std::runtime_error("Jayess encoding utf16Decode expects an even byte length");
  }
  std::string decoded;
  decoded.reserve(bytes->items.size() / 2);
  for (std::size_t index = 0; index < bytes->items.size(); index += 2) {
    if (bytes->items[index + 1] != 0) {
      throw std::runtime_error("Jayess encoding utf16Decode supports UTF-16LE ASCII code units in this slice");
    }
    decoded.push_back(static_cast<char>(bytes->items[index]));
  }
  return decoded;
}

value encoding_uri_encode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding uriEncode expects string input");
  std::ostringstream stream;
  stream << std::uppercase << std::hex << std::setfill('0');
  for (const unsigned char character : input) {
    if (is_uri_unreserved(character)) {
      stream << static_cast<char>(character);
    } else {
      stream << '%' << std::setw(2) << static_cast<int>(character);
    }
  }
  return stream.str();
}

value encoding_uri_decode(const value& text) {
  const auto input = require_encoding_text(text, "Jayess encoding uriDecode expects string input");
  std::string decoded;
  decoded.reserve(input.size());
  for (std::size_t index = 0; index < input.size(); index += 1) {
    if (input[index] != '%') {
      decoded.push_back(input[index]);
      continue;
    }
    if (index + 2 >= input.size()) {
      throw std::runtime_error("Jayess encoding uriDecode received incomplete escape text");
    }
    const int high = decode_hex_character(input[index + 1]);
    const int low = decode_hex_character(input[index + 2]);
    if (high < 0 || low < 0) {
      throw std::runtime_error("Jayess encoding uriDecode received malformed escape text");
    }
    decoded.push_back(static_cast<char>((high << 4) | low));
    index += 2;
  }
  return decoded;
}`;
}

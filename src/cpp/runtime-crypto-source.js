export function getCryptoRuntimeHeaderFragment() {
  return `value crypto_sha256(const value& input);
value crypto_sha1(const value& input);
value crypto_random_bytes(const value& count);`;
}

export function getCryptoRuntimeCppFragment() {
  return `namespace {
bytes_ptr require_crypto_bytes(const value& input, const std::string& message) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bytes_ptr>(input);
}

std::size_t require_crypto_count(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto raw = std::get<double>(input);
  if (!std::isfinite(raw) || raw < 0.0 || std::floor(raw) != raw) {
    throw std::runtime_error(message);
  }
  return static_cast<std::size_t>(raw);
}

value make_crypto_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}

std::uint32_t crypto_rotate_right(std::uint32_t value, std::uint32_t amount) {
  return (value >> amount) | (value << (32 - amount));
}

std::uint32_t crypto_rotate_left(std::uint32_t value, std::uint32_t amount) {
  return (value << amount) | (value >> (32 - amount));
}

void crypto_append_u64_be(std::vector<unsigned char>& output, std::uint64_t value) {
  for (int shift = 56; shift >= 0; shift -= 8) {
    output.push_back(static_cast<unsigned char>((value >> shift) & 0xff));
  }
}

std::uint32_t crypto_read_u32_be(const std::vector<unsigned char>& input, std::size_t offset) {
  return (static_cast<std::uint32_t>(input[offset]) << 24)
    | (static_cast<std::uint32_t>(input[offset + 1]) << 16)
    | (static_cast<std::uint32_t>(input[offset + 2]) << 8)
    | static_cast<std::uint32_t>(input[offset + 3]);
}

std::vector<unsigned char> crypto_digest_to_bytes(const std::vector<std::uint32_t>& words) {
  std::vector<unsigned char> output;
  output.reserve(words.size() * 4);
  for (const auto word : words) {
    output.push_back(static_cast<unsigned char>((word >> 24) & 0xff));
    output.push_back(static_cast<unsigned char>((word >> 16) & 0xff));
    output.push_back(static_cast<unsigned char>((word >> 8) & 0xff));
    output.push_back(static_cast<unsigned char>(word & 0xff));
  }
  return output;
}

std::vector<unsigned char> crypto_pad_message(const std::vector<unsigned char>& input) {
  std::vector<unsigned char> padded = input;
  const auto bitLength = static_cast<std::uint64_t>(input.size()) * 8;
  padded.push_back(0x80);
  while ((padded.size() % 64) != 56) {
    padded.push_back(0);
  }
  crypto_append_u64_be(padded, bitLength);
  return padded;
}

std::vector<unsigned char> sha256_digest(const std::vector<unsigned char>& input) {
  static constexpr std::array<std::uint32_t, 64> k = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  };

  std::uint32_t h0 = 0x6a09e667;
  std::uint32_t h1 = 0xbb67ae85;
  std::uint32_t h2 = 0x3c6ef372;
  std::uint32_t h3 = 0xa54ff53a;
  std::uint32_t h4 = 0x510e527f;
  std::uint32_t h5 = 0x9b05688c;
  std::uint32_t h6 = 0x1f83d9ab;
  std::uint32_t h7 = 0x5be0cd19;

  const auto padded = crypto_pad_message(input);
  for (std::size_t offset = 0; offset < padded.size(); offset += 64) {
    std::array<std::uint32_t, 64> words = {};
    for (std::size_t index = 0; index < 16; index += 1) {
      words[index] = crypto_read_u32_be(padded, offset + index * 4);
    }
    for (std::size_t index = 16; index < 64; index += 1) {
      const auto s0 = crypto_rotate_right(words[index - 15], 7) ^ crypto_rotate_right(words[index - 15], 18) ^ (words[index - 15] >> 3);
      const auto s1 = crypto_rotate_right(words[index - 2], 17) ^ crypto_rotate_right(words[index - 2], 19) ^ (words[index - 2] >> 10);
      words[index] = words[index - 16] + s0 + words[index - 7] + s1;
    }

    auto a = h0;
    auto b = h1;
    auto c = h2;
    auto d = h3;
    auto e = h4;
    auto f = h5;
    auto g = h6;
    auto h = h7;

    for (std::size_t index = 0; index < 64; index += 1) {
      const auto upperS1 = crypto_rotate_right(e, 6) ^ crypto_rotate_right(e, 11) ^ crypto_rotate_right(e, 25);
      const auto choice = (e & f) ^ ((~e) & g);
      const auto temp1 = h + upperS1 + choice + k[index] + words[index];
      const auto upperS0 = crypto_rotate_right(a, 2) ^ crypto_rotate_right(a, 13) ^ crypto_rotate_right(a, 22);
      const auto majority = (a & b) ^ (a & c) ^ (b & c);
      const auto temp2 = upperS0 + majority;
      h = g;
      g = f;
      f = e;
      e = d + temp1;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2;
    }

    h0 += a;
    h1 += b;
    h2 += c;
    h3 += d;
    h4 += e;
    h5 += f;
    h6 += g;
    h7 += h;
  }

  return crypto_digest_to_bytes({h0, h1, h2, h3, h4, h5, h6, h7});
}

std::vector<unsigned char> sha1_digest(const std::vector<unsigned char>& input) {
  std::uint32_t h0 = 0x67452301;
  std::uint32_t h1 = 0xefcdab89;
  std::uint32_t h2 = 0x98badcfe;
  std::uint32_t h3 = 0x10325476;
  std::uint32_t h4 = 0xc3d2e1f0;

  const auto padded = crypto_pad_message(input);
  for (std::size_t offset = 0; offset < padded.size(); offset += 64) {
    std::array<std::uint32_t, 80> words = {};
    for (std::size_t index = 0; index < 16; index += 1) {
      words[index] = crypto_read_u32_be(padded, offset + index * 4);
    }
    for (std::size_t index = 16; index < 80; index += 1) {
      words[index] = crypto_rotate_left(words[index - 3] ^ words[index - 8] ^ words[index - 14] ^ words[index - 16], 1);
    }

    auto a = h0;
    auto b = h1;
    auto c = h2;
    auto d = h3;
    auto e = h4;

    for (std::size_t index = 0; index < 80; index += 1) {
      std::uint32_t f = 0;
      std::uint32_t k = 0;
      if (index < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5a827999;
      } else if (index < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const auto temp = crypto_rotate_left(a, 5) + f + e + k + words[index];
      e = d;
      d = c;
      c = crypto_rotate_left(b, 30);
      b = a;
      a = temp;
    }

    h0 += a;
    h1 += b;
    h2 += c;
    h3 += d;
    h4 += e;
  }

  return crypto_digest_to_bytes({h0, h1, h2, h3, h4});
}
} // namespace

value crypto_sha256(const value& input) {
  const auto bytes = require_crypto_bytes(input, "Jayess crypto sha256 expects bytes input");
  return make_crypto_bytes(sha256_digest(bytes->items));
}

value crypto_sha1(const value& input) {
  const auto bytes = require_crypto_bytes(input, "Jayess crypto sha1 expects bytes input");
  return make_crypto_bytes(sha1_digest(bytes->items));
}

value crypto_random_bytes(const value& count) {
  const auto size = require_crypto_count(count, "Jayess crypto randomBytes expects a non-negative integer count");
  std::random_device device;
  std::uniform_int_distribution<int> distribution(0, 255);
  std::vector<unsigned char> output;
  output.reserve(size);
  for (std::size_t index = 0; index < size; index += 1) {
    output.push_back(static_cast<unsigned char>(distribution(device)));
  }
  return make_crypto_bytes(std::move(output));
}`;
}

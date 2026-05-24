export function getCryptoRuntimeHeaderFragment() {
  return `value crypto_sha256(const value& input);
value crypto_sha512(const value& input);
value crypto_sha1(const value& input);
value crypto_random_bytes(const value& count);`;
}

export function getCryptoRuntimeCppFragment() {
  return `namespace {
constexpr const char* CRYPTO_RANDOM_UNAVAILABLE_MESSAGE = "Jayess crypto randomBytes is not available on this platform";

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

void fill_crypto_random_bytes(std::vector<unsigned char>& output) {
#if defined(_WIN32)
  using jayess_bcrypt_alg_handle = void*;
  using jayess_bcrypt_status = long;
  using jayess_bcrypt_gen_random_fn = jayess_bcrypt_status (*)(jayess_bcrypt_alg_handle, unsigned char*, unsigned long, unsigned long);
  constexpr unsigned long jayess_bcrypt_use_system_preferred_rng = 0x00000002UL;

  auto bcrypt = LoadLibraryA("bcrypt.dll");
  if (bcrypt == nullptr) {
    throw std::runtime_error(CRYPTO_RANDOM_UNAVAILABLE_MESSAGE);
  }
  auto genRandom = reinterpret_cast<jayess_bcrypt_gen_random_fn>(GetProcAddress(bcrypt, "BCryptGenRandom"));
  if (genRandom == nullptr) {
    throw std::runtime_error(CRYPTO_RANDOM_UNAVAILABLE_MESSAGE);
  }
  if (!output.empty()) {
    const auto status = genRandom(nullptr, output.data(), static_cast<unsigned long>(output.size()), jayess_bcrypt_use_system_preferred_rng);
    if (status < 0) {
      throw std::runtime_error("Jayess crypto randomBytes could not read from the Windows system CSPRNG");
    }
  }
#elif defined(__APPLE__)
  if (!output.empty()) {
    arc4random_buf(output.data(), output.size());
  }
#elif defined(__linux__)
  std::ifstream randomStream("/dev/urandom", std::ios::binary);
  if (!randomStream.is_open()) {
    throw std::runtime_error("Jayess crypto randomBytes could not open /dev/urandom");
  }
  if (!output.empty()) {
    randomStream.read(reinterpret_cast<char*>(output.data()), static_cast<std::streamsize>(output.size()));
    if (randomStream.gcount() != static_cast<std::streamsize>(output.size())) {
      throw std::runtime_error("Jayess crypto randomBytes could not read enough bytes from /dev/urandom");
    }
  }
#else
  throw std::runtime_error(CRYPTO_RANDOM_UNAVAILABLE_MESSAGE);
#endif
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

std::uint64_t crypto_read_u64_be(const std::vector<unsigned char>& input, std::size_t offset) {
  return (static_cast<std::uint64_t>(input[offset]) << 56)
    | (static_cast<std::uint64_t>(input[offset + 1]) << 48)
    | (static_cast<std::uint64_t>(input[offset + 2]) << 40)
    | (static_cast<std::uint64_t>(input[offset + 3]) << 32)
    | (static_cast<std::uint64_t>(input[offset + 4]) << 24)
    | (static_cast<std::uint64_t>(input[offset + 5]) << 16)
    | (static_cast<std::uint64_t>(input[offset + 6]) << 8)
    | static_cast<std::uint64_t>(input[offset + 7]);
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

std::vector<unsigned char> crypto_digest64_to_bytes(const std::vector<std::uint64_t>& words) {
  std::vector<unsigned char> output;
  output.reserve(words.size() * 8);
  for (const auto word : words) {
    output.push_back(static_cast<unsigned char>((word >> 56) & 0xff));
    output.push_back(static_cast<unsigned char>((word >> 48) & 0xff));
    output.push_back(static_cast<unsigned char>((word >> 40) & 0xff));
    output.push_back(static_cast<unsigned char>((word >> 32) & 0xff));
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

std::vector<unsigned char> crypto_pad_message_1024(const std::vector<unsigned char>& input) {
  std::vector<unsigned char> padded = input;
  const auto bitLength = static_cast<std::uint64_t>(input.size()) * 8;
  padded.push_back(0x80);
  while ((padded.size() % 128) != 112) {
    padded.push_back(0);
  }
  crypto_append_u64_be(padded, 0);
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

std::uint64_t crypto_rotate_right64(std::uint64_t value, std::uint32_t amount) {
  return (value >> amount) | (value << (64 - amount));
}

std::vector<unsigned char> sha512_digest(const std::vector<unsigned char>& input) {
  static constexpr std::array<std::uint64_t, 80> k = {
    0x428a2f98d728ae22ULL, 0x7137449123ef65cdULL, 0xb5c0fbcfec4d3b2fULL, 0xe9b5dba58189dbbcULL,
    0x3956c25bf348b538ULL, 0x59f111f1b605d019ULL, 0x923f82a4af194f9bULL, 0xab1c5ed5da6d8118ULL,
    0xd807aa98a3030242ULL, 0x12835b0145706fbeULL, 0x243185be4ee4b28cULL, 0x550c7dc3d5ffb4e2ULL,
    0x72be5d74f27b896fULL, 0x80deb1fe3b1696b1ULL, 0x9bdc06a725c71235ULL, 0xc19bf174cf692694ULL,
    0xe49b69c19ef14ad2ULL, 0xefbe4786384f25e3ULL, 0x0fc19dc68b8cd5b5ULL, 0x240ca1cc77ac9c65ULL,
    0x2de92c6f592b0275ULL, 0x4a7484aa6ea6e483ULL, 0x5cb0a9dcbd41fbd4ULL, 0x76f988da831153b5ULL,
    0x983e5152ee66dfabULL, 0xa831c66d2db43210ULL, 0xb00327c898fb213fULL, 0xbf597fc7beef0ee4ULL,
    0xc6e00bf33da88fc2ULL, 0xd5a79147930aa725ULL, 0x06ca6351e003826fULL, 0x142929670a0e6e70ULL,
    0x27b70a8546d22ffcULL, 0x2e1b21385c26c926ULL, 0x4d2c6dfc5ac42aedULL, 0x53380d139d95b3dfULL,
    0x650a73548baf63deULL, 0x766a0abb3c77b2a8ULL, 0x81c2c92e47edaee6ULL, 0x92722c851482353bULL,
    0xa2bfe8a14cf10364ULL, 0xa81a664bbc423001ULL, 0xc24b8b70d0f89791ULL, 0xc76c51a30654be30ULL,
    0xd192e819d6ef5218ULL, 0xd69906245565a910ULL, 0xf40e35855771202aULL, 0x106aa07032bbd1b8ULL,
    0x19a4c116b8d2d0c8ULL, 0x1e376c085141ab53ULL, 0x2748774cdf8eeb99ULL, 0x34b0bcb5e19b48a8ULL,
    0x391c0cb3c5c95a63ULL, 0x4ed8aa4ae3418acbULL, 0x5b9cca4f7763e373ULL, 0x682e6ff3d6b2b8a3ULL,
    0x748f82ee5defb2fcULL, 0x78a5636f43172f60ULL, 0x84c87814a1f0ab72ULL, 0x8cc702081a6439ecULL,
    0x90befffa23631e28ULL, 0xa4506cebde82bde9ULL, 0xbef9a3f7b2c67915ULL, 0xc67178f2e372532bULL,
    0xca273eceea26619cULL, 0xd186b8c721c0c207ULL, 0xeada7dd6cde0eb1eULL, 0xf57d4f7fee6ed178ULL,
    0x06f067aa72176fbaULL, 0x0a637dc5a2c898a6ULL, 0x113f9804bef90daeULL, 0x1b710b35131c471bULL,
    0x28db77f523047d84ULL, 0x32caab7b40c72493ULL, 0x3c9ebe0a15c9bebcULL, 0x431d67c49c100d4cULL,
    0x4cc5d4becb3e42b6ULL, 0x597f299cfc657e2aULL, 0x5fcb6fab3ad6faecULL, 0x6c44198c4a475817ULL
  };

  std::uint64_t h0 = 0x6a09e667f3bcc908ULL;
  std::uint64_t h1 = 0xbb67ae8584caa73bULL;
  std::uint64_t h2 = 0x3c6ef372fe94f82bULL;
  std::uint64_t h3 = 0xa54ff53a5f1d36f1ULL;
  std::uint64_t h4 = 0x510e527fade682d1ULL;
  std::uint64_t h5 = 0x9b05688c2b3e6c1fULL;
  std::uint64_t h6 = 0x1f83d9abfb41bd6bULL;
  std::uint64_t h7 = 0x5be0cd19137e2179ULL;

  const auto padded = crypto_pad_message_1024(input);
  for (std::size_t offset = 0; offset < padded.size(); offset += 128) {
    std::array<std::uint64_t, 80> words = {};
    for (std::size_t index = 0; index < 16; index += 1) {
      words[index] = crypto_read_u64_be(padded, offset + index * 8);
    }
    for (std::size_t index = 16; index < 80; index += 1) {
      const auto s0 = crypto_rotate_right64(words[index - 15], 1) ^ crypto_rotate_right64(words[index - 15], 8) ^ (words[index - 15] >> 7);
      const auto s1 = crypto_rotate_right64(words[index - 2], 19) ^ crypto_rotate_right64(words[index - 2], 61) ^ (words[index - 2] >> 6);
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

    for (std::size_t index = 0; index < 80; index += 1) {
      const auto upperS1 = crypto_rotate_right64(e, 14) ^ crypto_rotate_right64(e, 18) ^ crypto_rotate_right64(e, 41);
      const auto choice = (e & f) ^ ((~e) & g);
      const auto temp1 = h + upperS1 + choice + k[index] + words[index];
      const auto upperS0 = crypto_rotate_right64(a, 28) ^ crypto_rotate_right64(a, 34) ^ crypto_rotate_right64(a, 39);
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

  return crypto_digest64_to_bytes({h0, h1, h2, h3, h4, h5, h6, h7});
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

value crypto_sha512(const value& input) {
  const auto bytes = require_crypto_bytes(input, "Jayess crypto sha512 expects bytes input");
  return make_crypto_bytes(sha512_digest(bytes->items));
}

value crypto_sha1(const value& input) {
  const auto bytes = require_crypto_bytes(input, "Jayess crypto sha1 expects bytes input");
  return make_crypto_bytes(sha1_digest(bytes->items));
}

value crypto_random_bytes(const value& count) {
  const auto size = require_crypto_count(count, "Jayess crypto randomBytes expects a non-negative integer count");
  std::vector<unsigned char> output(size);
  fill_crypto_random_bytes(output);
  return make_crypto_bytes(std::move(output));
}`;
}

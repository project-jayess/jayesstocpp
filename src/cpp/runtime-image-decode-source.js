export function getImageDecodeRuntimeCppFragment() {
  return `std::vector<unsigned char> image_read_file_bytes(const std::string& pathText, const std::string& operationName) {
  std::ifstream input(std::filesystem::path(pathText), std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image " + operationName + " could not open input file");
  }
  return std::vector<unsigned char>(
    std::istreambuf_iterator<char>(input),
    std::istreambuf_iterator<char>()
  );
}

value image_decode_stb_bytes(const std::vector<unsigned char>& bytes, const std::string& operationName) {
  if (bytes.empty()) {
    throw std::runtime_error("Jayess image " + operationName + " found empty image data");
  }
  if (bytes.size() > static_cast<std::size_t>((std::numeric_limits<int>::max)())) {
    throw std::runtime_error("Jayess image " + operationName + " input is too large for the decoder");
  }
  int width = 0;
  int height = 0;
  int channels = 0;
  auto pixels = stbi_load_from_memory(bytes.data(), static_cast<int>(bytes.size()), &width, &height, &channels, 4);
  if (pixels == nullptr) {
    throw std::runtime_error("Jayess image " + operationName + " could not decode image data");
  }

  try {
    image_require_storage_dimensions(width, height, "Jayess image " + operationName + " found unsupported image dimensions");
  } catch (...) {
    stbi_image_free(pixels);
    throw;
  }
  auto image = image_allocate(width, height);
  const auto byteCount = static_cast<std::size_t>(width) * static_cast<std::size_t>(height) * 4U;
  std::copy(pixels, pixels + byteCount, image->pixels.begin());
  stbi_image_free(pixels);
  return image;
}

value image_decode_stb_format(const value& input, const std::string& operationName) {
  const auto bytes = require_image_bytes_value(input, "Jayess image " + operationName + " expects bytes input");
  return image_decode_stb_bytes(bytes->items, operationName);
}

value image_load_stb_format(const value& pathValue, const std::string& operationName) {
  return image_decode_stb_bytes(image_read_file_bytes(require_image_path(pathValue), operationName), operationName);
}

value image_load_png(const value& pathValue) {
  return image_load_stb_format(pathValue, "loadPng");
}

value image_load_jpeg(const value& pathValue) {
  return image_load_stb_format(pathValue, "loadJpeg");
}

value image_load_jpg(const value& pathValue) {
  return image_load_jpeg(pathValue);
}

value image_load_psd(const value& pathValue) {
  return image_load_stb_format(pathValue, "loadPsd");
}

value image_load_gif(const value& pathValue) {
  return image_load_stb_format(pathValue, "loadGif");
}

value image_decode_png(const value& input) {
  return image_decode_stb_format(input, "decodePng");
}

value image_decode_jpeg(const value& input) {
  return image_decode_stb_format(input, "decodeJpeg");
}

value image_decode_psd(const value& input) {
  return image_decode_stb_format(input, "decodePsd");
}

value image_decode_gif(const value& input) {
  return image_decode_stb_format(input, "decodeGif");
}

value image_decode_image(const value& input) {
  return image_decode_stb_format(input, "decodeImage");
}

value image_decode_webp_bytes(const std::vector<unsigned char>& bytes, const std::string& operationName) {
  if (bytes.empty()) {
    throw std::runtime_error("Jayess image " + operationName + " found empty image data");
  }
  int width = 0;
  int height = 0;
  auto pixels = WebPDecodeRGBA(bytes.data(), bytes.size(), &width, &height);
  if (pixels == nullptr) {
    throw std::runtime_error("Jayess image " + operationName + " could not decode WebP image data");
  }
  try {
    image_require_storage_dimensions(width, height, "Jayess image " + operationName + " found unsupported image dimensions");
  } catch (...) {
    WebPFree(pixels);
    throw;
  }
  auto image = image_allocate(width, height);
  const auto byteCount = static_cast<std::size_t>(width) * static_cast<std::size_t>(height) * 4U;
  std::copy(pixels, pixels + byteCount, image->pixels.begin());
  WebPFree(pixels);
  return image;
}

value image_load_webp(const value& pathValue) {
  return image_decode_webp_bytes(image_read_file_bytes(require_image_path(pathValue), "loadWebp"), "loadWebp");
}

value image_decode_webp(const value& input) {
  const auto bytes = require_image_bytes_value(input, "Jayess image decodeWebp expects bytes input");
  return image_decode_webp_bytes(bytes->items, "decodeWebp");
}

value image_load_image(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  const auto extension = image_lower_extension(std::filesystem::path(pathText));
  if (extension == ".ppm") {
    return image_load_ppm(pathValue);
  }
  if (extension == ".pgm") {
    return image_load_pgm(pathValue);
  }
  if (extension == ".bmp") {
    return image_load_stb_format(pathValue, "loadImage");
  }
  if (extension == ".tga") {
    return image_load_tga(pathValue);
  }
  if (extension == ".png") {
    return image_load_png(pathValue);
  }
  if (extension == ".jpeg") {
    return image_load_jpeg(pathValue);
  }
  if (extension == ".jpg") {
    return image_load_jpg(pathValue);
  }
  if (extension == ".psd") {
    return image_load_psd(pathValue);
  }
  if (extension == ".gif") {
    return image_load_gif(pathValue);
  }
  if (extension == ".webp") {
    return image_load_webp(pathValue);
  }
  throw std::runtime_error("Jayess image loadImage supports .ppm, .pgm, .bmp, .tga, .png, .jpeg, .jpg, .psd, .gif, and .webp files");
}`;
}

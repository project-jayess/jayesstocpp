export function getImageFileRuntimeCppFragment() {
  return `value image_save_ppm(const value& input, const value& pathValue) {
  const auto image = require_image_value(input);
  const auto pathText = require_image_path(pathValue);
  std::ofstream output(std::filesystem::path(pathText), std::ios::binary);
  if (!output) {
    throw std::runtime_error("Jayess image savePpm could not open output file");
  }

  output << "P3\\n" << image->width << " " << image->height << "\\n255\\n";
  for (int y = 0; y < image->height; ++y) {
    for (int x = 0; x < image->width; ++x) {
      const auto offset = image_pixel_offset(image, x, y);
      output << static_cast<int>(image->pixels[offset]) << " "
             << static_cast<int>(image->pixels[offset + 1]) << " "
             << static_cast<int>(image->pixels[offset + 2]) << "\\n";
    }
  }
  return input;
}

value image_save_bmp(const value& input, const value& pathValue) {
  const auto image = require_image_value(input);
  const auto pathText = require_image_path(pathValue);
  const auto rowBytes = ((image->width * 3) + 3) / 4 * 4;
  const auto pixelBytes = rowBytes * image->height;
  const auto fileBytes = 14 + 40 + pixelBytes;

  std::ofstream output(std::filesystem::path(pathText), std::ios::binary);
  if (!output) {
    throw std::runtime_error("Jayess image saveBmp could not open output file");
  }

  output.put('B');
  output.put('M');
  image_write_u32(output, static_cast<std::uint32_t>(fileBytes));
  image_write_u16(output, 0);
  image_write_u16(output, 0);
  image_write_u32(output, 54);
  image_write_u32(output, 40);
  image_write_u32(output, static_cast<std::uint32_t>(image->width));
  image_write_u32(output, static_cast<std::uint32_t>(image->height));
  image_write_u16(output, 1);
  image_write_u16(output, 24);
  image_write_u32(output, 0);
  image_write_u32(output, static_cast<std::uint32_t>(pixelBytes));
  image_write_u32(output, 2835);
  image_write_u32(output, 2835);
  image_write_u32(output, 0);
  image_write_u32(output, 0);

  std::vector<unsigned char> padding(static_cast<std::size_t>(rowBytes - image->width * 3), 0);
  for (int y = image->height - 1; y >= 0; --y) {
    for (int x = 0; x < image->width; ++x) {
      const auto color = image_read_pixel(image, x, y);
      output.put(static_cast<char>(color[2]));
      output.put(static_cast<char>(color[1]));
      output.put(static_cast<char>(color[0]));
    }
    for (const auto byte : padding) {
      output.put(static_cast<char>(byte));
    }
  }
  return input;
}

value image_save_pgm(const value& input, const value& pathValue) {
  const auto image = require_image_value(input);
  const auto pathText = require_image_path(pathValue);
  std::ofstream output(std::filesystem::path(pathText), std::ios::binary);
  if (!output) {
    throw std::runtime_error("Jayess image savePgm could not open output file");
  }

  output << "P2\\n" << image->width << " " << image->height << "\\n255\\n";
  for (int y = 0; y < image->height; ++y) {
    for (int x = 0; x < image->width; ++x) {
      const auto color = image_read_pixel(image, x, y);
      output << ((static_cast<int>(color[0]) + static_cast<int>(color[1]) + static_cast<int>(color[2])) / 3) << "\\n";
    }
  }
  return input;
}

value image_save_tga(const value& input, const value& pathValue) {
  const auto image = require_image_value(input);
  const auto pathText = require_image_path(pathValue);
  std::ofstream output(std::filesystem::path(pathText), std::ios::binary);
  if (!output) {
    throw std::runtime_error("Jayess image saveTga could not open output file");
  }
  if (image->width > 65535 || image->height > 65535) {
    throw std::runtime_error("Jayess image saveTga supports dimensions up to 65535");
  }

  output.put(0);
  output.put(0);
  output.put(2);
  image_write_u16(output, 0);
  image_write_u16(output, 0);
  output.put(0);
  image_write_u16(output, 0);
  image_write_u16(output, 0);
  image_write_u16(output, static_cast<std::uint16_t>(image->width));
  image_write_u16(output, static_cast<std::uint16_t>(image->height));
  output.put(24);
  output.put(0x20);

  for (int y = 0; y < image->height; ++y) {
    for (int x = 0; x < image->width; ++x) {
      const auto color = image_read_pixel(image, x, y);
      output.put(static_cast<char>(color[2]));
      output.put(static_cast<char>(color[1]));
      output.put(static_cast<char>(color[0]));
    }
  }
  return input;
}

value image_load_ppm(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  std::ifstream input(std::filesystem::path(pathText), std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image loadPpm could not open input file");
  }

  const auto dimensions = image_read_ppm_dimensions(input, "loadPpm", "P3");
  const auto width = dimensions[0];
  const auto height = dimensions[1];

  auto image = image_allocate(width, height);
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      const auto red = image_read_ppm_integer(input, "Jayess image loadPpm found unsupported red channel");
      const auto green = image_read_ppm_integer(input, "Jayess image loadPpm found unsupported green channel");
      const auto blue = image_read_ppm_integer(input, "Jayess image loadPpm found unsupported blue channel");
      if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
        throw std::runtime_error("Jayess image loadPpm found unsupported PPM channel");
      }
      image_write_pixel(image, x, y, {
        static_cast<unsigned char>(red),
        static_cast<unsigned char>(green),
        static_cast<unsigned char>(blue),
        255
      });
    }
  }
  return image;
}

value image_load_bmp(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  std::ifstream input(std::filesystem::path(pathText), std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image loadBmp could not open input file");
  }

  if (input.get() != 'B' || input.get() != 'M') {
    throw std::runtime_error("Jayess image loadBmp only supports BMP files");
  }
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP size");
  image_read_u16(input, "Jayess image loadBmp found unsupported BMP reserved field");
  image_read_u16(input, "Jayess image loadBmp found unsupported BMP reserved field");
  const auto pixelOffset = image_read_u32(input, "Jayess image loadBmp found unsupported BMP offset");
  const auto headerSize = image_read_u32(input, "Jayess image loadBmp found unsupported BMP header");
  if (headerSize != 40U) {
    throw std::runtime_error("Jayess image loadBmp only supports BITMAPINFOHEADER BMP files");
  }
  const auto rawWidth = image_read_u32(input, "Jayess image loadBmp found unsupported BMP width");
  const auto rawHeight = image_read_u32(input, "Jayess image loadBmp found unsupported BMP height");
  const auto planes = image_read_u16(input, "Jayess image loadBmp found unsupported BMP planes");
  const auto bitDepth = image_read_u16(input, "Jayess image loadBmp found unsupported BMP bit depth");
  const auto compression = image_read_u32(input, "Jayess image loadBmp found unsupported BMP compression");
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP image size");
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP x pixels");
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP y pixels");
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP colors");
  image_read_u32(input, "Jayess image loadBmp found unsupported BMP important colors");

  if (
    rawWidth == 0U ||
    rawHeight == 0U ||
    rawWidth > static_cast<std::uint32_t>(std::numeric_limits<int>::max()) ||
    rawHeight > static_cast<std::uint32_t>(std::numeric_limits<int>::max()) ||
    planes != 1U ||
    bitDepth != 24U ||
    compression != 0U
  ) {
    throw std::runtime_error("Jayess image loadBmp only supports uncompressed 24-bit BMP files");
  }

  const auto width = static_cast<int>(rawWidth);
  const auto height = static_cast<int>(rawHeight);
  auto image = image_allocate(width, height);
  const auto rowBytes = ((width * 3) + 3) / 4 * 4;
  input.seekg(static_cast<std::streamoff>(pixelOffset), std::ios::beg);
  if (!input) {
    throw std::runtime_error("Jayess image loadBmp found unsupported BMP pixel offset");
  }

  for (int sourceY = height - 1; sourceY >= 0; --sourceY) {
    for (int x = 0; x < width; ++x) {
      const auto eof = std::char_traits<char>::eof();
      const auto blue = input.get();
      const auto green = input.get();
      const auto red = input.get();
      if (blue == eof || green == eof || red == eof) {
        throw std::runtime_error("Jayess image loadBmp found incomplete BMP pixel data");
      }
      image_write_pixel(image, x, sourceY, {
        static_cast<unsigned char>(red),
        static_cast<unsigned char>(green),
        static_cast<unsigned char>(blue),
        255
      });
    }
    for (int padding = width * 3; padding < rowBytes; ++padding) {
      if (input.get() == std::char_traits<char>::eof()) {
        throw std::runtime_error("Jayess image loadBmp found incomplete BMP row padding");
      }
    }
  }
  return image;
}

value image_load_pgm(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  std::ifstream input(std::filesystem::path(pathText), std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image loadPgm could not open input file");
  }

  const auto dimensions = image_read_ppm_dimensions(input, "loadPgm", "P2");
  const auto width = dimensions[0];
  const auto height = dimensions[1];
  auto image = image_allocate(width, height);
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      const auto gray = image_read_ppm_integer(input, "Jayess image loadPgm found unsupported gray channel");
      if (gray < 0 || gray > 255) {
        throw std::runtime_error("Jayess image loadPgm found unsupported gray channel");
      }
      const auto channel = static_cast<unsigned char>(gray);
      image_write_pixel(image, x, y, {channel, channel, channel, 255});
    }
  }
  return image;
}

value image_load_tga(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  std::ifstream input(std::filesystem::path(pathText), std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image loadTga could not open input file");
  }

  const auto eof = std::char_traits<char>::eof();
  const auto idLength = input.get();
  const auto colorMapType = input.get();
  const auto imageType = input.get();
  if (idLength == eof || colorMapType == eof || imageType == eof) {
    throw std::runtime_error("Jayess image loadTga found unsupported TGA header");
  }
  image_read_u16(input, "Jayess image loadTga found unsupported TGA color map");
  image_read_u16(input, "Jayess image loadTga found unsupported TGA color map");
  if (input.get() == eof) {
    throw std::runtime_error("Jayess image loadTga found unsupported TGA color map");
  }
  image_read_u16(input, "Jayess image loadTga found unsupported TGA origin");
  image_read_u16(input, "Jayess image loadTga found unsupported TGA origin");
  const auto width = image_read_u16(input, "Jayess image loadTga found unsupported TGA width");
  const auto height = image_read_u16(input, "Jayess image loadTga found unsupported TGA height");
  const auto bitDepth = input.get();
  const auto descriptor = input.get();
  if (
    colorMapType != 0 ||
    imageType != 2 ||
    width == 0U ||
    height == 0U ||
    bitDepth != 24 ||
    descriptor == eof
  ) {
    throw std::runtime_error("Jayess image loadTga only supports uncompressed 24-bit TGA files");
  }

  if (idLength > 0) {
    input.ignore(idLength);
  }

  auto image = image_allocate(static_cast<int>(width), static_cast<int>(height));
  const bool topOrigin = (descriptor & 0x20) != 0;
  for (int sourceY = 0; sourceY < image->height; ++sourceY) {
    const auto y = topOrigin ? sourceY : image->height - 1 - sourceY;
    for (int x = 0; x < image->width; ++x) {
      const auto blue = input.get();
      const auto green = input.get();
      const auto red = input.get();
      if (blue == eof || green == eof || red == eof) {
        throw std::runtime_error("Jayess image loadTga found incomplete TGA pixel data");
      }
      image_write_pixel(image, x, y, {
        static_cast<unsigned char>(red),
        static_cast<unsigned char>(green),
        static_cast<unsigned char>(blue),
        255
      });
    }
  }
  return image;
}

value image_metadata_from_file(const value& pathValue) {
  const auto pathText = require_image_path(pathValue);
  const auto pathObject = std::filesystem::path(pathText);
  const auto extension = image_lower_extension(pathObject);
  std::ifstream input(pathObject, std::ios::binary);
  if (!input) {
    throw std::runtime_error("Jayess image metadataFromFile could not open input file");
  }

  if (extension == ".ppm") {
    const auto dimensions = image_read_ppm_dimensions(input, "metadataFromFile", "P3");
    return image_make_metadata(dimensions[0], dimensions[1], "ppm");
  }
  if (extension == ".pgm") {
    const auto dimensions = image_read_ppm_dimensions(input, "metadataFromFile", "P2");
    return image_make_metadata(dimensions[0], dimensions[1], "pgm");
  }
  if (extension == ".bmp") {
    const auto dimensions = image_read_bmp_dimensions(input, "metadataFromFile");
    return image_make_metadata(dimensions[0], dimensions[1], "bmp");
  }
  if (extension == ".tga") {
    const auto dimensions = image_read_tga_dimensions(input, "metadataFromFile");
    return image_make_metadata(dimensions[0], dimensions[1], "tga");
  }
  throw std::runtime_error("Jayess image metadataFromFile supports .ppm, .pgm, .bmp, and .tga files");
}

value image_encode_ppm(const value& input) {
  const auto image = require_image_value(input);
  std::ostringstream output;
  output << "P3\\n" << image->width << " " << image->height << "\\n255\\n";
  for (int y = 0; y < image->height; ++y) {
    for (int x = 0; x < image->width; ++x) {
      const auto color = image_read_pixel(image, x, y);
      output << static_cast<int>(color[0]) << " "
             << static_cast<int>(color[1]) << " "
             << static_cast<int>(color[2]) << "\\n";
    }
  }
  const auto text = output.str();
  return image_make_bytes(std::vector<unsigned char>(text.begin(), text.end()));
}

value image_decode_ppm(const value& input) {
  const auto bytes = require_image_bytes_value(input, "Jayess image decodePpm expects bytes input");
  const std::string text(bytes->items.begin(), bytes->items.end());
  std::istringstream stream(text);
  const auto dimensions = image_read_ppm_dimensions(stream, "decodePpm", "P3");
  const auto width = dimensions[0];
  const auto height = dimensions[1];
  auto image = image_allocate(width, height);
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      const auto red = image_read_ppm_integer(stream, "Jayess image decodePpm found unsupported red channel");
      const auto green = image_read_ppm_integer(stream, "Jayess image decodePpm found unsupported green channel");
      const auto blue = image_read_ppm_integer(stream, "Jayess image decodePpm found unsupported blue channel");
      if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
        throw std::runtime_error("Jayess image decodePpm found unsupported PPM channel");
      }
      image_write_pixel(image, x, y, {
        static_cast<unsigned char>(red),
        static_cast<unsigned char>(green),
        static_cast<unsigned char>(blue),
        255
      });
    }
  }
  return image;
}`;
}

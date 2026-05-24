import { getImageFileRuntimeCppFragment } from "./runtime-image-file-source.js";

export function getImageRuntimeHeaderFragment() {
  return `struct image_state {
  int width = 0;
  int height = 0;
  std::vector<unsigned char> pixels;
};

value image_create(const value& width, const value& height, const value& background);
value image_width(const value& image);
value image_height(const value& image);
value image_get_pixel(const value& image, const value& x, const value& y);
value image_set_pixel(const value& image, const value& x, const value& y, const value& color);
value image_fill(const value& image, const value& color);
value image_fill_rect(const value& image, const value& x, const value& y, const value& width, const value& height, const value& color);
value image_fill_rect_alpha(const value& image, const value& x, const value& y, const value& width, const value& height, const value& color);
value image_copy(const value& image);
value image_save_ppm(const value& image, const value& path);
value image_save_bmp(const value& image, const value& path);
value image_save_pgm(const value& image, const value& path);
value image_save_tga(const value& image, const value& path);
value image_load_ppm(const value& path);
value image_load_bmp(const value& path);
value image_load_pgm(const value& path);
value image_load_tga(const value& path);
value image_metadata_from_file(const value& path);
value image_encode_ppm(const value& image);
value image_decode_ppm(const value& bytes);
value image_encode_pgm(const value& image);
value image_decode_pgm(const value& bytes);
value image_crop(const value& image, const value& x, const value& y, const value& width, const value& height);
value image_resize_nearest(const value& image, const value& width, const value& height);
value image_blit(const value& target, const value& source, const value& x, const value& y);
value image_flip_horizontal(const value& image);
value image_flip_vertical(const value& image);
value image_rotate_90(const value& image);
value image_transparent_blit(const value& target, const value& source, const value& x, const value& y);
bool is_image_value(const value& input);`;
}

export function getImageRuntimeCppFragment() {
  return `namespace {
image_ptr require_image_value(const value& input) {
  if (!std::holds_alternative<image_ptr>(input)) {
    throw_invalid_handle("image", "image");
  }
  return std::get<image_ptr>(input);
}

bytes_ptr require_image_bytes_value(const value& input, const std::string& message) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<bytes_ptr>(input);
}

double require_image_number(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return numeric;
}

int require_image_dimension(const value& input, const std::string& message) {
  const auto numeric = require_image_number(input, message);
  if (numeric <= 0.0 || numeric > static_cast<double>((std::numeric_limits<int>::max)())) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

int require_image_span(const value& input, const std::string& message) {
  const auto numeric = require_image_number(input, message);
  if (numeric < 0.0 || numeric > static_cast<double>((std::numeric_limits<int>::max)())) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

int require_image_coordinate(const value& input, int limit, const std::string& message) {
  const auto numeric = require_image_number(input, message);
  if (numeric < 0.0 || numeric >= static_cast<double>(limit)) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

int require_image_offset(const value& input, const std::string& message) {
  const auto numeric = require_image_number(input, message);
  if (
    numeric < static_cast<double>((std::numeric_limits<int>::min)()) ||
    numeric > static_cast<double>((std::numeric_limits<int>::max)())
  ) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

std::string require_image_path(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess image path must be a string");
  }
  return std::get<std::string>(input);
}

value require_image_color_field(const object_ptr& color, const std::string& field) {
  const auto found = color->fields.find(field);
  if (found == color->fields.end()) {
    throw std::runtime_error("Jayess image expected a color object with red, green, blue, and alpha");
  }
  return found->second;
}

unsigned char require_image_channel(const value& input, const std::string& message) {
  const auto numeric = require_image_number(input, message);
  if (numeric < 0.0 || numeric > 255.0) {
    throw std::runtime_error(message);
  }
  return static_cast<unsigned char>(numeric);
}

unsigned char require_image_alpha(const value& input) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error("Jayess image alpha must be between 0 and 1");
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || numeric < 0.0 || numeric > 1.0) {
    throw std::runtime_error("Jayess image alpha must be between 0 and 1");
  }
  return static_cast<unsigned char>(std::round(numeric * 255.0));
}

std::array<unsigned char, 4> require_image_color(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess image expected a color object");
  }
  const auto color = std::get<object_ptr>(input);
  return {
    require_image_channel(require_image_color_field(color, "red"), "Jayess image red channel must be an integer between 0 and 255"),
    require_image_channel(require_image_color_field(color, "green"), "Jayess image green channel must be an integer between 0 and 255"),
    require_image_channel(require_image_color_field(color, "blue"), "Jayess image blue channel must be an integer between 0 and 255"),
    require_image_alpha(require_image_color_field(color, "alpha"))
  };
}

std::size_t image_pixel_offset(const image_ptr& image, int x, int y) {
  return (static_cast<std::size_t>(y) * static_cast<std::size_t>(image->width) + static_cast<std::size_t>(x)) * 4U;
}

void image_require_storage_dimensions(int width, int height, const std::string& message) {
  if (width <= 0 || height <= 0) {
    throw std::runtime_error(message);
  }
  constexpr std::size_t imageStorageByteLimit = 256U * 1024U * 1024U;
  const auto maxPixels = imageStorageByteLimit / 4U;
  const auto widthValue = static_cast<std::size_t>(width);
  const auto heightValue = static_cast<std::size_t>(height);
  if (widthValue > maxPixels / heightValue) {
    throw std::runtime_error(message);
  }
}

image_ptr image_allocate(int width, int height) {
  image_require_storage_dimensions(width, height, "Jayess image dimensions exceed supported size");
  auto image = std::make_shared<image_state>();
  image->width = width;
  image->height = height;
  image->pixels.resize(static_cast<std::size_t>(width) * static_cast<std::size_t>(height) * 4U);
  return image;
}

void image_write_pixel(const image_ptr& image, int x, int y, const std::array<unsigned char, 4>& color) {
  const auto offset = image_pixel_offset(image, x, y);
  image->pixels[offset] = color[0];
  image->pixels[offset + 1] = color[1];
  image->pixels[offset + 2] = color[2];
  image->pixels[offset + 3] = color[3];
}

value image_make_color(unsigned char red, unsigned char green, unsigned char blue, unsigned char alpha) {
  return make_object({
    {"red", static_cast<double>(red)},
    {"green", static_cast<double>(green)},
    {"blue", static_cast<double>(blue)},
    {"alpha", static_cast<double>(alpha) / 255.0}
  });
}

value image_make_metadata(int width, int height, const std::string& format) {
  return make_object({
    {"width", static_cast<double>(width)},
    {"height", static_cast<double>(height)},
    {"format", format}
  });
}

value image_make_bytes(std::vector<unsigned char> items) {
  auto bytes = std::make_shared<bytes_value>();
  bytes->items = std::move(items);
  return bytes;
}

std::array<unsigned char, 4> image_read_pixel(const image_ptr& image, int x, int y) {
  const auto offset = image_pixel_offset(image, x, y);
  return {image->pixels[offset], image->pixels[offset + 1], image->pixels[offset + 2], image->pixels[offset + 3]};
}

std::array<unsigned char, 4> image_alpha_blend(const std::array<unsigned char, 4>& destination, const std::array<unsigned char, 4>& source) {
  const auto alpha = static_cast<int>(source[3]);
  const auto inverse = 255 - alpha;
  return {
    static_cast<unsigned char>((static_cast<int>(source[0]) * alpha + static_cast<int>(destination[0]) * inverse) / 255),
    static_cast<unsigned char>((static_cast<int>(source[1]) * alpha + static_cast<int>(destination[1]) * inverse) / 255),
    static_cast<unsigned char>((static_cast<int>(source[2]) * alpha + static_cast<int>(destination[2]) * inverse) / 255),
    255
  };
}

void image_write_u16(std::ostream& output, std::uint16_t value) {
  output.put(static_cast<char>(value & 0xffU));
  output.put(static_cast<char>((value >> 8U) & 0xffU));
}

void image_write_u32(std::ostream& output, std::uint32_t value) {
  output.put(static_cast<char>(value & 0xffU));
  output.put(static_cast<char>((value >> 8U) & 0xffU));
  output.put(static_cast<char>((value >> 16U) & 0xffU));
  output.put(static_cast<char>((value >> 24U) & 0xffU));
}

std::uint16_t image_read_u16(std::istream& input, const std::string& message) {
  const auto eof = std::char_traits<char>::eof();
  const auto a = input.get();
  const auto b = input.get();
  if (a == eof || b == eof) {
    throw std::runtime_error(message);
  }
  return static_cast<std::uint16_t>(static_cast<unsigned char>(a) | (static_cast<unsigned char>(b) << 8U));
}

std::uint32_t image_read_u32(std::istream& input, const std::string& message) {
  const auto eof = std::char_traits<char>::eof();
  const auto a = input.get();
  const auto b = input.get();
  const auto c = input.get();
  const auto d = input.get();
  if (a == eof || b == eof || c == eof || d == eof) {
    throw std::runtime_error(message);
  }
  return static_cast<std::uint32_t>(static_cast<unsigned char>(a))
    | (static_cast<std::uint32_t>(static_cast<unsigned char>(b)) << 8U)
    | (static_cast<std::uint32_t>(static_cast<unsigned char>(c)) << 16U)
    | (static_cast<std::uint32_t>(static_cast<unsigned char>(d)) << 24U);
}

std::string image_lower_extension(const std::filesystem::path& pathValue) {
  auto extension = pathValue.extension().string();
  std::transform(extension.begin(), extension.end(), extension.begin(), [](unsigned char item) {
    return static_cast<char>(std::tolower(item));
  });
  return extension;
}

std::string image_read_ppm_token(std::istream& input) {
  std::string token;
  while (input >> token) {
    if (!token.empty() && token[0] == '#') {
      std::string ignored;
      std::getline(input, ignored);
      continue;
    }
    return token;
  }
  throw std::runtime_error("Jayess image loadPpm found unsupported PPM content");
}

int image_read_ppm_integer(std::istream& input, const std::string& message) {
  const auto token = image_read_ppm_token(input);
  try {
    std::size_t consumed = 0;
    const auto value = std::stoi(token, &consumed);
    if (consumed != token.size()) {
      throw std::runtime_error(message);
    }
    return value;
  } catch (const std::exception&) {
    throw std::runtime_error(message);
  }
}

std::array<int, 2> image_read_ppm_dimensions(std::istream& input, const std::string& operation, const std::string& expectedMagic) {
  if (image_read_ppm_token(input) != expectedMagic) {
    throw std::runtime_error("Jayess image " + operation + " only supports ASCII " + expectedMagic + " content");
  }
  const auto width = image_read_ppm_integer(input, "Jayess image " + operation + " found unsupported width");
  const auto height = image_read_ppm_integer(input, "Jayess image " + operation + " found unsupported height");
  const auto maxValue = image_read_ppm_integer(input, "Jayess image " + operation + " found unsupported max value");
  if (width <= 0 || height <= 0 || maxValue != 255) {
    throw std::runtime_error("Jayess image " + operation + " found unsupported content");
  }
  image_require_storage_dimensions(width, height, "Jayess image " + operation + " found unsupported image dimensions");
  return {width, height};
}

std::array<int, 2> image_read_bmp_dimensions(std::istream& input, const std::string& operation) {
  if (input.get() != 'B' || input.get() != 'M') {
    throw std::runtime_error("Jayess image " + operation + " only supports BMP files");
  }
  image_read_u32(input, "Jayess image " + operation + " found unsupported BMP size");
  image_read_u16(input, "Jayess image " + operation + " found unsupported BMP reserved field");
  image_read_u16(input, "Jayess image " + operation + " found unsupported BMP reserved field");
  image_read_u32(input, "Jayess image " + operation + " found unsupported BMP offset");
  const auto headerSize = image_read_u32(input, "Jayess image " + operation + " found unsupported BMP header");
  if (headerSize != 40U) {
    throw std::runtime_error("Jayess image " + operation + " only supports BITMAPINFOHEADER BMP files");
  }
  const auto rawWidth = image_read_u32(input, "Jayess image " + operation + " found unsupported BMP width");
  const auto rawHeight = image_read_u32(input, "Jayess image " + operation + " found unsupported BMP height");
  if (
    rawWidth == 0U ||
    rawHeight == 0U ||
    rawWidth > static_cast<std::uint32_t>((std::numeric_limits<int>::max)()) ||
    rawHeight > static_cast<std::uint32_t>((std::numeric_limits<int>::max)())
  ) {
    throw std::runtime_error("Jayess image " + operation + " found unsupported BMP dimensions");
  }
  const auto width = static_cast<int>(rawWidth);
  const auto height = static_cast<int>(rawHeight);
  image_require_storage_dimensions(width, height, "Jayess image " + operation + " found unsupported BMP dimensions");
  return {width, height};
}

std::array<int, 2> image_read_tga_dimensions(std::istream& input, const std::string& operation) {
  const auto eof = std::char_traits<char>::eof();
  const auto idLength = input.get();
  const auto colorMapType = input.get();
  const auto imageType = input.get();
  if (idLength == eof || colorMapType == eof || imageType == eof) {
    throw std::runtime_error("Jayess image " + operation + " found unsupported TGA header");
  }
  for (int index = 0; index < 9; ++index) {
    if (input.get() == eof) {
      throw std::runtime_error("Jayess image " + operation + " found unsupported TGA header");
    }
  }
  const auto width = image_read_u16(input, "Jayess image " + operation + " found unsupported TGA width");
  const auto height = image_read_u16(input, "Jayess image " + operation + " found unsupported TGA height");
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
    throw std::runtime_error("Jayess image " + operation + " only supports uncompressed 24-bit TGA files");
  }
  const auto widthValue = static_cast<int>(width);
  const auto heightValue = static_cast<int>(height);
  image_require_storage_dimensions(widthValue, heightValue, "Jayess image " + operation + " found unsupported TGA dimensions");
  return {widthValue, heightValue};
}
} // namespace

bool is_image_value(const value& input) {
  return std::holds_alternative<image_ptr>(input);
}

value image_create(const value& widthValue, const value& heightValue, const value& backgroundValue) {
  const auto width = require_image_dimension(widthValue, "Jayess image width must be a positive integer");
  const auto height = require_image_dimension(heightValue, "Jayess image height must be a positive integer");
  const auto background = require_image_color(backgroundValue);

  auto image = image_allocate(width, height);
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      image_write_pixel(image, x, y, background);
    }
  }
  return image;
}

value image_width(const value& input) {
  return static_cast<double>(require_image_value(input)->width);
}

value image_height(const value& input) {
  return static_cast<double>(require_image_value(input)->height);
}

value image_get_pixel(const value& input, const value& xValue, const value& yValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_coordinate(xValue, image->width, "Jayess image x coordinate is out of range");
  const auto y = require_image_coordinate(yValue, image->height, "Jayess image y coordinate is out of range");
  const auto offset = image_pixel_offset(image, x, y);
  return image_make_color(image->pixels[offset], image->pixels[offset + 1], image->pixels[offset + 2], image->pixels[offset + 3]);
}

value image_set_pixel(const value& input, const value& xValue, const value& yValue, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_coordinate(xValue, image->width, "Jayess image x coordinate is out of range");
  const auto y = require_image_coordinate(yValue, image->height, "Jayess image y coordinate is out of range");
  image_write_pixel(image, x, y, require_image_color(colorValue));
  return input;
}

value image_fill(const value& input, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto color = require_image_color(colorValue);
  for (int y = 0; y < image->height; ++y) {
    for (int x = 0; x < image->width; ++x) {
      image_write_pixel(image, x, y, color);
    }
  }
  return input;
}

value image_fill_rect(const value& input, const value& xValue, const value& yValue, const value& widthValue, const value& heightValue, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_offset(xValue, "Jayess image fillRect x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image fillRect y must be an integer within supported range");
  const auto width = require_image_span(widthValue, "Jayess image fillRect width must be a non-negative integer");
  const auto height = require_image_span(heightValue, "Jayess image fillRect height must be a non-negative integer");
  const auto color = require_image_color(colorValue);
  if (width == 0 || height == 0) {
    return input;
  }

  for (int row = 0; row < height; ++row) {
    const auto targetY = static_cast<long long>(y) + static_cast<long long>(row);
    if (targetY < 0 || targetY >= image->height) {
      continue;
    }
    for (int column = 0; column < width; ++column) {
      const auto targetX = static_cast<long long>(x) + static_cast<long long>(column);
      if (targetX < 0 || targetX >= image->width) {
        continue;
      }
      image_write_pixel(image, static_cast<int>(targetX), static_cast<int>(targetY), color);
    }
  }
  return input;
}

value image_fill_rect_alpha(const value& input, const value& xValue, const value& yValue, const value& widthValue, const value& heightValue, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_offset(xValue, "Jayess image fillRectAlpha x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image fillRectAlpha y must be an integer within supported range");
  const auto width = require_image_span(widthValue, "Jayess image fillRectAlpha width must be a non-negative integer");
  const auto height = require_image_span(heightValue, "Jayess image fillRectAlpha height must be a non-negative integer");
  const auto color = require_image_color(colorValue);
  if (width == 0 || height == 0) {
    return input;
  }

  for (int row = 0; row < height; ++row) {
    const auto targetY = static_cast<long long>(y) + static_cast<long long>(row);
    if (targetY < 0 || targetY >= image->height) {
      continue;
    }
    for (int column = 0; column < width; ++column) {
      const auto targetX = static_cast<long long>(x) + static_cast<long long>(column);
      if (targetX < 0 || targetX >= image->width) {
        continue;
      }
      const auto destination = image_read_pixel(image, static_cast<int>(targetX), static_cast<int>(targetY));
      image_write_pixel(
        image,
        static_cast<int>(targetX),
        static_cast<int>(targetY),
        image_alpha_blend(destination, color)
      );
    }
  }
  return input;
}

value image_copy(const value& input) {
  const auto source = require_image_value(input);
  auto copied = std::make_shared<image_state>();
  copied->width = source->width;
  copied->height = source->height;
  copied->pixels = source->pixels;
  return copied;
}

${getImageFileRuntimeCppFragment()}

value image_crop(const value& input, const value& xValue, const value& yValue, const value& widthValue, const value& heightValue) {
  const auto source = require_image_value(input);
  const auto x = require_image_coordinate(xValue, source->width, "Jayess image crop x coordinate is out of range");
  const auto y = require_image_coordinate(yValue, source->height, "Jayess image crop y coordinate is out of range");
  const auto width = require_image_dimension(widthValue, "Jayess image crop width must be a positive integer");
  const auto height = require_image_dimension(heightValue, "Jayess image crop height must be a positive integer");
  if (width > source->width - x || height > source->height - y) {
    throw std::runtime_error("Jayess image crop rectangle is out of range");
  }

  auto cropped = image_allocate(width, height);
  for (int row = 0; row < height; ++row) {
    for (int column = 0; column < width; ++column) {
      image_write_pixel(cropped, column, row, image_read_pixel(source, x + column, y + row));
    }
  }
  return cropped;
}

value image_resize_nearest(const value& input, const value& widthValue, const value& heightValue) {
  const auto source = require_image_value(input);
  const auto width = require_image_dimension(widthValue, "Jayess image resize width must be a positive integer");
  const auto height = require_image_dimension(heightValue, "Jayess image resize height must be a positive integer");
  auto resized = image_allocate(width, height);

  for (int row = 0; row < height; ++row) {
    const auto sourceY = row * source->height / height;
    for (int column = 0; column < width; ++column) {
      const auto sourceX = column * source->width / width;
      image_write_pixel(resized, column, row, image_read_pixel(source, sourceX, sourceY));
    }
  }
  return resized;
}

value image_blit(const value& targetValue, const value& sourceValue, const value& xValue, const value& yValue) {
  const auto target = require_image_value(targetValue);
  const auto source = require_image_value(sourceValue);
  const auto x = require_image_offset(xValue, "Jayess image blit x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image blit y must be an integer within supported range");

  for (int row = 0; row < source->height; ++row) {
    const auto targetY = static_cast<long long>(y) + static_cast<long long>(row);
    if (targetY < 0 || targetY >= target->height) {
      continue;
    }
    for (int column = 0; column < source->width; ++column) {
      const auto targetX = static_cast<long long>(x) + static_cast<long long>(column);
      if (targetX < 0 || targetX >= target->width) {
        continue;
      }
      image_write_pixel(target, static_cast<int>(targetX), static_cast<int>(targetY), image_read_pixel(source, column, row));
    }
  }
  return targetValue;
}

value image_flip_horizontal(const value& input) {
  const auto source = require_image_value(input);
  auto output = image_allocate(source->width, source->height);
  for (int y = 0; y < source->height; ++y) {
    for (int x = 0; x < source->width; ++x) {
      image_write_pixel(output, source->width - 1 - x, y, image_read_pixel(source, x, y));
    }
  }
  return output;
}

value image_flip_vertical(const value& input) {
  const auto source = require_image_value(input);
  auto output = image_allocate(source->width, source->height);
  for (int y = 0; y < source->height; ++y) {
    for (int x = 0; x < source->width; ++x) {
      image_write_pixel(output, x, source->height - 1 - y, image_read_pixel(source, x, y));
    }
  }
  return output;
}

value image_rotate_90(const value& input) {
  const auto source = require_image_value(input);
  auto output = image_allocate(source->height, source->width);
  for (int y = 0; y < source->height; ++y) {
    for (int x = 0; x < source->width; ++x) {
      image_write_pixel(output, source->height - 1 - y, x, image_read_pixel(source, x, y));
    }
  }
  return output;
}

value image_transparent_blit(const value& targetValue, const value& sourceValue, const value& xValue, const value& yValue) {
  const auto target = require_image_value(targetValue);
  const auto source = require_image_value(sourceValue);
  const auto x = require_image_offset(xValue, "Jayess image transparentBlit x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image transparentBlit y must be an integer within supported range");

  for (int row = 0; row < source->height; ++row) {
    const auto targetY = static_cast<long long>(y) + static_cast<long long>(row);
    if (targetY < 0 || targetY >= target->height) {
      continue;
    }
    for (int column = 0; column < source->width; ++column) {
      const auto targetX = static_cast<long long>(x) + static_cast<long long>(column);
      if (targetX < 0 || targetX >= target->width) {
        continue;
      }
      const auto sourceColor = image_read_pixel(source, column, row);
      const auto targetColor = image_read_pixel(target, static_cast<int>(targetX), static_cast<int>(targetY));
      image_write_pixel(target, static_cast<int>(targetX), static_cast<int>(targetY), image_alpha_blend(targetColor, sourceColor));
    }
  }
  return targetValue;
}`;
}

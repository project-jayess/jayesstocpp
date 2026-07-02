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
value image_draw_line(const value& image, const value& x1, const value& y1, const value& x2, const value& y2, const value& color, const value& strokeWidth);
value image_fill_ellipse(const value& image, const value& x, const value& y, const value& width, const value& height, const value& color);
value image_fill_capsule(const value& image, const value& x, const value& y, const value& width, const value& height, const value& color);
value image_copy(const value& image);
value image_antialias(const value& image, const value& level);
value image_shadow_mask(const value& image, const value& blurRadius, const value& spreadRadius, const value& color);
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
value image_transparent_blit_clipped(const value& target, const value& source, const value& x, const value& y, const value& clipX, const value& clipY, const value& clipWidth, const value& clipHeight);
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

void image_write_pixel_alpha(const image_ptr& image, int x, int y, const std::array<unsigned char, 4>& color) {
  if (color[3] == 0U) {
    return;
  }
  if (color[3] == 255U) {
    image_write_pixel(image, x, y, color);
    return;
  }
  image_write_pixel(image, x, y, image_alpha_blend(image_read_pixel(image, x, y), color));
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

std::array<unsigned char, 4> image_color_with_coverage(const std::array<unsigned char, 4>& color, double coverage) {
  const auto clamped = (std::max)(0.0, (std::min)(1.0, coverage));
  return {
    color[0],
    color[1],
    color[2],
    static_cast<unsigned char>(std::round(static_cast<double>(color[3]) * clamped))
  };
}

bool image_ellipse_point_inside(double px, double py, int x, int y, int width, int height) {
  if (width <= 0 || height <= 0) {
    return false;
  }
  const auto radiusX = static_cast<double>(width) / 2.0;
  const auto radiusY = static_cast<double>(height) / 2.0;
  const auto centerX = static_cast<double>(x) + radiusX;
  const auto centerY = static_cast<double>(y) + radiusY;
  const auto dx = (px - centerX) / radiusX;
  const auto dy = (py - centerY) / radiusY;
  return dx * dx + dy * dy <= 1.0;
}

double image_ellipse_coverage(int column, int row, int x, int y, int width, int height) {
  constexpr int samplesPerAxis = 4;
  int covered = 0;
  for (int sampleY = 0; sampleY < samplesPerAxis; ++sampleY) {
    for (int sampleX = 0; sampleX < samplesPerAxis; ++sampleX) {
      const auto px = static_cast<double>(column) + (static_cast<double>(sampleX) + 0.5) / static_cast<double>(samplesPerAxis);
      const auto py = static_cast<double>(row) + (static_cast<double>(sampleY) + 0.5) / static_cast<double>(samplesPerAxis);
      if (image_ellipse_point_inside(px, py, x, y, width, height)) {
        ++covered;
      }
    }
  }
  return static_cast<double>(covered) / static_cast<double>(samplesPerAxis * samplesPerAxis);
}

double image_clamp_double(double value, double minimum, double maximum) {
  return (std::max)(minimum, (std::min)(maximum, value));
}

double image_distance_to_segment(double px, double py, double x1, double y1, double x2, double y2) {
  const auto dx = x2 - x1;
  const auto dy = y2 - y1;
  const auto lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0.0) {
    const auto pointDx = px - x1;
    const auto pointDy = py - y1;
    return std::sqrt(pointDx * pointDx + pointDy * pointDy);
  }
  const auto t = image_clamp_double(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0.0, 1.0);
  const auto closestX = x1 + t * dx;
  const auto closestY = y1 + t * dy;
  const auto pointDx = px - closestX;
  const auto pointDy = py - closestY;
  return std::sqrt(pointDx * pointDx + pointDy * pointDy);
}

double image_line_coverage(int column, int row, double x1, double y1, double x2, double y2, double strokeWidth) {
  constexpr int samplesPerAxis = 4;
  const auto radius = (std::max)(0.5, strokeWidth / 2.0);
  int covered = 0;
  for (int sampleY = 0; sampleY < samplesPerAxis; ++sampleY) {
    for (int sampleX = 0; sampleX < samplesPerAxis; ++sampleX) {
      const auto px = static_cast<double>(column) + (static_cast<double>(sampleX) + 0.5) / static_cast<double>(samplesPerAxis);
      const auto py = static_cast<double>(row) + (static_cast<double>(sampleY) + 0.5) / static_cast<double>(samplesPerAxis);
      if (image_distance_to_segment(px, py, x1, y1, x2, y2) <= radius) {
        ++covered;
      }
    }
  }
  return static_cast<double>(covered) / static_cast<double>(samplesPerAxis * samplesPerAxis);
}

value image_draw_line(const value& input, const value& x1Value, const value& y1Value, const value& x2Value, const value& y2Value, const value& colorValue, const value& strokeWidthValue) {
  const auto image = require_image_value(input);
  const auto x1 = require_image_number(x1Value, "Jayess image drawLine x1 must be a number");
  const auto y1 = require_image_number(y1Value, "Jayess image drawLine y1 must be a number");
  const auto x2 = require_image_number(x2Value, "Jayess image drawLine x2 must be a number");
  const auto y2 = require_image_number(y2Value, "Jayess image drawLine y2 must be a number");
  const auto strokeWidth = require_image_number(strokeWidthValue, "Jayess image drawLine strokeWidth must be a number");
  if (strokeWidth < 1.0) {
    throw std::runtime_error("Jayess image drawLine strokeWidth must be at least 1");
  }
  const auto color = require_image_color(colorValue);
  const auto padding = strokeWidth / 2.0 + 1.0;
  const auto left = (std::max)(0, static_cast<int>(std::floor((std::min)(x1, x2) - padding)));
  const auto top = (std::max)(0, static_cast<int>(std::floor((std::min)(y1, y2) - padding)));
  const auto right = (std::min)(image->width, static_cast<int>(std::ceil((std::max)(x1, x2) + padding)));
  const auto bottom = (std::min)(image->height, static_cast<int>(std::ceil((std::max)(y1, y2) + padding)));
  for (int row = top; row < bottom; ++row) {
    for (int column = left; column < right; ++column) {
      const auto coverage = image_line_coverage(column, row, x1, y1, x2, y2, strokeWidth);
      if (coverage > 0.0) {
        image_write_pixel_alpha(image, column, row, image_color_with_coverage(color, coverage));
      }
    }
  }
  return input;
}

bool image_capsule_point_inside(double px, double py, int x, int y, int width, int height) {
  if (width <= 0 || height <= 0) {
    return false;
  }
  if (width >= height) {
    const auto radius = static_cast<double>(height) / 2.0;
    const auto centerY = static_cast<double>(y) + radius;
    const auto leftCenterX = static_cast<double>(x) + radius;
    const auto rightCenterX = static_cast<double>(x + width) - radius;
    const auto closestX = image_clamp_double(px, leftCenterX, rightCenterX);
    const auto dx = px - closestX;
    const auto dy = py - centerY;
    return dx * dx + dy * dy <= radius * radius;
  }
  const auto radius = static_cast<double>(width) / 2.0;
  const auto centerX = static_cast<double>(x) + radius;
  const auto topCenterY = static_cast<double>(y) + radius;
  const auto bottomCenterY = static_cast<double>(y + height) - radius;
  const auto closestY = image_clamp_double(py, topCenterY, bottomCenterY);
  const auto dx = px - centerX;
  const auto dy = py - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

double image_capsule_coverage(int column, int row, int x, int y, int width, int height) {
  constexpr int samplesPerAxis = 4;
  int covered = 0;
  for (int sampleY = 0; sampleY < samplesPerAxis; ++sampleY) {
    for (int sampleX = 0; sampleX < samplesPerAxis; ++sampleX) {
      const auto px = static_cast<double>(column) + (static_cast<double>(sampleX) + 0.5) / static_cast<double>(samplesPerAxis);
      const auto py = static_cast<double>(row) + (static_cast<double>(sampleY) + 0.5) / static_cast<double>(samplesPerAxis);
      if (image_capsule_point_inside(px, py, x, y, width, height)) {
        ++covered;
      }
    }
  }
  return static_cast<double>(covered) / static_cast<double>(samplesPerAxis * samplesPerAxis);
}

value image_fill_ellipse(const value& input, const value& xValue, const value& yValue, const value& widthValue, const value& heightValue, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_offset(xValue, "Jayess image fillEllipse x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image fillEllipse y must be an integer within supported range");
  const auto width = require_image_span(widthValue, "Jayess image fillEllipse width must be a non-negative integer");
  const auto height = require_image_span(heightValue, "Jayess image fillEllipse height must be a non-negative integer");
  const auto color = require_image_color(colorValue);
  if (width == 0 || height == 0) {
    return input;
  }
  const auto left = (std::max)(x, 0);
  const auto top = (std::max)(y, 0);
  const auto right = (std::min)(static_cast<long long>(x) + static_cast<long long>(width), static_cast<long long>(image->width));
  const auto bottom = (std::min)(static_cast<long long>(y) + static_cast<long long>(height), static_cast<long long>(image->height));
  for (int row = top; row < bottom; ++row) {
    for (int column = left; column < right; ++column) {
      const auto coverage = image_ellipse_coverage(column, row, x, y, width, height);
      if (coverage > 0.0) {
        image_write_pixel_alpha(image, column, row, image_color_with_coverage(color, coverage));
      }
    }
  }
  return input;
}

value image_fill_capsule(const value& input, const value& xValue, const value& yValue, const value& widthValue, const value& heightValue, const value& colorValue) {
  const auto image = require_image_value(input);
  const auto x = require_image_offset(xValue, "Jayess image fillCapsule x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image fillCapsule y must be an integer within supported range");
  const auto width = require_image_span(widthValue, "Jayess image fillCapsule width must be a non-negative integer");
  const auto height = require_image_span(heightValue, "Jayess image fillCapsule height must be a non-negative integer");
  const auto color = require_image_color(colorValue);
  if (width == 0 || height == 0) {
    return input;
  }
  const auto left = (std::max)(x, 0);
  const auto top = (std::max)(y, 0);
  const auto right = (std::min)(static_cast<long long>(x) + static_cast<long long>(width), static_cast<long long>(image->width));
  const auto bottom = (std::min)(static_cast<long long>(y) + static_cast<long long>(height), static_cast<long long>(image->height));
  for (int row = top; row < bottom; ++row) {
    for (int column = left; column < right; ++column) {
      const auto coverage = image_capsule_coverage(column, row, x, y, width, height);
      if (coverage > 0.0) {
        image_write_pixel_alpha(image, column, row, image_color_with_coverage(color, coverage));
      }
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

int image_color_distance(const std::array<unsigned char, 4>& left, const std::array<unsigned char, 4>& right) {
  return
    std::abs(static_cast<int>(left[0]) - static_cast<int>(right[0])) +
    std::abs(static_cast<int>(left[1]) - static_cast<int>(right[1])) +
    std::abs(static_cast<int>(left[2]) - static_cast<int>(right[2])) +
    std::abs(static_cast<int>(left[3]) - static_cast<int>(right[3]));
}

bool image_similar_color(const std::array<unsigned char, 4>& left, const std::array<unsigned char, 4>& right) {
  return image_color_distance(left, right) <= 48;
}

bool image_different_color(const std::array<unsigned char, 4>& left, const std::array<unsigned char, 4>& right) {
  return image_color_distance(left, right) >= 96;
}

bool image_diagonal_corner_edge(
  const std::array<unsigned char, 4>& center,
  const std::array<unsigned char, 4>& adjacentA,
  const std::array<unsigned char, 4>& adjacentB,
  const std::array<unsigned char, 4>& oppositeA,
  const std::array<unsigned char, 4>& oppositeB
) {
  return
    image_similar_color(center, oppositeA) &&
    image_similar_color(center, oppositeB) &&
    image_similar_color(adjacentA, adjacentB) &&
    image_different_color(center, adjacentA);
}

std::array<unsigned char, 4> image_blend_edge_pixel(
  const std::array<unsigned char, 4>& center,
  const std::array<unsigned char, 4>& adjacentA,
  const std::array<unsigned char, 4>& adjacentB
) {
  int red = static_cast<int>(center[0]) * 6 + adjacentA[0] + adjacentB[0];
  int green = static_cast<int>(center[1]) * 6 + adjacentA[1] + adjacentB[1];
  int blue = static_cast<int>(center[2]) * 6 + adjacentA[2] + adjacentB[2];
  int alpha = static_cast<int>(center[3]) * 6 + adjacentA[3] + adjacentB[3];
  return {
    static_cast<unsigned char>(red / 8),
    static_cast<unsigned char>(green / 8),
    static_cast<unsigned char>(blue / 8),
    static_cast<unsigned char>(alpha / 8)
  };
}

std::array<unsigned char, 4> image_antialias_pixel(const image_ptr& source, int x, int y) {
  const auto center = image_read_pixel(source, x, y);
  if (x <= 0 || y <= 0 || x + 1 >= source->width || y + 1 >= source->height) {
    return center;
  }
  const auto north = image_read_pixel(source, x, y - 1);
  const auto south = image_read_pixel(source, x, y + 1);
  const auto west = image_read_pixel(source, x - 1, y);
  const auto east = image_read_pixel(source, x + 1, y);

  if (image_diagonal_corner_edge(center, north, east, south, west)) {
    return image_blend_edge_pixel(center, north, east);
  }
  if (image_diagonal_corner_edge(center, east, south, west, north)) {
    return image_blend_edge_pixel(center, east, south);
  }
  if (image_diagonal_corner_edge(center, south, west, north, east)) {
    return image_blend_edge_pixel(center, south, west);
  }
  if (image_diagonal_corner_edge(center, west, north, east, south)) {
    return image_blend_edge_pixel(center, west, north);
  }
  return center;
}

std::vector<unsigned char> image_alpha_channel(const image_ptr& source) {
  std::vector<unsigned char> alpha(static_cast<std::size_t>(source->width) * static_cast<std::size_t>(source->height));
  for (int row = 0; row < source->height; ++row) {
    for (int column = 0; column < source->width; ++column) {
      alpha[static_cast<std::size_t>(row) * static_cast<std::size_t>(source->width) + static_cast<std::size_t>(column)] =
        image_read_pixel(source, column, row)[3];
    }
  }
  return alpha;
}

std::vector<unsigned char> image_max_filter_horizontal(const std::vector<unsigned char>& source, int width, int height, int radius) {
  std::vector<unsigned char> output(source.size());
  for (int row = 0; row < height; ++row) {
    std::deque<int> window;
    int rightAdded = -1;
    for (int column = 0; column < width; ++column) {
      const auto rightLimit = (std::min)(width - 1, column + radius);
      while (rightAdded < rightLimit) {
        ++rightAdded;
        while (!window.empty() && source[static_cast<std::size_t>(row) * width + window.back()] <= source[static_cast<std::size_t>(row) * width + rightAdded]) {
          window.pop_back();
        }
        window.push_back(rightAdded);
      }
      const auto leftLimit = column - radius;
      while (!window.empty() && window.front() < leftLimit) {
        window.pop_front();
      }
      output[static_cast<std::size_t>(row) * width + column] = source[static_cast<std::size_t>(row) * width + window.front()];
    }
  }
  return output;
}

std::vector<unsigned char> image_max_filter_vertical(const std::vector<unsigned char>& source, int width, int height, int radius) {
  std::vector<unsigned char> output(source.size());
  for (int column = 0; column < width; ++column) {
    std::deque<int> window;
    int bottomAdded = -1;
    for (int row = 0; row < height; ++row) {
      const auto bottomLimit = (std::min)(height - 1, row + radius);
      while (bottomAdded < bottomLimit) {
        ++bottomAdded;
        while (!window.empty() && source[static_cast<std::size_t>(window.back()) * width + column] <= source[static_cast<std::size_t>(bottomAdded) * width + column]) {
          window.pop_back();
        }
        window.push_back(bottomAdded);
      }
      const auto topLimit = row - radius;
      while (!window.empty() && window.front() < topLimit) {
        window.pop_front();
      }
      output[static_cast<std::size_t>(row) * width + column] = source[static_cast<std::size_t>(window.front()) * width + column];
    }
  }
  return output;
}

std::vector<unsigned char> image_box_blur_horizontal(const std::vector<unsigned char>& source, int width, int height, int radius) {
  std::vector<unsigned char> output(source.size());
  for (int row = 0; row < height; ++row) {
    int sum = 0;
    for (int index = -radius; index <= radius; ++index) {
      const auto column = (std::min)((std::max)(index, 0), width - 1);
      sum += source[static_cast<std::size_t>(row) * width + column];
    }
    for (int column = 0; column < width; ++column) {
      output[static_cast<std::size_t>(row) * width + column] = static_cast<unsigned char>(sum / (radius * 2 + 1));
      const auto removeColumn = (std::min)((std::max)(column - radius, 0), width - 1);
      const auto addColumn = (std::min)((std::max)(column + radius + 1, 0), width - 1);
      sum -= source[static_cast<std::size_t>(row) * width + removeColumn];
      sum += source[static_cast<std::size_t>(row) * width + addColumn];
    }
  }
  return output;
}

std::vector<unsigned char> image_box_blur_vertical(const std::vector<unsigned char>& source, int width, int height, int radius) {
  std::vector<unsigned char> output(source.size());
  for (int column = 0; column < width; ++column) {
    int sum = 0;
    for (int index = -radius; index <= radius; ++index) {
      const auto row = (std::min)((std::max)(index, 0), height - 1);
      sum += source[static_cast<std::size_t>(row) * width + column];
    }
    for (int row = 0; row < height; ++row) {
      output[static_cast<std::size_t>(row) * width + column] = static_cast<unsigned char>(sum / (radius * 2 + 1));
      const auto removeRow = (std::min)((std::max)(row - radius, 0), height - 1);
      const auto addRow = (std::min)((std::max)(row + radius + 1, 0), height - 1);
      sum -= source[static_cast<std::size_t>(removeRow) * width + column];
      sum += source[static_cast<std::size_t>(addRow) * width + column];
    }
  }
  return output;
}

std::vector<unsigned char> image_spread_alpha(std::vector<unsigned char> alpha, int width, int height, int radius) {
  if (radius <= 0) {
    return alpha;
  }
  return image_max_filter_vertical(image_max_filter_horizontal(alpha, width, height, radius), width, height, radius);
}

std::vector<unsigned char> image_blur_alpha(std::vector<unsigned char> alpha, int width, int height, int radius) {
  if (radius <= 0) {
    return alpha;
  }
  for (int pass = 0; pass < 3; ++pass) {
    alpha = image_box_blur_vertical(image_box_blur_horizontal(alpha, width, height, radius), width, height, radius);
  }
  return alpha;
}

value image_antialias(const value& input, const value& levelValue) {
  const auto target = require_image_value(input);
  const auto level = require_image_span(levelValue, "Jayess image antialias level must be a non-negative integer");
  if (level <= 1) {
    return input;
  }
  for (int pass = 1; pass < level; ++pass) {
    auto source = image_allocate(target->width, target->height);
    source->pixels = target->pixels;
    for (int row = 0; row < target->height; ++row) {
      for (int column = 0; column < target->width; ++column) {
        image_write_pixel(target, column, row, image_antialias_pixel(source, column, row));
      }
    }
  }
  return input;
}

value image_shadow_mask(const value& input, const value& blurRadiusValue, const value& spreadRadiusValue, const value& colorValue) {
  const auto source = require_image_value(input);
  const auto blurRadius = require_image_span(blurRadiusValue, "Jayess image shadow blur radius must be a non-negative integer");
  const auto spreadRadius = require_image_span(spreadRadiusValue, "Jayess image shadow spread radius must be a non-negative integer");
  const auto color = require_image_color(colorValue);
  auto alpha = image_alpha_channel(source);
  alpha = image_spread_alpha(std::move(alpha), source->width, source->height, spreadRadius);
  alpha = image_blur_alpha(std::move(alpha), source->width, source->height, blurRadius);

  auto output = image_allocate(source->width, source->height);
  for (int row = 0; row < source->height; ++row) {
    for (int column = 0; column < source->width; ++column) {
      const auto alphaIndex = static_cast<std::size_t>(row) * static_cast<std::size_t>(source->width) + static_cast<std::size_t>(column);
      const auto shadowAlpha = static_cast<unsigned char>((static_cast<int>(alpha[alphaIndex]) * static_cast<int>(color[3])) / 255);
      image_write_pixel(output, column, row, {color[0], color[1], color[2], shadowAlpha});
    }
  }
  return output;
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
      image_write_pixel_alpha(target, static_cast<int>(targetX), static_cast<int>(targetY), sourceColor);
    }
  }
  return targetValue;
}

value image_transparent_blit_clipped(const value& targetValue, const value& sourceValue, const value& xValue, const value& yValue, const value& clipXValue, const value& clipYValue, const value& clipWidthValue, const value& clipHeightValue) {
  const auto target = require_image_value(targetValue);
  const auto source = require_image_value(sourceValue);
  const auto x = require_image_offset(xValue, "Jayess image transparentBlitClipped x must be an integer within supported range");
  const auto y = require_image_offset(yValue, "Jayess image transparentBlitClipped y must be an integer within supported range");
  const auto clipX = require_image_offset(clipXValue, "Jayess image transparentBlitClipped clip x must be an integer within supported range");
  const auto clipY = require_image_offset(clipYValue, "Jayess image transparentBlitClipped clip y must be an integer within supported range");
  const auto clipWidth = require_image_span(clipWidthValue, "Jayess image transparentBlitClipped clip width must be a non-negative integer");
  const auto clipHeight = require_image_span(clipHeightValue, "Jayess image transparentBlitClipped clip height must be a non-negative integer");

  const auto targetLeft = (std::max<long long>)(x, clipX);
  const auto targetTop = (std::max<long long>)(y, clipY);
  const auto targetRight = (std::min<long long>)((std::min<long long>)(static_cast<long long>(x) + source->width, static_cast<long long>(clipX) + clipWidth), target->width);
  const auto targetBottom = (std::min<long long>)((std::min<long long>)(static_cast<long long>(y) + source->height, static_cast<long long>(clipY) + clipHeight), target->height);
  const auto clippedLeft = (std::max<long long>)(targetLeft, 0);
  const auto clippedTop = (std::max<long long>)(targetTop, 0);
  if (targetRight <= clippedLeft || targetBottom <= clippedTop) {
    return targetValue;
  }

  const auto sourceStartX = clippedLeft - static_cast<long long>(x);
  const auto sourceStartY = clippedTop - static_cast<long long>(y);
  const auto spanWidth = targetRight - clippedLeft;
  const auto spanHeight = targetBottom - clippedTop;
  for (long long row = 0; row < spanHeight; ++row) {
    const auto sourceY = static_cast<int>(sourceStartY + row);
    const auto targetY = static_cast<int>(clippedTop + row);
    for (long long column = 0; column < spanWidth; ++column) {
      const auto sourceX = static_cast<int>(sourceStartX + column);
      const auto targetX = static_cast<int>(clippedLeft + column);
      image_write_pixel_alpha(target, targetX, targetY, image_read_pixel(source, sourceX, sourceY));
    }
  }
  return targetValue;
}`;
}

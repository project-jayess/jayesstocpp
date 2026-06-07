#pragma once

#include <filesystem>
#include <fstream>
#include <stdexcept>
#include <string>
#include <vector>

#include "runtime/jayess_runtime.hpp"

inline void jayessWriteFontFixture(const std::filesystem::path& path, const std::vector<unsigned char>& bytes) {
  std::filesystem::create_directories(path.parent_path());
  std::ofstream stream(path, std::ios::binary);
  if (!stream) {
    throw std::runtime_error("Unable to write font fixture");
  }
  stream.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
}

inline std::vector<unsigned char> jayessSfntHeader() {
  return {0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
}

inline std::vector<unsigned char> jayessWoffHeader() {
  return {
    'w', 'O', 'F', 'F',
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x2c,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
}

inline std::vector<unsigned char> jayessWoff2Header() {
  return {
    'w', 'O', 'F', '2',
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x30,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
}

inline jayess::value createVectorFontFixtures(const std::vector<jayess::value>& jayessArgs) {
  auto directoryValue = jayess::argument_at(jayessArgs, 0);
  if (!std::holds_alternative<std::string>(directoryValue)) {
    throw std::runtime_error("Font fixture directory must be a string");
  }
  const auto directory = std::filesystem::path(std::get<std::string>(directoryValue));
  jayessWriteFontFixture(directory / "probe.ttf", jayessSfntHeader());
  jayessWriteFontFixture(directory / "probe.otf", jayessSfntHeader());
  jayessWriteFontFixture(directory / "probe.woff", jayessWoffHeader());
  jayessWriteFontFixture(directory / "probe.woff2", jayessWoff2Header());
  return {};
}

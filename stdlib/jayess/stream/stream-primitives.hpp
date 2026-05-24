#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline std::string jayessStreamString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline int jayessStreamInteger(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }

  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || numeric < 0.0 || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline jayess::value jayessStreamOpenRead(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_open_read_async(
    jayessStreamString(jayess::argument_at(jayessArgs, 0), "Jayess stream openRead expects a string path")
  );
}

inline jayess::value jayessStreamOpenWrite(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_open_write_async(
    jayessStreamString(jayess::argument_at(jayessArgs, 0), "Jayess stream openWrite expects a string path")
  );
}

inline jayess::value jayessStreamOpenReadSync(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_open_read(
    jayessStreamString(jayess::argument_at(jayessArgs, 0), "Jayess stream openReadSync expects a string path")
  );
}

inline jayess::value jayessStreamOpenWriteSync(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_open_write(
    jayessStreamString(jayess::argument_at(jayessArgs, 0), "Jayess stream openWriteSync expects a string path")
  );
}

inline jayess::value jayessStreamReadChunk(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_read_chunk_async(
    jayess::argument_at(jayessArgs, 0),
    jayessStreamInteger(jayess::argument_at(jayessArgs, 1), "Jayess stream readChunk expects a non-negative integer size")
  );
}

inline jayess::value jayessStreamWriteChunk(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_write_chunk_async(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1)
  );
}

inline jayess::value jayessStreamClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::stream_close_async(jayess::argument_at(jayessArgs, 0));
}

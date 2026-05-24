#pragma once

#include <cmath>

#include "runtime/jayess_runtime.hpp"

inline std::string jayessNetString(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

inline int jayessNetInteger(const jayess::value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto numeric = std::get<double>(input);
  if (!std::isfinite(numeric) || std::floor(numeric) != numeric) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(numeric);
}

inline jayess::value jayessNetConnect(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_connect_async(
    jayessNetString(jayess::argument_at(jayessArgs, 0), "Jayess net connect expects a string host"),
    jayessNetInteger(jayess::argument_at(jayessArgs, 1), "Jayess net connect expects an integer port"),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessNetListen(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_listen(
    jayessNetString(jayess::argument_at(jayessArgs, 0), "Jayess net listen expects a string host"),
    jayessNetInteger(jayess::argument_at(jayessArgs, 1), "Jayess net listen expects an integer port"),
    jayess::argument_at(jayessArgs, 2),
    jayess::argument_at(jayessArgs, 3)
  );
}

inline jayess::value jayessNetRead(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_read_async(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessNetWrite(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_write_async(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessNetLocalAddress(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_local_address(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessNetLocalPort(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_local_port(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessNetRemoteAddress(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_remote_address(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessNetRemotePort(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_remote_port(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessNetClose(const std::vector<jayess::value>& jayessArgs) {
  return jayess::net_close(jayess::argument_at(jayessArgs, 0));
}

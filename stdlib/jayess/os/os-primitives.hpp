#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessOsPlatform(const std::vector<jayess::value>&) {
  return jayess::os_platform();
}

inline jayess::value jayessOsArch(const std::vector<jayess::value>&) {
  return jayess::os_arch();
}

inline jayess::value jayessOsHomeDir(const std::vector<jayess::value>&) {
  return jayess::os_home_directory();
}

inline jayess::value jayessOsTmpDir(const std::vector<jayess::value>&) {
  return jayess::os_temporary_directory();
}

inline jayess::value jayessOsHostname(const std::vector<jayess::value>&) {
  return jayess::os_hostname();
}

inline jayess::value jayessOsNewline(const std::vector<jayess::value>&) {
  return jayess::os_newline();
}

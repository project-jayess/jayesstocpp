#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessArchiveCreateTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_create_tar(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArchiveExtractTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_extract_tar(jayess::argument_at(jayessArgs, 0));
}

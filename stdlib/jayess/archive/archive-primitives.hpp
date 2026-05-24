#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessArchiveCreateTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_create_tar(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArchiveExtractTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_extract_tar(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArchiveWriteTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_write_tar(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArchiveWriteTarSync(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_write_tar_sync(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessArchiveReadTar(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_read_tar(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessArchiveReadTarSync(const std::vector<jayess::value>& jayessArgs) {
  return jayess::archive_read_tar_sync(jayess::argument_at(jayessArgs, 0));
}

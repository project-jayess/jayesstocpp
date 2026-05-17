#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessDateNow(const std::vector<jayess::value>&) {
  return jayess::make_date_now();
}

inline jayess::value jayessDateFromUnixMillis(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::make_date_from_unix_millis(std::get<double>(value));
}

inline jayess::value jayessDateToUnixMillis(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_to_unix_millis(date);
}

inline jayess::value jayessIsDateValue(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_date_value(value));
}

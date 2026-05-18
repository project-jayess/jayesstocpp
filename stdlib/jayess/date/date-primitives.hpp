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

inline jayess::value jayessDateToIsoString(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_to_iso_string(date);
}

inline jayess::value jayessDateGetUtcYear(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_year(date);
}

inline jayess::value jayessDateGetUtcMonth(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_month(date);
}

inline jayess::value jayessDateGetUtcDay(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_day(date);
}

inline jayess::value jayessDateGetUtcHour(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_hour(date);
}

inline jayess::value jayessDateGetUtcMinute(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_minute(date);
}

inline jayess::value jayessDateGetUtcSecond(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_second(date);
}

inline jayess::value jayessDateGetUtcMillisecond(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  return jayess::date_get_utc_millisecond(date);
}

inline jayess::value jayessDateAddMillis(const std::vector<jayess::value>& jayessArgs) {
  const auto date = jayess::argument_at(jayessArgs, 0);
  const auto amount = jayess::argument_at(jayessArgs, 1);
  return jayess::date_add_millis(date, std::get<double>(amount));
}

inline jayess::value jayessDateDiffMillis(const std::vector<jayess::value>& jayessArgs) {
  const auto left = jayess::argument_at(jayessArgs, 0);
  const auto right = jayess::argument_at(jayessArgs, 1);
  return jayess::date_diff_millis(left, right);
}

inline jayess::value jayessDateParseIso(const std::vector<jayess::value>& jayessArgs) {
  const auto text = jayess::argument_at(jayessArgs, 0);
  return jayess::date_parse_iso_text(std::get<std::string>(text));
}

inline jayess::value jayessIsDateValue(const std::vector<jayess::value>& jayessArgs) {
  const auto value = jayess::argument_at(jayessArgs, 0);
  return jayess::value(jayess::is_date_value(value));
}

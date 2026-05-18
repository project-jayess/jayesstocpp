export function getDateRuntimeHeaderFragment() {
  return `value make_date_now();
value make_date_from_unix_millis(double millis);
bool is_date_value(const value& input);
value date_to_unix_millis(const value& input);
value date_to_iso_string(const value& input);
value date_get_utc_year(const value& input);
value date_get_utc_month(const value& input);
value date_get_utc_day(const value& input);
value date_get_utc_hour(const value& input);
value date_get_utc_minute(const value& input);
value date_get_utc_second(const value& input);
value date_get_utc_millisecond(const value& input);
value date_add_millis(const value& input, double amount);
value date_diff_millis(const value& left, const value& right);
value date_parse_iso_text(const std::string& text);`;
}

export function getDateRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessDateTagKey = "__jayess_date_tag";
constexpr const char* kJayessDateMillisKey = "__jayess_date_millis";

object_ptr require_date_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected Jayess date value");
  }

  const auto& object = std::get<object_ptr>(input);
  const auto tag = object->private_fields.find(kJayessDateTagKey);
  if (tag == object->private_fields.end() || !std::holds_alternative<bool>(tag->second) || !std::get<bool>(tag->second)) {
    throw std::runtime_error("Expected Jayess date value");
  }

  return object;
}

long long require_date_millis(const value& input) {
  return static_cast<long long>(std::get<double>(date_to_unix_millis(input)));
}

std::tm utc_tm_from_unix_millis(long long millis) {
  auto wholeSeconds = millis / 1000;
  auto millisecondRemainder = millis % 1000;
  if (millisecondRemainder < 0) {
    millisecondRemainder += 1000;
    wholeSeconds -= 1;
  }

  const auto seconds = static_cast<std::time_t>(wholeSeconds);
  std::tm utcTm{};
#if defined(_WIN32)
  gmtime_s(&utcTm, &seconds);
#else
  gmtime_r(&seconds, &utcTm);
#endif
  return utcTm;
}

int utc_millisecond_component(long long millis) {
  auto millisecondRemainder = static_cast<int>(millis % 1000);
  if (millisecondRemainder < 0) {
    millisecondRemainder += 1000;
  }
  return millisecondRemainder;
}

long long days_from_civil(int year, unsigned month, unsigned day) {
  year -= month <= 2;
  const int era = (year >= 0 ? year : year - 399) / 400;
  const unsigned yearOfEra = static_cast<unsigned>(year - era * 400);
  const unsigned shiftedMonth = month > 2
    ? month - 3
    : month + 9;
  const unsigned dayOfYear = (153 * shiftedMonth + 2) / 5 + day - 1;
  const unsigned dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear;
  return static_cast<long long>(era) * 146097 + static_cast<long long>(dayOfEra) - 719468;
}

int parse_iso_digits(const std::string& text, std::size_t start, std::size_t length) {
  int value = 0;
  for (std::size_t offset = 0; offset < length; offset += 1) {
    const auto current = text[start + offset];
    if (!std::isdigit(static_cast<unsigned char>(current))) {
      throw std::runtime_error("Invalid Jayess ISO date text");
    }
    value = (value * 10) + (current - '0');
  }
  return value;
}
} // namespace

value make_date_now() {
  const auto now = std::chrono::system_clock::now();
  const auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
  return make_date_from_unix_millis(static_cast<double>(millis));
}

value make_date_from_unix_millis(double millis) {
  auto object = std::make_shared<object_value>();
  object->private_fields.insert_or_assign(kJayessDateTagKey, true);
  object->private_fields.insert_or_assign(kJayessDateMillisKey, millis);
  return object;
}

bool is_date_value(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    return false;
  }

  const auto& object = std::get<object_ptr>(input);
  const auto iterator = object->private_fields.find(kJayessDateTagKey);
  return iterator != object->private_fields.end()
    && std::holds_alternative<bool>(iterator->second)
    && std::get<bool>(iterator->second);
}

value date_to_unix_millis(const value& input) {
  const auto& object = require_date_object(input);
  const auto iterator = object->private_fields.find(kJayessDateMillisKey);
  if (iterator == object->private_fields.end() || !std::holds_alternative<double>(iterator->second)) {
    throw std::runtime_error("Jayess date is missing timestamp storage");
  }

  return iterator->second;
}

value date_to_iso_string(const value& input) {
  const auto millis = require_date_millis(input);
  const auto utcTm = utc_tm_from_unix_millis(millis);

  std::ostringstream stream;
  stream << std::put_time(&utcTm, "%Y-%m-%dT%H:%M:%S");
  stream << "." << std::setw(3) << std::setfill('0') << utc_millisecond_component(millis) << "Z";
  return stream.str();
}

value date_get_utc_year(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_year + 1900);
}

value date_get_utc_month(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_mon + 1);
}

value date_get_utc_day(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_mday);
}

value date_get_utc_hour(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_hour);
}

value date_get_utc_minute(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_min);
}

value date_get_utc_second(const value& input) {
  return static_cast<double>(utc_tm_from_unix_millis(require_date_millis(input)).tm_sec);
}

value date_get_utc_millisecond(const value& input) {
  return static_cast<double>(utc_millisecond_component(require_date_millis(input)));
}

value date_add_millis(const value& input, double amount) {
  return make_date_from_unix_millis(std::get<double>(date_to_unix_millis(input)) + amount);
}

value date_diff_millis(const value& left, const value& right) {
  return std::get<double>(date_to_unix_millis(left)) - std::get<double>(date_to_unix_millis(right));
}

value date_parse_iso_text(const std::string& text) {
  if (text.size() != 24
    || text[4] != '-'
    || text[7] != '-'
    || text[10] != 'T'
    || text[13] != ':'
    || text[16] != ':'
    || text[19] != '.'
    || text[23] != 'Z') {
    return value(std::monostate{});
  }

  try {
    const auto year = parse_iso_digits(text, 0, 4);
    const auto month = parse_iso_digits(text, 5, 2);
    const auto day = parse_iso_digits(text, 8, 2);
    const auto hour = parse_iso_digits(text, 11, 2);
    const auto minute = parse_iso_digits(text, 14, 2);
    const auto second = parse_iso_digits(text, 17, 2);
    const auto millisecond = parse_iso_digits(text, 20, 3);

    if (month < 1 || month > 12
      || day < 1 || day > 31
      || hour < 0 || hour > 23
      || minute < 0 || minute > 59
      || second < 0 || second > 59) {
      return value(std::monostate{});
    }

    const auto epochDays = days_from_civil(year, static_cast<unsigned>(month), static_cast<unsigned>(day));
    const auto totalSeconds = (epochDays * 86400LL)
      + (static_cast<long long>(hour) * 3600LL)
      + (static_cast<long long>(minute) * 60LL)
      + static_cast<long long>(second);
    const auto totalMillis = (totalSeconds * 1000LL) + static_cast<long long>(millisecond);
    return make_date_from_unix_millis(static_cast<double>(totalMillis));
  } catch (...) {
    return value(std::monostate{});
  }
}`;
}

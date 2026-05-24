export function getTimeRuntimeHeaderFragment() {
  return `value time_millis();
value time_seconds(const value& input);
value time_minutes(const value& input);
value time_elapsed(const value& start);
value time_format_duration(const value& milliseconds);`;
}

export function getTimeRuntimeCppFragment() {
  return `namespace {
double time_require_milliseconds(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }
  const auto amount = std::get<double>(input);
  if (!std::isfinite(amount)) {
    throw std::runtime_error(message);
  }
  return amount;
}

long long time_millis_now() {
  const auto now = std::chrono::steady_clock::now().time_since_epoch();
  return std::chrono::duration_cast<std::chrono::milliseconds>(now).count();
}
} // namespace

value time_millis() {
  return static_cast<double>(time_millis_now());
}

value time_seconds(const value& input) {
  return time_require_milliseconds(input, "Jayess time seconds expects a finite number") * 1000.0;
}

value time_minutes(const value& input) {
  return time_require_milliseconds(input, "Jayess time minutes expects a finite number") * 60000.0;
}

value time_elapsed(const value& start) {
  return static_cast<double>(time_millis_now()) - time_require_milliseconds(start, "Jayess time elapsed expects a finite start value");
}

value time_format_duration(const value& milliseconds) {
  auto remaining = static_cast<long long>(std::llround(time_require_milliseconds(milliseconds, "Jayess time formatDuration expects finite milliseconds")));
  const bool negative = remaining < 0;
  if (negative) {
    remaining = -remaining;
  }

  const auto minutes = remaining / 60000;
  remaining %= 60000;
  const auto seconds = remaining / 1000;
  const auto millis = remaining % 1000;

  std::ostringstream output;
  if (negative) {
    output << "-";
  }
  if (minutes > 0) {
    output << minutes << "m ";
  }
  if (seconds > 0 || minutes > 0) {
    output << seconds << "s ";
  }
  output << millis << "ms";
  return output.str();
}`;
}

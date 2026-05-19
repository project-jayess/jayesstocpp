export function getMathRuntimeHeaderFragment() {
  return `value math_abs(const value& input);
value math_floor(const value& input);
value math_ceil(const value& input);
value math_round(const value& input);
value math_min(const std::vector<value>& inputs);
value math_max(const std::vector<value>& inputs);
value math_sqrt(const value& input);
value math_pow(const value& base, const value& exponent);`;
}

export function getMathRuntimeCppFragment() {
  return `namespace {
double require_math_number(const value& input, const std::string& helperName) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error("Jayess math helper '" + helperName + "' expects numeric arguments");
  }
  return std::get<double>(input);
}

void require_math_values(const std::vector<value>& inputs, const std::string& helperName) {
  if (inputs.empty()) {
    throw std::runtime_error("Jayess math helper '" + helperName + "' expects at least one numeric argument");
  }
  for (const auto& input : inputs) {
    require_math_number(input, helperName);
  }
}
} // namespace

value math_abs(const value& input) {
  return std::fabs(require_math_number(input, "abs"));
}

value math_floor(const value& input) {
  return std::floor(require_math_number(input, "floor"));
}

value math_ceil(const value& input) {
  return std::ceil(require_math_number(input, "ceil"));
}

value math_round(const value& input) {
  return std::round(require_math_number(input, "round"));
}

value math_min(const std::vector<value>& inputs) {
  require_math_values(inputs, "min");
  double result = std::get<double>(inputs[0]);
  for (std::size_t index = 1; index < inputs.size(); index += 1) {
    result = std::min(result, std::get<double>(inputs[index]));
  }
  return result;
}

value math_max(const std::vector<value>& inputs) {
  require_math_values(inputs, "max");
  double result = std::get<double>(inputs[0]);
  for (std::size_t index = 1; index < inputs.size(); index += 1) {
    result = std::max(result, std::get<double>(inputs[index]));
  }
  return result;
}

value math_sqrt(const value& input) {
  const double number = require_math_number(input, "sqrt");
  if (number < 0.0) {
    return value(std::monostate{});
  }
  return std::sqrt(number);
}

value math_pow(const value& base, const value& exponent) {
  return std::pow(require_math_number(base, "pow"), require_math_number(exponent, "pow"));
}`;
}

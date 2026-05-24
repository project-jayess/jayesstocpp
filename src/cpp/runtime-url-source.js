export function getUrlRuntimeHeaderFragment() {
  return `value url_parse_text(const value& text);
value url_format_parts(const value& parts);
value url_join_path(const value& base, const value& path);
value url_get_query(const value& input, const value& key);
value url_set_query(const value& input, const value& key, const value& assigned);`;
}

export function getUrlRuntimeCppFragment() {
  return `namespace {
struct parsed_url_parts {
  std::string scheme;
  std::string host;
  std::string path;
  std::string query;
  std::string fragment;
};

std::string require_url_text(const value& input, const std::string& message) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<std::string>(input);
}

const std::unordered_map<std::string, value>& require_url_object_fields(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Jayess url format expects an object input");
  }
  return std::get<object_ptr>(input)->fields;
}

std::string optional_url_string_field(const std::unordered_map<std::string, value>& fields, const std::string& key) {
  const auto iterator = fields.find(key);
  if (iterator == fields.end() || std::holds_alternative<std::monostate>(iterator->second)) {
    return "";
  }
  if (!std::holds_alternative<std::string>(iterator->second)) {
    throw std::runtime_error("Jayess url format expects string fields");
  }
  return std::get<std::string>(iterator->second);
}

parsed_url_parts parse_url_parts(const std::string& input) {
  parsed_url_parts parts;
  auto restStart = static_cast<std::size_t>(0);
  const auto schemeEnd = input.find("://");
  if (schemeEnd != std::string::npos) {
    parts.scheme = input.substr(0, schemeEnd);
    restStart = schemeEnd + 3;
    const auto hostEnd = input.find_first_of("/?#", restStart);
    parts.host = input.substr(restStart, hostEnd == std::string::npos ? std::string::npos : hostEnd - restStart);
    restStart = hostEnd == std::string::npos ? input.size() : hostEnd;
  }

  const auto fragmentStart = input.find('#', restStart);
  const auto queryStart = input.find('?', restStart);
  const auto pathEnd = (std::min)(
    queryStart == std::string::npos ? input.size() : queryStart,
    fragmentStart == std::string::npos ? input.size() : fragmentStart
  );

  parts.path = input.substr(restStart, pathEnd - restStart);
  if (queryStart != std::string::npos && (fragmentStart == std::string::npos || queryStart < fragmentStart)) {
    parts.query = input.substr(queryStart + 1, (fragmentStart == std::string::npos ? input.size() : fragmentStart) - queryStart - 1);
  }
  if (fragmentStart != std::string::npos) {
    parts.fragment = input.substr(fragmentStart + 1);
  }
  return parts;
}

std::string format_url_parts(const parsed_url_parts& parts) {
  std::string output;
  if (!parts.scheme.empty()) {
    output += parts.scheme;
    output += "://";
  }
  output += parts.host;
  output += parts.path.empty() && !parts.host.empty() ? "/" : parts.path;
  if (!parts.query.empty()) {
    output += "?";
    output += parts.query;
  }
  if (!parts.fragment.empty()) {
    output += "#";
    output += parts.fragment;
  }
  return output;
}

std::vector<std::pair<std::string, std::string>> parse_url_query_pairs(const std::string& query) {
  std::vector<std::pair<std::string, std::string>> pairs;
  std::size_t start = 0;
  while (start <= query.size()) {
    const auto end = query.find('&', start);
    const auto entry = query.substr(start, end == std::string::npos ? std::string::npos : end - start);
    if (!entry.empty()) {
      const auto equals = entry.find('=');
      pairs.push_back({
        entry.substr(0, equals),
        equals == std::string::npos ? std::string("") : entry.substr(equals + 1)
      });
    }
    if (end == std::string::npos) {
      break;
    }
    start = end + 1;
  }
  return pairs;
}

std::string format_url_query_pairs(const std::vector<std::pair<std::string, std::string>>& pairs) {
  std::string output;
  for (std::size_t index = 0; index < pairs.size(); index += 1) {
    if (index > 0) {
      output += "&";
    }
    output += pairs[index].first;
    output += "=";
    output += pairs[index].second;
  }
  return output;
}
} // namespace

value url_parse_text(const value& text) {
  const auto parts = parse_url_parts(require_url_text(text, "Jayess url parse expects a string input"));
  return make_object({
    {"scheme", parts.scheme},
    {"host", parts.host},
    {"path", parts.path},
    {"query", parts.query},
    {"fragment", parts.fragment}
  });
}

value url_format_parts(const value& partsValue) {
  const auto& fields = require_url_object_fields(partsValue);
  return format_url_parts({
    optional_url_string_field(fields, "scheme"),
    optional_url_string_field(fields, "host"),
    optional_url_string_field(fields, "path"),
    optional_url_string_field(fields, "query"),
    optional_url_string_field(fields, "fragment")
  });
}

value url_join_path(const value& base, const value& path) {
  auto parts = parse_url_parts(require_url_text(base, "Jayess url joinPath expects a string base"));
  const auto pathText = require_url_text(path, "Jayess url joinPath expects a string path");
  if (!pathText.empty() && pathText.front() == '/') {
    parts.path = pathText;
  } else {
    auto basePath = parts.path.empty() ? std::string("/") : parts.path;
    const auto slash = basePath.find_last_of('/');
    parts.path = (slash == std::string::npos ? std::string("/") : basePath.substr(0, slash + 1)) + pathText;
  }
  return format_url_parts(parts);
}

value url_get_query(const value& input, const value& key) {
  const auto parts = parse_url_parts(require_url_text(input, "Jayess url getQuery expects a string url"));
  const auto keyText = require_url_text(key, "Jayess url getQuery expects a string key");
  for (const auto& pair : parse_url_query_pairs(parts.query)) {
    if (pair.first == keyText) {
      return pair.second;
    }
  }
  return value(std::monostate{});
}

value url_set_query(const value& input, const value& key, const value& assigned) {
  auto parts = parse_url_parts(require_url_text(input, "Jayess url setQuery expects a string url"));
  const auto keyText = require_url_text(key, "Jayess url setQuery expects a string key");
  const auto assignedText = require_url_text(assigned, "Jayess url setQuery expects a string value");
  auto pairs = parse_url_query_pairs(parts.query);
  bool updated = false;
  for (auto& pair : pairs) {
    if (pair.first == keyText) {
      pair.second = assignedText;
      updated = true;
      break;
    }
  }
  if (!updated) {
    pairs.push_back({keyText, assignedText});
  }
  parts.query = format_url_query_pairs(pairs);
  return format_url_parts(parts);
}`;
}

export function getRegexRuntimeHeaderFragment() {
  return `value regex_create(const value& pattern);
value regex_create(const value& pattern, const value& flags);
bool is_regex_value(const value& input);
value regex_test(const value& regexValue, const value& text);
value regex_exec(const value& regexValue, const value& text);
value regex_split(const value& regexValue, const value& text);
value regex_match_all(const value& regexValue, const value& text);
value regex_replace_first(const value& regexValue, const value& text, const value& replacement);
value regex_replace_all(const value& regexValue, const value& text, const value& replacement);`;
}

export function getRegexRuntimeCppFragment() {
  return `namespace {
constexpr const char* kJayessRegexTagKey = "__jayess_regex_tag";
constexpr const char* kJayessRegexPatternKey = "__jayess_regex_pattern";
constexpr const char* kJayessRegexFlagsKey = "__jayess_regex_flags";

struct regex_flags {
  std::string text;
  std::regex_constants::syntax_option_type options = std::regex_constants::ECMAScript;
  bool multiline = false;
  bool dotAll = false;
};

object_ptr require_regex_object(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    throw std::runtime_error("Expected Jayess regex value");
  }

  const auto& object = std::get<object_ptr>(input);
  const auto tag = object->private_fields.find(kJayessRegexTagKey);
  if (tag == object->private_fields.end() || !std::holds_alternative<bool>(tag->second) || !std::get<bool>(tag->second)) {
    throw std::runtime_error("Expected Jayess regex value");
  }

  return object;
}

std::string require_regex_pattern_text(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex creation expects a string pattern");
  }
  return std::get<std::string>(input);
}

regex_flags parse_regex_flags(const value& input) {
  regex_flags flags;
  if (std::holds_alternative<std::monostate>(input)) {
    return flags;
  }

  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex flags expect a string input");
  }

  flags.text = std::get<std::string>(input);
  bool sawIgnoreCase = false;
  bool sawMultiline = false;
  bool sawDotAll = false;

  for (const char flag : flags.text) {
    switch (flag) {
      case 'i':
        if (sawIgnoreCase) {
          throw std::runtime_error("Duplicate Jayess regex flag: i");
        }
        sawIgnoreCase = true;
        flags.options |= std::regex_constants::icase;
        break;
      case 'm':
        if (sawMultiline) {
          throw std::runtime_error("Duplicate Jayess regex flag: m");
        }
        sawMultiline = true;
        flags.multiline = true;
        break;
      case 's':
        if (sawDotAll) {
          throw std::runtime_error("Duplicate Jayess regex flag: s");
        }
        sawDotAll = true;
        flags.dotAll = true;
        break;
      default:
        throw std::runtime_error(std::string("Unknown Jayess regex flag: ") + flag);
    }
  }

  return flags;
}

std::string apply_dot_all_pattern_transform(const std::string& pattern) {
  std::string transformed;
  transformed.reserve(pattern.size());
  bool escaped = false;
  bool inCharacterClass = false;

  for (const char character : pattern) {
    if (escaped) {
      transformed.push_back(character);
      escaped = false;
      continue;
    }

    if (character == '\\\\') {
      transformed.push_back(character);
      escaped = true;
      continue;
    }

    if (character == '[') {
      inCharacterClass = true;
      transformed.push_back(character);
      continue;
    }

    if (character == ']' && inCharacterClass) {
      inCharacterClass = false;
      transformed.push_back(character);
      continue;
    }

    if (character == '.' && !inCharacterClass) {
      transformed += "[\\\\s\\\\S]";
      continue;
    }

    transformed.push_back(character);
  }

  return transformed;
}

std::string apply_multiline_pattern_transform(const std::string& pattern) {
  std::string transformed;
  transformed.reserve(pattern.size() * 2);
  bool escaped = false;
  bool inCharacterClass = false;

  for (const char character : pattern) {
    if (escaped) {
      transformed.push_back(character);
      escaped = false;
      continue;
    }

    if (character == '\\\\') {
      transformed.push_back(character);
      escaped = true;
      continue;
    }

    if (character == '[') {
      inCharacterClass = true;
      transformed.push_back(character);
      continue;
    }

    if (character == ']' && inCharacterClass) {
      inCharacterClass = false;
      transformed.push_back(character);
      continue;
    }

    if (!inCharacterClass && character == '^') {
      transformed += "(?:^|(?<=\\\\n))";
      continue;
    }

    if (!inCharacterClass && character == '$') {
      transformed += "(?:$|(?=\\\\n))";
      continue;
    }

    transformed.push_back(character);
  }

  return transformed;
}

std::string require_regex_text_argument(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex operations expect a string text input");
  }
  return std::get<std::string>(input);
}

std::string require_regex_replacement_text(const value& input) {
  if (!std::holds_alternative<std::string>(input)) {
    throw std::runtime_error("Jayess regex replacement expects a string replacement input");
  }
  return std::get<std::string>(input);
}

std::regex require_compiled_regex(const value& input) {
  const auto& object = require_regex_object(input);
  const auto pattern = object->private_fields.find(kJayessRegexPatternKey);
  if (pattern == object->private_fields.end() || !std::holds_alternative<std::string>(pattern->second)) {
    throw std::runtime_error("Jayess regex is missing pattern storage");
  }

  try {
    auto flags = parse_regex_flags(value(std::monostate{}));
    const auto storedFlags = object->private_fields.find(kJayessRegexFlagsKey);
    if (storedFlags != object->private_fields.end()) {
      flags = parse_regex_flags(storedFlags->second);
    }

    auto patternText = std::get<std::string>(pattern->second);
    if (flags.multiline) {
      patternText = apply_multiline_pattern_transform(patternText);
    }
    if (flags.dotAll) {
      patternText = apply_dot_all_pattern_transform(patternText);
    }
    return std::regex(patternText, flags.options);
  } catch (const std::regex_error&) {
    throw std::runtime_error("Invalid Jayess regex pattern");
  }
}
} // namespace

value regex_create(const value& pattern) {
  return regex_create(pattern, value(std::monostate{}));
}

value regex_create(const value& pattern, const value& flagsInput) {
  const auto flags = parse_regex_flags(flagsInput);
  auto object = std::make_shared<object_value>();
  object->private_fields.insert_or_assign(kJayessRegexTagKey, true);
  object->private_fields.insert_or_assign(kJayessRegexPatternKey, require_regex_pattern_text(pattern));
  object->private_fields.insert_or_assign(kJayessRegexFlagsKey, flags.text);
  return object;
}

bool is_regex_value(const value& input) {
  if (!std::holds_alternative<object_ptr>(input)) {
    return false;
  }

  const auto& object = std::get<object_ptr>(input);
  const auto iterator = object->private_fields.find(kJayessRegexTagKey);
  return iterator != object->private_fields.end()
    && std::holds_alternative<bool>(iterator->second)
    && std::get<bool>(iterator->second);
}

value regex_test(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  return std::regex_search(input, compiled);
}

value regex_exec(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  std::smatch match;
  if (!std::regex_search(input, match, compiled)) {
    return value(std::monostate{});
  }

  std::vector<value> items;
  items.reserve(match.size());
  for (const auto& entry : match) {
    items.push_back(entry.str());
  }
  return make_array(std::move(items));
}

value regex_split(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  std::vector<value> items;
  std::sregex_token_iterator current(input.begin(), input.end(), compiled, -1);
  std::sregex_token_iterator end;
  for (; current != end; ++current) {
    items.push_back(current->str());
  }
  return make_array(std::move(items));
}

value regex_match_all(const value& regexValue, const value& text) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  std::vector<value> matches;
  for (std::sregex_iterator current(input.begin(), input.end(), compiled), end; current != end; ++current) {
    const auto& match = *current;
    std::vector<value> groups;
    groups.reserve(match.size());
    for (const auto& entry : match) {
      groups.push_back(entry.str());
    }
    matches.push_back(make_array(std::move(groups)));
  }
  return make_array(std::move(matches));
}

value regex_replace_first(const value& regexValue, const value& text, const value& replacement) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  const auto replacementText = require_regex_replacement_text(replacement);
  return std::regex_replace(input, compiled, replacementText, std::regex_constants::format_first_only);
}

value regex_replace_all(const value& regexValue, const value& text, const value& replacement) {
  const auto compiled = require_compiled_regex(regexValue);
  const auto input = require_regex_text_argument(text);
  const auto replacementText = require_regex_replacement_text(replacement);
  return std::regex_replace(input, compiled, replacementText);
}`;
}

export function getSetRuntimeHeaderFragment() {
  return `struct set_value {
  std::vector<value> entries;
};

value make_set();
bool is_set_value(const value& input);
value set_add(const value& input, const value& member);
value set_has(const value& input, const value& member);
value set_delete(const value& input, const value& member);
value set_clear(const value& input);
value set_size(const value& input);
value set_values(const value& input);
value set_entries(const value& input);
value set_from_values(const value& values);
value set_union(const value& left, const value& right);
value set_intersection(const value& left, const value& right);
value set_difference(const value& left, const value& right);`;
}

export function getSetRuntimeCppFragment() {
  return `namespace {
set_ptr require_set_value(const value& input) {
  if (!std::holds_alternative<set_ptr>(input)) {
    throw_unsupported_receiver("set", "operation", "set");
  }
  return std::get<set_ptr>(input);
}

std::vector<value>::iterator find_set_entry(set_ptr& set, const value& member) {
  return std::find_if(set->entries.begin(), set->entries.end(), [&member](const value& entry) {
    return std::get<bool>(equal(entry, member));
  });
}

std::vector<value>::const_iterator find_set_entry(const set_ptr& set, const value& member) {
  return std::find_if(set->entries.begin(), set->entries.end(), [&member](const value& entry) {
    return std::get<bool>(equal(entry, member));
  });
}

array_ptr require_set_bulk_array(const value& input, const std::string& message) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<array_ptr>(input);
}
} // namespace

value make_set() {
  return std::make_shared<set_value>();
}

bool is_set_value(const value& input) {
  return std::holds_alternative<set_ptr>(input);
}

value set_add(const value& input, const value& member) {
  auto set = require_set_value(input);
  if (find_set_entry(set, member) == set->entries.end()) {
    set->entries.push_back(member);
  }
  return input;
}

value set_has(const value& input, const value& member) {
  const auto& set = require_set_value(input);
  return find_set_entry(set, member) != set->entries.end();
}

value set_delete(const value& input, const value& member) {
  auto set = require_set_value(input);
  const auto iterator = find_set_entry(set, member);
  if (iterator == set->entries.end()) {
    return false;
  }

  set->entries.erase(iterator);
  return true;
}

value set_clear(const value& input) {
  const auto& set = require_set_value(input);
  set->entries.clear();
  return input;
}

value set_size(const value& input) {
  const auto& set = require_set_value(input);
  return static_cast<double>(set->entries.size());
}

value set_values(const value& input) {
  const auto& set = require_set_value(input);
  std::vector<value> items;
  items.reserve(set->entries.size());
  for (const auto& entry : set->entries) {
    items.push_back(entry);
  }
  return make_array(std::move(items));
}

value set_entries(const value& input) {
  const auto& set = require_set_value(input);
  std::vector<value> items;
  items.reserve(set->entries.size());
  for (const auto& entry : set->entries) {
    items.push_back(make_array({entry, entry}));
  }
  return make_array(std::move(items));
}

value set_from_values(const value& values) {
  const auto& bulkValues = require_set_bulk_array(values, "Jayess set fromValues expects an array of values");
  const auto result = make_set();
  for (const auto& member : bulkValues->items) {
    set_add(result, member);
  }
  return result;
}

value set_union(const value& left, const value& right) {
  const auto& leftSet = require_set_value(left);
  const auto& rightSet = require_set_value(right);
  const auto result = make_set();
  for (const auto& member : leftSet->entries) {
    set_add(result, member);
  }
  for (const auto& member : rightSet->entries) {
    set_add(result, member);
  }
  return result;
}

value set_intersection(const value& left, const value& right) {
  const auto& leftSet = require_set_value(left);
  const auto& rightSet = require_set_value(right);
  const auto result = make_set();
  for (const auto& member : leftSet->entries) {
    if (find_set_entry(rightSet, member) != rightSet->entries.end()) {
      set_add(result, member);
    }
  }
  return result;
}

value set_difference(const value& left, const value& right) {
  const auto& leftSet = require_set_value(left);
  const auto& rightSet = require_set_value(right);
  const auto result = make_set();
  for (const auto& member : leftSet->entries) {
    if (find_set_entry(rightSet, member) == rightSet->entries.end()) {
      set_add(result, member);
    }
  }
  return result;
}`;
}

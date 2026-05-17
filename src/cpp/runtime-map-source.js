export function getMapRuntimeHeaderFragment() {
  return `struct map_entry {
  value key;
  value stored;
};

struct map_value {
  std::vector<map_entry> entries;
};

value make_map();
bool is_map_value(const value& input);
value map_get(const value& map, const value& key);
value map_set(const value& map, const value& key, const value& assigned);
value map_has(const value& map, const value& key);
value map_delete(const value& map, const value& key);
value map_clear(const value& map);
value map_size(const value& map);`;
}

export function getMapRuntimeCppFragment() {
  return `namespace {
map_ptr require_map_value(const value& input) {
  if (!std::holds_alternative<map_ptr>(input)) {
    throw std::runtime_error("Expected a Jayess map value");
  }
  return std::get<map_ptr>(input);
}

std::vector<map_entry>::iterator find_map_entry(map_ptr& map, const value& key) {
  return std::find_if(map->entries.begin(), map->entries.end(), [&key](const map_entry& entry) {
    return std::get<bool>(equal(entry.key, key));
  });
}

std::vector<map_entry>::const_iterator find_map_entry(const map_ptr& map, const value& key) {
  return std::find_if(map->entries.begin(), map->entries.end(), [&key](const map_entry& entry) {
    return std::get<bool>(equal(entry.key, key));
  });
}
} // namespace

value make_map() {
  return std::make_shared<map_value>();
}

bool is_map_value(const value& input) {
  return std::holds_alternative<map_ptr>(input);
}

value map_get(const value& map, const value& key) {
  const auto& storage = require_map_value(map);
  const auto iterator = find_map_entry(storage, key);
  if (iterator == storage->entries.end()) {
    return value(std::monostate{});
  }
  return iterator->stored;
}

value map_set(const value& map, const value& key, const value& assigned) {
  auto storage = require_map_value(map);
  const auto iterator = find_map_entry(storage, key);
  if (iterator != storage->entries.end()) {
    iterator->stored = assigned;
    return map;
  }

  storage->entries.push_back({key, assigned});
  return map;
}

value map_has(const value& map, const value& key) {
  const auto& storage = require_map_value(map);
  return find_map_entry(storage, key) != storage->entries.end();
}

value map_delete(const value& map, const value& key) {
  const auto& storage = require_map_value(map);
  const auto iterator = find_map_entry(storage, key);
  if (iterator == storage->entries.end()) {
    return false;
  }

  storage->entries.erase(iterator);
  return true;
}

value map_clear(const value& map) {
  const auto& storage = require_map_value(map);
  storage->entries.clear();
  return map;
}

value map_size(const value& map) {
  const auto& storage = require_map_value(map);
  return static_cast<double>(storage->entries.size());
}`;
}

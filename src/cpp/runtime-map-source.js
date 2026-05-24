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
value map_size(const value& map);
value map_keys(const value& map);
value map_values(const value& map);
value map_entries(const value& map);
value map_from_entries(const value& entries);
value map_set_all(const value& map, const value& entries);
value map_delete_all(const value& map, const value& keys);`;
}

export function getMapRuntimeCppFragment() {
  return `namespace {
map_ptr require_map_value(const value& input) {
  if (!std::holds_alternative<map_ptr>(input)) {
    throw_unsupported_receiver("map", "operation", "map");
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

array_ptr require_map_entry_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess map bulk entries must contain two-item arrays");
  }

  const auto& entry = std::get<array_ptr>(input);
  if (entry->items.size() != 2) {
    throw std::runtime_error("Jayess map bulk entries must contain two-item arrays");
  }
  return entry;
}

array_ptr require_map_bulk_array(const value& input, const std::string& message) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<array_ptr>(input);
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
}

value map_keys(const value& map) {
  const auto& storage = require_map_value(map);
  std::vector<value> items;
  items.reserve(storage->entries.size());
  for (const auto& entry : storage->entries) {
    items.push_back(entry.key);
  }
  return make_array(std::move(items));
}

value map_values(const value& map) {
  const auto& storage = require_map_value(map);
  std::vector<value> items;
  items.reserve(storage->entries.size());
  for (const auto& entry : storage->entries) {
    items.push_back(entry.stored);
  }
  return make_array(std::move(items));
}

value map_entries(const value& map) {
  const auto& storage = require_map_value(map);
  std::vector<value> items;
  items.reserve(storage->entries.size());
  for (const auto& entry : storage->entries) {
    items.push_back(make_array({entry.key, entry.stored}));
  }
  return make_array(std::move(items));
}

value map_from_entries(const value& entries) {
  const auto result = make_map();
  return map_set_all(result, entries);
}

value map_set_all(const value& map, const value& entries) {
  const auto& bulkEntries = require_map_bulk_array(entries, "Jayess map setAll expects an array of entries");
  for (const auto& candidate : bulkEntries->items) {
    const auto& entry = require_map_entry_array(candidate);
    map_set(map, entry->items[0], entry->items[1]);
  }
  return map;
}

value map_delete_all(const value& map, const value& keys) {
  const auto& bulkKeys = require_map_bulk_array(keys, "Jayess map deleteAll expects an array of keys");
  for (const auto& key : bulkKeys->items) {
    map_delete(map, key);
  }
  return map;
}`;
}

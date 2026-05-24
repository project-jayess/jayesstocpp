export function getEventsRuntimeHeaderFragment() {
  return `struct event_listener {
  std::string name;
  callable_ptr callback;
  bool once = false;
};

struct event_emitter {
  std::vector<event_listener> listeners;
};

value events_create();
value events_on(const value& emitter, const std::string& name, const value& callback);
value events_once(const value& emitter, const std::string& name, const value& callback);
value events_off(const value& emitter, const std::string& name, const value& callback);
value events_emit(const value& emitter, const std::string& name, const value& args);
value events_listener_count(const value& emitter, const std::string& name);
bool is_event_emitter(const value& input);`;
}

export function getEventsRuntimeCppFragment() {
  return `namespace {
event_emitter_ptr require_event_emitter(const value& input) {
  if (!std::holds_alternative<event_emitter_ptr>(input)) {
    throw std::runtime_error("Expected Jayess event emitter");
  }
  return std::get<event_emitter_ptr>(input);
}

callable_ptr require_event_callback(const value& input) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error("Jayess events listener expects a callable callback");
  }
  return std::get<callable_ptr>(input);
}

std::vector<value> require_event_args(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Jayess events emit expects an argument array");
  }
  return std::get<array_ptr>(input)->items;
}

value events_add_listener(const value& emitter, const std::string& name, const value& callback, bool once) {
  const auto storage = require_event_emitter(emitter);
  storage->listeners.push_back({name, require_event_callback(callback), once});
  return emitter;
}
} // namespace

value events_create() {
  return std::make_shared<event_emitter>();
}

bool is_event_emitter(const value& input) {
  return std::holds_alternative<event_emitter_ptr>(input);
}

value events_on(const value& emitter, const std::string& name, const value& callback) {
  return events_add_listener(emitter, name, callback, false);
}

value events_once(const value& emitter, const std::string& name, const value& callback) {
  return events_add_listener(emitter, name, callback, true);
}

value events_off(const value& emitter, const std::string& name, const value& callback) {
  const auto storage = require_event_emitter(emitter);
  const auto callable = require_event_callback(callback);
  const auto oldSize = storage->listeners.size();
  storage->listeners.erase(
    std::remove_if(storage->listeners.begin(), storage->listeners.end(), [&name, &callable](const event_listener& listener) {
      return listener.name == name && listener.callback == callable;
    }),
    storage->listeners.end()
  );
  return static_cast<double>(oldSize - storage->listeners.size());
}

value events_emit(const value& emitter, const std::string& name, const value& args) {
  const auto storage = require_event_emitter(emitter);
  const auto emittedArgs = require_event_args(args);
  std::vector<callable_ptr> callbacks;
  callbacks.reserve(storage->listeners.size());

  for (const auto& listener : storage->listeners) {
    if (listener.name == name) {
      callbacks.push_back(listener.callback);
    }
  }

  storage->listeners.erase(
    std::remove_if(storage->listeners.begin(), storage->listeners.end(), [&name](const event_listener& listener) {
      return listener.name == name && listener.once;
    }),
    storage->listeners.end()
  );

  for (const auto& callback : callbacks) {
    callback->fn(emittedArgs);
  }

  return static_cast<double>(callbacks.size());
}

value events_listener_count(const value& emitter, const std::string& name) {
  const auto storage = require_event_emitter(emitter);
  const auto count = std::count_if(storage->listeners.begin(), storage->listeners.end(), [&name](const event_listener& listener) {
    return listener.name == name;
  });
  return static_cast<double>(count);
}`;
}

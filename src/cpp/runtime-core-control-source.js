export function getCoreControlRuntimeHeaderFragment() {
  return `struct scope_cleanup_frame {
  std::vector<std::function<void()>> cleanups;

  void defer(std::function<void()> cleanup);
  ~scope_cleanup_frame();
};

struct finally_guard {
  std::function<void()> cleanup;

  explicit finally_guard(std::function<void()> cleanup);
  ~finally_guard() noexcept(false);
};

struct finally_return_signal {
  value payload;
  explicit finally_return_signal(value payload);
};

struct finally_break_signal {
};

struct finally_continue_signal {
};

struct thrown_value : std::exception {
  value payload;
  std::string message;

  explicit thrown_value(value payload);
  const char* what() const noexcept override;
};`;
}

export function getCoreControlRuntimeCppFragment() {
  return `void scope_cleanup_frame::defer(std::function<void()> cleanup) {
  cleanups.push_back(std::move(cleanup));
}

scope_cleanup_frame::~scope_cleanup_frame() {
  for (auto iterator = cleanups.rbegin(); iterator != cleanups.rend(); ++iterator) {
    (*iterator)();
  }
}

finally_guard::finally_guard(std::function<void()> cleanup)
  : cleanup(std::move(cleanup)) {
}

finally_guard::~finally_guard() noexcept(false) {
  if (cleanup) {
    cleanup();
  }
}

finally_return_signal::finally_return_signal(value payload)
  : payload(std::move(payload)) {
}

thrown_value::thrown_value(value payload)
  : payload(std::move(payload)),
    message("Jayess thrown value") {
}

const char* thrown_value::what() const noexcept {
  return message.c_str();
}`;
}

export function getGeneratorRuntimeHeaderFragment() {
  return `enum class generator_status {
  suspended_start,
  suspended_yield,
  completed,
  failed
};

struct generator_state {
  generator_status status = generator_status::suspended_start;
  std::size_t next_state = 0;
  value current = std::monostate{};
  std::function<void()> resume;
};

value make_generator_handle();
bool is_generator(const value& input);
bool generator_is_suspended(const value& input);
bool generator_is_completed(const value& input);
bool generator_is_failed(const value& input);
std::size_t generator_next_state(const value& input);
value generator_current_value(const value& input);
void generator_set_resume(const value& input, std::function<void()> resume);
void generator_yield(const value& input, std::size_t nextState, value yielded);
void generator_complete(const value& input, value completed);
void generator_fail(const value& input, value failure);
value generator_resume(const value& input);
`;
}

export function getGeneratorRuntimeCppFragment() {
  return `namespace {
const generator_ptr& require_generator_state(const value& input) {
  if (!std::holds_alternative<generator_ptr>(input)) {
    throw std::runtime_error("Expected Jayess generator handle");
  }

  return std::get<generator_ptr>(input);
}
} // namespace

value make_generator_handle() {
  return std::make_shared<generator_state>();
}

bool is_generator(const value& input) {
  return std::holds_alternative<generator_ptr>(input);
}

bool generator_is_suspended(const value& input) {
  const auto& state = require_generator_state(input);
  return state->status == generator_status::suspended_start || state->status == generator_status::suspended_yield;
}

bool generator_is_completed(const value& input) {
  return require_generator_state(input)->status == generator_status::completed;
}

bool generator_is_failed(const value& input) {
  return require_generator_state(input)->status == generator_status::failed;
}

std::size_t generator_next_state(const value& input) {
  return require_generator_state(input)->next_state;
}

value generator_current_value(const value& input) {
  return require_generator_state(input)->current;
}

void generator_set_resume(const value& input, std::function<void()> resume) {
  require_generator_state(input)->resume = std::move(resume);
}

void generator_yield(const value& input, std::size_t nextState, value yielded) {
  const auto& state = require_generator_state(input);
  state->status = generator_status::suspended_yield;
  state->next_state = nextState;
  state->current = std::move(yielded);
}

void generator_complete(const value& input, value completed) {
  const auto& state = require_generator_state(input);
  state->status = generator_status::completed;
  state->current = std::move(completed);
  state->resume = nullptr;
}

void generator_fail(const value& input, value failure) {
  const auto& state = require_generator_state(input);
  state->status = generator_status::failed;
  state->current = std::move(failure);
  state->resume = nullptr;
}

value generator_resume(const value& input) {
  const auto& state = require_generator_state(input);
  if (state->status == generator_status::completed) {
    return state->current;
  }
  if (state->status == generator_status::failed) {
    throw_value(state->current);
  }
  if (!state->resume) {
    throw std::runtime_error("Generator has no resume function");
  }

  state->resume();

  if (state->status == generator_status::failed) {
    throw_value(state->current);
  }

  return state->current;
}
`;
}

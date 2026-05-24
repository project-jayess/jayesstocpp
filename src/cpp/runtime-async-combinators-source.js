export function getAsyncCombinatorsRuntimeCppFragment() {
  return `namespace {
const array_ptr& require_async_handle_array(const value& input) {
  if (!std::holds_alternative<array_ptr>(input)) {
    throw std::runtime_error("Expected Jayess array of async handles");
  }

  return std::get<array_ptr>(input);
}

void require_async_handle_items(const array_ptr& array) {
  for (const auto& handle : array->items) {
    if (!is_async(handle)) {
      throw std::runtime_error("Jayess async composition requires async handles");
    }
  }
}

int require_async_milliseconds(const value& input, const std::string& message) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error(message);
  }

  const auto milliseconds = std::get<double>(input);
  if (!std::isfinite(milliseconds) || milliseconds < 0.0 || std::floor(milliseconds) != milliseconds) {
    throw std::runtime_error(message);
  }
  return static_cast<int>(milliseconds);
}

callable_ptr require_async_callback(const value& input, const std::string& message) {
  if (!std::holds_alternative<callable_ptr>(input)) {
    throw std::runtime_error(message);
  }
  return std::get<callable_ptr>(input);
}

int require_async_retry_count(const value& input) {
  if (!std::holds_alternative<double>(input)) {
    throw std::runtime_error("Jayess async retry expects a non-negative integer count");
  }
  const auto count = std::get<double>(input);
  if (!std::isfinite(count) || count < 0.0 || std::floor(count) != count) {
    throw std::runtime_error("Jayess async retry expects a non-negative integer count");
  }
  return static_cast<int>(count);
}

void async_adopt_result(const value& result, const value& produced) {
  if (!is_async(produced)) {
    async_resolve(result, produced);
    return;
  }

  async_enqueue(produced, [result, produced]() mutable {
    if (async_is_rejected(produced)) {
      async_reject(result, async_result_value(produced));
      return;
    }
    async_resolve(result, async_result_value(produced));
  });
}
} // namespace

value async_all(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_resolve(result, make_array({}));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto settled = std::make_shared<bool>(false);
  auto collected = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, settled, collected, handle, index]() mutable {
      if (*settled) {
        return;
      }

      if (async_is_rejected(handle)) {
        *settled = true;
        async_reject(result, async_result_value(handle));
        return;
      }

      (*collected)[index] = async_result_value(handle);
      *remaining -= 1;
      if (*remaining == 0) {
        *settled = true;
        async_resolve(result, make_array(std::move(*collected)));
      }
    });
  }

  return result;
}

value async_race(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_reject(result, value(std::string("Jayess async race requires at least one handle")));
    return result;
  }

  auto settled = std::make_shared<bool>(false);
  for (const auto& handle : array->items) {
    async_enqueue(handle, [result, settled, handle]() mutable {
      if (*settled) {
        return;
      }

      *settled = true;
      if (async_is_rejected(handle)) {
        async_reject(result, async_result_value(handle));
        return;
      }

      async_resolve(result, async_result_value(handle));
    });
  }

  return result;
}

value async_all_settled(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_resolve(result, make_array({}));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto collected = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, collected, handle, index]() mutable {
      if (async_is_rejected(handle)) {
        (*collected)[index] = make_object({
          {"status", value(std::string("rejected"))},
          {"reason", async_result_value(handle)}
        });
      } else {
        (*collected)[index] = make_object({
          {"status", value(std::string("resolved"))},
          {"value", async_result_value(handle)}
        });
      }

      *remaining -= 1;
      if (*remaining == 0) {
        async_resolve(result, make_array(std::move(*collected)));
      }
    });
  }

  return result;
}

value async_any(const value& handles) {
  const auto& array = require_async_handle_array(handles);
  require_async_handle_items(array);
  const auto result = make_pending_async();
  if (array->items.empty()) {
    async_reject(result, value(std::string("Jayess async any requires at least one handle")));
    return result;
  }

  auto remaining = std::make_shared<std::size_t>(array->items.size());
  auto settled = std::make_shared<bool>(false);
  auto rejections = std::make_shared<std::vector<value>>(array->items.size(), value(std::monostate{}));

  for (std::size_t index = 0; index < array->items.size(); index += 1) {
    const auto handle = array->items[index];
    async_enqueue(handle, [result, remaining, settled, rejections, handle, index]() mutable {
      if (*settled) {
        return;
      }

      if (async_is_resolved(handle)) {
        *settled = true;
        async_resolve(result, async_result_value(handle));
        return;
      }

      (*rejections)[index] = async_result_value(handle);
      *remaining -= 1;
      if (*remaining == 0) {
        *settled = true;
        async_reject(result, make_array(std::move(*rejections)));
      }
    });
  }

  return result;
}

value async_sleep(const value& milliseconds) {
  const auto delay = require_async_milliseconds(milliseconds, "Jayess async sleep expects a non-negative integer milliseconds value");
  const auto result = make_pending_async();
  async_schedule_timer(delay, [result]() mutable {
    async_resolve(result, value(std::monostate{}));
  });
  return result;
}

value async_timeout(const value& handle, const value& milliseconds) {
  require_async_state(handle);
  const auto delay = require_async_milliseconds(milliseconds, "Jayess async timeout expects a non-negative integer milliseconds value");
  const auto result = make_pending_async();
  auto settled = std::make_shared<bool>(false);

  async_enqueue(handle, [result, settled, handle]() mutable {
    if (*settled) {
      return;
    }

    *settled = true;
    if (async_is_rejected(handle)) {
      async_reject(result, async_result_value(handle));
      return;
    }

    async_resolve(result, async_result_value(handle));
  });

  async_schedule_timer(delay, [result, settled]() mutable {
    if (*settled) {
      return;
    }

    *settled = true;
    async_reject(result, value(std::string("Jayess async operation timed out")));
  });

  return result;
}

value async_with_cancellation(const value& handle, const value& token) {
  require_async_state(handle);
  const auto& tokenState = require_cancellation_token_state(token);
  const auto result = make_pending_async();
  auto settled = std::make_shared<bool>(false);

  if (tokenState->cancelled) {
    async_reject(result, tokenState->reason);
    return result;
  }

  async_enqueue(handle, [result, settled, handle]() mutable {
    if (*settled) {
      return;
    }

    *settled = true;
    if (async_is_rejected(handle)) {
      async_reject(result, async_result_value(handle));
      return;
    }

    async_resolve(result, async_result_value(handle));
  });

  tokenState->continuations.push_back([result, settled, token]() mutable {
    if (*settled) {
      return;
    }

    *settled = true;
    async_reject(result, cancellation_token_reason(token));
  });

  return result;
}

value async_sleep_with_cancellation(const value& milliseconds, const value& token) {
  return async_with_cancellation(async_sleep(milliseconds), token);
}

value async_timeout_with_cancellation(const value& handle, const value& milliseconds, const value& token) {
  return async_with_cancellation(async_timeout(handle, milliseconds), token);
}

value async_catch_error(const value& handle, const value& callback) {
  require_async_state(handle);
  const auto callable = require_async_callback(callback, "Jayess async catchError expects a callable callback");
  const auto result = make_pending_async();

  async_enqueue(handle, [result, handle, callable]() mutable {
    if (async_is_resolved(handle)) {
      async_resolve(result, async_result_value(handle));
      return;
    }

    try {
      async_adopt_result(result, callable->fn({async_result_value(handle)}));
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });

  return result;
}

value async_finally_do(const value& handle, const value& callback) {
  require_async_state(handle);
  const auto callable = require_async_callback(callback, "Jayess async finallyDo expects a callable callback");
  const auto result = make_pending_async();

  async_enqueue(handle, [result, handle, callable]() mutable {
    const auto originalRejected = async_is_rejected(handle);
    const auto originalValue = async_result_value(handle);
    value cleanup;
    try {
      cleanup = callable->fn({});
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
      return;
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
      return;
    }

    if (!is_async(cleanup)) {
      if (originalRejected) {
        async_reject(result, originalValue);
      } else {
        async_resolve(result, originalValue);
      }
      return;
    }

    async_enqueue(cleanup, [result, cleanup, originalRejected, originalValue]() mutable {
      if (async_is_rejected(cleanup)) {
        async_reject(result, async_result_value(cleanup));
        return;
      }
      if (originalRejected) {
        async_reject(result, originalValue);
      } else {
        async_resolve(result, originalValue);
      }
    });
  });

  return result;
}

value async_delay(const value& input, const value& milliseconds) {
  const auto delay = require_async_milliseconds(milliseconds, "Jayess async delay expects a non-negative integer milliseconds value");
  const auto result = make_pending_async();
  async_schedule_timer(delay, [result, input]() mutable {
    async_resolve(result, input);
  });
  return result;
}

value async_retry(const value& callback, const value& countValue) {
  const auto callable = require_async_callback(callback, "Jayess async retry expects a callable callback");
  const auto attempts = require_async_retry_count(countValue);
  const auto result = make_pending_async();
  if (attempts == 0) {
    async_reject(result, value(std::string("Jayess async retry exhausted")));
    return result;
  }

  auto runAttempt = std::make_shared<std::function<void(int)>>();
  *runAttempt = [result, callable, runAttempt](int remaining) mutable {
    value produced;
    try {
      produced = callable->fn({});
    } catch (const thrown_value& error) {
      if (remaining <= 1) {
        async_reject(result, exception_to_value(error));
        return;
      }
      (*runAttempt)(remaining - 1);
      return;
    } catch (const std::exception& error) {
      if (remaining <= 1) {
        async_reject(result, exception_to_value(error));
        return;
      }
      (*runAttempt)(remaining - 1);
      return;
    }

    if (!is_async(produced)) {
      async_resolve(result, produced);
      return;
    }

    async_enqueue(produced, [result, produced, remaining, runAttempt]() mutable {
      if (async_is_resolved(produced)) {
        async_resolve(result, async_result_value(produced));
        return;
      }
      const auto error = async_result_value(produced);
      if (remaining <= 1) {
        async_reject(result, error);
        return;
      }
      (*runAttempt)(remaining - 1);
    });
  };

  (*runAttempt)(attempts);
  return result;
}`;
}

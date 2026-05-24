export function getTimersRuntimeHeaderFragment() {
  return `value timer_schedule_once(const value& callback, int milliseconds, const value& args, const value& handle);
value timer_schedule_interval(const value& callback, int milliseconds, const value& args, const value& handle);`;
}

export function getTimersRuntimeCppFragment() {
  return `namespace {
value timer_callback_result(const value& callback, const value& args) {
  auto callee = callback;
  std::vector<value> callbackArgs;
  append_spread_values(callbackArgs, args);
  return call_with_args(callee, std::move(callbackArgs));
}
} // namespace

value timer_schedule_once(const value& callback, int milliseconds, const value& args, const value& handle) {
  const auto result = make_pending_async();
  async_schedule_timer(milliseconds, [result, handle, callback, args]() mutable {
    try {
      if (truthy(get_property(handle, "cancelled"))) {
        async_resolve(result, value(std::monostate{}));
        return;
      }
      async_resolve(result, timer_callback_result(callback, args));
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
}

value timer_schedule_interval(const value& callback, int milliseconds, const value& args, const value& handle) {
  const auto result = make_pending_async();
  auto last = std::make_shared<value>(value(std::monostate{}));
  auto tick = std::make_shared<std::function<void()>>();
  *tick = [result, handle, callback, args, milliseconds, last, tick]() mutable {
    try {
      if (truthy(get_property(handle, "cancelled"))) {
        async_resolve(result, *last);
        return;
      }
      *last = timer_callback_result(callback, args);
      async_schedule_timer(milliseconds, *tick);
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  };
  async_schedule_timer(milliseconds, *tick);
  return result;
}`;
}

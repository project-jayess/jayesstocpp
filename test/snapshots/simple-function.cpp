#include "runtime/jayess_runtime.hpp"

namespace jayess_module_snapshot_simple_function {
jayess::value add(const std::vector<jayess::value>& jayess_args) {
  jayess::scope_cleanup_frame jayess_scope;
  jayess::value a = jayess::argument_at(jayess_args, 0);
  jayess::value b = jayess::argument_at(jayess_args, 1);
  return jayess::add(a, b);
  return 0.0;
}

jayess::value jayess_module_init() {
  jayess::scope_cleanup_frame jayess_scope;
  return 0.0;
}
} // namespace jayess_module_snapshot_simple_function

#include "runtime/jayess_runtime.hpp"
#include <string>

namespace jayess_module_snapshot_conditional_string_import {
jayess::value label(const std::vector<jayess::value>& jayess_args) {
  jayess::scope_cleanup_frame jayess_scope;
  jayess::value x = jayess::argument_at(jayess_args, 0);
  if (jayess::truthy(x)) {
    return jayess::value(std::string("yes"));
  }
  return jayess::value(std::string("no"));
  return jayess::value(std::monostate{});
}

jayess::value jayess_module_init() {
  jayess::scope_cleanup_frame jayess_scope;
  return jayess::value(std::monostate{});
}

jayess::value jayess_module_init_async() {
  return jayess::make_resolved_async(jayess_module_init());
}
} // namespace jayess_module_snapshot_conditional_string_import

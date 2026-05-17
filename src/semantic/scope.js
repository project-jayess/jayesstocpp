export function createScope(parent = null, kind = "block") {
  return {
    kind,
    parent,
    bindings: new Map()
  };
}

export function defineBinding(scope, name, binding) {
  if (scope.bindings.has(name)) {
    return false;
  }
  binding.scope = scope;
  scope.bindings.set(name, binding);
  return true;
}

export function resolveBinding(scope, name) {
  let current = scope;
  while (current != null) {
    if (current.bindings.has(name)) {
      return current.bindings.get(name);
    }
    current = current.parent;
  }
  return null;
}

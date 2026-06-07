function sorted(values) {
  return [...(values ?? [])].filter(Boolean).sort();
}

export function createLifetimeEmissionPlan(lifetimeMetadata) {
  const moduleStateBindings = sorted(lifetimeMetadata?.moduleStateBindings);
  return {
    kind: "jayess-lifetime-emission-plan",
    supportedValueCategory: "module-state-bindings",
    retainedModuleStateBindings: moduleStateBindings,
    fallback: lifetimeMetadata?.fallback ?? {
      strategy: "broad-runtime-value-ownership",
      reason: "no lifetime metadata was provided to the C++ emitter"
    }
  };
}

export function renderLifetimeMetadataCommentLines(lifetimeMetadata) {
  const emissionPlan = createLifetimeEmissionPlan(lifetimeMetadata);
  return [
    `// Jayess lifetime emission: ${emissionPlan.supportedValueCategory}`,
    `// Jayess retained module-state bindings: ${emissionPlan.retainedModuleStateBindings.join(", ") || "(none)"}`,
    `// Jayess lifetime fallback: ${emissionPlan.fallback.strategy}`
  ];
}

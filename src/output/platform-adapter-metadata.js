const sourceRuntimeFeatures = new Map([
  ["jayess:clipboard", ["clipboard"]],
  ["jayess:gpu", ["gpu"]],
  ["jayess:net", ["net"]],
  ["jayess:subprocess", ["subprocess"]],
  ["jayess:watch", ["watch"]],
  ["jayess:window", ["window"]]
]);

const featureAdapters = new Map([
  ["clipboard", {
    feature: "clipboard",
    adapters: ["windows-clipboard", "macos-pasteboard", "linux-clipboard"],
    platformLibraries: [],
    optionalBackendRequirements: []
  }],
  ["gpu", {
    feature: "gpu",
    adapters: ["direct3d", "metal", "opengl", "vulkan"],
    platformLibraries: ["d3d11", "metal", "opengl", "vulkan"],
    optionalBackendRequirements: ["host GPU driver", "selected GPU SDK headers"]
  }],
  ["net", {
    feature: "net",
    adapters: ["posix-sockets", "winsock"],
    platformLibraries: ["ws2_32"],
    optionalBackendRequirements: []
  }],
  ["subprocess", {
    feature: "subprocess",
    adapters: ["posix-process", "windows-process"],
    platformLibraries: [],
    optionalBackendRequirements: []
  }],
  ["watch", {
    feature: "watch",
    adapters: ["inotify", "kqueue", "read-directory-changes"],
    platformLibraries: [],
    optionalBackendRequirements: []
  }],
  ["window", {
    feature: "window",
    adapters: ["win32", "cocoa", "x11"],
    platformLibraries: ["gdi32", "user32", "x11"],
    optionalBackendRequirements: []
  }]
]);

export function runtimeFeaturesForJayessSource(source) {
  return sourceRuntimeFeatures.get(source) ?? [];
}

export function platformAdapterMetadataForFeatures(runtimeFeatures) {
  const features = Array.isArray(runtimeFeatures) ? runtimeFeatures : [];
  return [...new Set(features)]
    .filter((feature) => featureAdapters.has(feature))
    .sort()
    .map((feature) => featureAdapters.get(feature));
}

export function runtimeRequirementsForFeatures(runtimeFeatures) {
  const adapters = platformAdapterMetadataForFeatures(runtimeFeatures);
  const requirements = {};
  for (const adapter of adapters) {
    const requirement = {
      adapters: adapter.adapters,
      platformLibraries: adapter.platformLibraries,
      optionalBackendRequirements: adapter.optionalBackendRequirements
    };
    if (adapter.feature === "gpu") {
      requirement.backends = adapter.adapters;
      requirement.defaultBackend = "host";
    }
    requirements[adapter.feature] = requirement;
  }
  return requirements;
}

export function dependencyInclusionReason(dependency, runtimeFeatures) {
  if (dependency.source.startsWith("jayess:")) {
    if (runtimeFeatures.length > 0) {
      return `stdlib import '${dependency.source}' includes runtime feature(s): ${runtimeFeatures.join(", ")}`;
    }
    return `stdlib import '${dependency.source}' is copied as a pure Jayess module`;
  }
  if (dependency.kind === "package" || dependency.kind === "package-import") {
    return `module specifier '${dependency.source}' resolved through ${dependency.packageField ?? dependency.kind}`;
  }
  return `module specifier '${dependency.source}' resolved as ${dependency.kind}`;
}

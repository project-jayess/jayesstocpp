const sourceRuntimeFeatures = new Map([
  ["jayess:clipboard", ["clipboard"]],
  ["jayess:dialog", ["dialog"]],
  ["jayess:gpu", ["gpu"]],
  ["jayess:http", ["http"]],
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
  ["dialog", {
    feature: "dialog",
    adapters: ["win32-dialog", "cocoa-dialog", "linux-portal-dialog"],
    platformLibraries: [],
    optionalBackendRequirements: ["Linux dialog runtime uses the focused xdg-desktop-portal adapter family and reports a normalized unavailable diagnostic when that host path cannot be used"],
    compiledAdaptersByPlatform: {
      windows: ["win32-dialog"],
      macos: ["cocoa-dialog"],
      linux: ["linux-portal-dialog"]
    }
  }],
  ["gpu", {
    feature: "gpu",
    adapters: ["validation", "direct3d", "metal", "opengl", "vulkan"],
    platformLibraries: ["d3d11", "metal", "opengl", "vulkan"],
    optionalBackendRequirements: ["validation backend is always available for deterministic command execution", "host GPU driver", "selected GPU SDK headers"],
    compiledAdaptersByPlatform: {
      windows: ["validation", "direct3d"],
      macos: ["validation", "metal"],
      linux: ["validation", "opengl", "vulkan"]
    },
    adapterSelection: {
      windowSurface: {
        windows: "Prefer direct3d for createSurface(window) when the Win32 window adapter is available; otherwise fall back to validation.",
        macos: "Prefer metal for createSurface(window) when the Cocoa window adapter is available; otherwise fall back to validation.",
        linux: "Current createSurface(window) still falls back to validation until the Linux host-backed backend slice lands."
      }
    }
  }],
  ["http", {
    feature: "http",
    adapters: ["posix-http", "winsock-http"],
    platformLibraries: ["ws2_32"],
    optionalBackendRequirements: []
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
    adapters: ["win32", "cocoa", "x11", "wayland"],
    platformLibraries: ["gdi32", "user32", "wayland-client", "x11"],
    optionalBackendRequirements: ["Wayland runtime depends on a host compositor that exposes the xdg-shell client protocol"],
    compiledAdaptersByPlatform: {
      windows: ["win32"],
      macos: ["cocoa"],
      linux: ["x11", "wayland"]
    },
    adapterSelection: {
      linux: {
        preferredOrder: ["wayland", "x11"],
        defaultBehavior: "Prefer Wayland when WAYLAND_DISPLAY is set and the Wayland client path is available; otherwise fall back to X11 when available."
      }
    }
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
    if (adapter.compiledAdaptersByPlatform != null) {
      requirement.compiledAdaptersByPlatform = adapter.compiledAdaptersByPlatform;
    }
    if (adapter.adapterSelection != null) {
      requirement.adapterSelection = adapter.adapterSelection;
    }
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

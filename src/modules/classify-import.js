const nativeHeaderExtensions = [".h", ".hpp", ".hh", ".hxx"];
const nativeSourceExtensions = [".c", ".cc", ".cpp", ".cxx"];
const sharedLibraryExtensions = [".so", ".dylib", ".dll"];
const staticLibraryExtensions = [".a", ".lib"];

export function classifyImport(source) {
  if (source.startsWith("cpp:")) {
    return { kind: "cpp-header", header: source.slice(4) };
  }

  if (source.startsWith("node:")) {
    return { kind: "node-builtin", source };
  }

  if (source.startsWith("jayess:")) {
    return { kind: "builtin-module", source };
  }

  if (nativeHeaderExtensions.some((extension) => source.endsWith(extension))) {
    return { kind: "native-header", source };
  }

  if (nativeSourceExtensions.some((extension) => source.endsWith(extension))) {
    return { kind: "native-source", source };
  }

  if (sharedLibraryExtensions.some((extension) => source.endsWith(extension))) {
    return { kind: "shared-library", source };
  }

  if (staticLibraryExtensions.some((extension) => source.endsWith(extension))) {
    return { kind: "static-library", source };
  }

  if (source.startsWith("./") || source.startsWith("../")) {
    return { kind: "jayess-module", source };
  }

  return { kind: "package", source };
}

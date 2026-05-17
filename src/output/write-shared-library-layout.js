import fs from "node:fs";
import path from "node:path";

function getExportHeaderSource() {
  return `#pragma once

#if defined(_WIN32) && defined(JAYESS_SHARED_LIBRARY_BUILD)
#  define JAYESS_SHARED_EXPORT __declspec(dllexport)
#else
#  define JAYESS_SHARED_EXPORT
#endif
`;
}

function getEntrypointHeaderSource() {
  return `#pragma once
#include "runtime/jayess_runtime.hpp"
#include "shared-library/jayess_exports.hpp"

extern "C" JAYESS_SHARED_EXPORT jayess::value jayess_library_entry();
`;
}

function getEntrypointCppSource(entryHeader, entryNamespace) {
  return `#include "shared-library/jayess_entry.hpp"
#include ${JSON.stringify(entryHeader)}

extern "C" JAYESS_SHARED_EXPORT jayess::value jayess_library_entry() {
  return ${entryNamespace}::jayess_module_init();
}
`;
}

export function writeSharedLibraryLayout(targetDirname, { libraryName, entryHeader, entryNamespace }) {
  const sharedDir = path.join(targetDirname, "shared-library");
  fs.mkdirSync(sharedDir, { recursive: true });

  const exportsHeaderPath = path.join(sharedDir, "jayess_exports.hpp");
  const entryHeaderPath = path.join(sharedDir, "jayess_entry.hpp");
  const entryCppPath = path.join(sharedDir, "jayess_entry.cpp");
  const manifestPath = path.join(sharedDir, "jayess_shared_library.json");

  fs.writeFileSync(exportsHeaderPath, getExportHeaderSource(), "utf8");
  fs.writeFileSync(entryHeaderPath, getEntrypointHeaderSource(), "utf8");
  fs.writeFileSync(entryCppPath, getEntrypointCppSource(entryHeader, entryNamespace), "utf8");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        kind: "shared-library-project",
        libraryName,
        entryHeader,
        entryNamespace,
        entryFunction: "jayess_library_entry"
      },
      null,
      2
    ),
    "utf8"
  );

  return [exportsHeaderPath, entryHeaderPath, entryCppPath, manifestPath];
}

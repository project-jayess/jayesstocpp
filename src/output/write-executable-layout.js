import fs from "node:fs";
import path from "node:path";

function findEntryMain(ast) {
  for (const statement of ast.body) {
    if (statement.type === "FunctionDeclaration" && statement.id?.name === "main") {
      return statement;
    }
    if (
      statement.type === "ExportNamedDeclaration" &&
      statement.declaration?.type === "FunctionDeclaration" &&
      statement.declaration.id?.name === "main"
    ) {
      return statement.declaration;
    }
  }
  return null;
}

function getExitCodeSource() {
  return `int jayess_exit_code(const jayess::value& result) {
  if (std::holds_alternative<std::monostate>(result)) {
    return 0;
  }
  if (std::holds_alternative<double>(result)) {
    const auto numeric = std::get<double>(result);
    if (!std::isfinite(numeric)) {
      return 1;
    }
    return static_cast<int>(numeric);
  }
  return 0;
}`;
}

function getExceptionReportSource() {
  return `void jayess_report_exception(const jayess::value& error) {
  try {
    std::cerr << "Uncaught Jayess exception: " << jayess::stringify_value(error) << "\\n";
  } catch (const std::exception& nested) {
    std::cerr << "Uncaught Jayess exception: " << nested.what() << "\\n";
  }
}`;
}

function getMainSource({ entryHeader, entryNamespace, awaitsResult }) {
  const resultExpression = awaitsResult
    ? `jayess::await_sync(${entryNamespace}::main(std::vector<jayess::value>{}))`
    : `${entryNamespace}::main(std::vector<jayess::value>{})`;

  return `#include <cmath>
#include <exception>
#include <iostream>
#include <variant>
#include ${JSON.stringify(entryHeader)}

namespace {
${getExitCodeSource()}

${getExceptionReportSource()}
}

int main() {
  try {
    ${entryNamespace}::jayess_module_init();
    const auto result = ${resultExpression};
    return jayess_exit_code(result);
  } catch (const jayess::thrown_value& error) {
    jayess_report_exception(jayess::exception_to_value(error));
  } catch (const std::exception& error) {
    jayess_report_exception(jayess::exception_to_value(error));
  }
  return 1;
}
`;
}

export function entryMainFunction(ast) {
  const mainFunction = findEntryMain(ast);
  if (mainFunction == null || mainFunction.generator) {
    return null;
  }
  return {
    async: Boolean(mainFunction.async)
  };
}

export function writeExecutableLayout(targetDirname, { entryHeader, entryNamespace, mainFunction }) {
  const executableDir = path.join(targetDirname, "executable");
  fs.mkdirSync(executableDir, { recursive: true });

  const entryCppPath = path.join(executableDir, "jayess_main.cpp");
  const manifestPath = path.join(executableDir, "jayess_executable.json");

  fs.writeFileSync(
    entryCppPath,
    getMainSource({
      entryHeader,
      entryNamespace,
      awaitsResult: mainFunction.async
    }),
    "utf8"
  );
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        kind: "executable-project",
        entryHeader,
        entryNamespace,
        entryFunction: "main",
        nativeEntrypoint: "executable/jayess_main.cpp",
        awaitsResult: mainFunction.async
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  return [entryCppPath, manifestPath];
}

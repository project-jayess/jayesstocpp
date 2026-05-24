import { emitModule } from "../cpp/emit-module.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";
import { analyzeEscapes } from "../lifetime/analyze-escapes.js";
import { classifyImport } from "../modules/classify-import.js";
import { parse } from "../parser/parse.js";
import { createSourceText } from "../source/source-text.js";
import { analyzeModule } from "../semantic/analyze.js";

export function transpile(source, options = {}) {
  if (typeof source !== "string") {
    throw new TypeError("transpile(source, options) requires source to be a string");
  }

  const filename = options.filename ?? "<anonymous>";
  const sourceText = createSourceText(source, filename);
  const ast = parse(sourceText);
  const analysis = analyzeModule(ast, sourceText);

  const builtinImports = ast.body.filter(
    (statement) => statement.type === "ImportDeclaration" && classifyImport(statement.source).kind === "builtin-module"
  );
  if (builtinImports.length > 0) {
    throwDiagnostics(
      builtinImports.map((statement) =>
        createModuleDiagnostic(
          sourceText,
          statement,
          `Built-in Jayess module imports such as '${statement.source}' require transpileFile() or explicit resolver support; use transpileFile() when the closed module graph needs repository stdlib modules, because transpile() string mode does not resolve them by default`,
          statement.source
        )
      )
    );
  }

  const lifetime = analyzeEscapes(ast);
  const emitted = emitModule({
    ast,
    analysis,
    lifetime,
    moduleStem: options.moduleName ?? "anonymous_module",
    standalone: true
  });

  return emitted.cppSource;
}

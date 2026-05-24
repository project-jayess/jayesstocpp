export function emitModuleInit(lines, moduleStatements, context, emitStatement, nullValue) {
  lines.push("jayess::value jayess_module_init() {");
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  for (const statement of moduleStatements) {
    emitStatement(statement, { ...context, topLevel: true }, lines, 1);
  }
  lines.push(`  return ${nullValue};`);
  lines.push("}");
}

export function emitModuleInitAsync(lines) {
  lines.push("jayess::value jayess_module_init_async() {");
  lines.push("  return jayess::make_resolved_async(jayess_module_init());");
  lines.push("}");
}

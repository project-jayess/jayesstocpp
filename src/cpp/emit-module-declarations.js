import { toCppIdentifier } from "./cpp-identifiers.js";

export function emitFunctionDeclaration(name, target) {
  const cppName = toCppIdentifier(name);
  if (!target.standalone) {
    target.headerLines.push(`jayess::value ${cppName}(const std::vector<jayess::value>& jayess_args);`);
  }
}

export function emitExternValueDeclaration(name, target, options = {}) {
  const cppName = toCppIdentifier(name);
  const { includeStandalone = true } = options;
  if (target.standalone && includeStandalone) {
    target.standaloneDeclarations.push(`extern jayess::value ${cppName};`);
  }
  if (!target.standalone) {
    target.headerLines.push(`extern jayess::value ${cppName};`);
  }
}

export function emitGlobalValueDeclaration(name, init, target, options = {}) {
  const cppName = toCppIdentifier(name);
  emitExternValueDeclaration(name, target, options);
  target.globalLines.push(`jayess::value ${cppName} = ${init};`);
}

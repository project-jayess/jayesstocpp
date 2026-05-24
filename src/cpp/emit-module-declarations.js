export function emitFunctionDeclaration(name, target) {
  if (!target.standalone) {
    target.headerLines.push(`jayess::value ${name}(const std::vector<jayess::value>& jayess_args);`);
  }
}

export function emitExternValueDeclaration(name, target, options = {}) {
  const { includeStandalone = true } = options;
  if (target.standalone && includeStandalone) {
    target.standaloneDeclarations.push(`extern jayess::value ${name};`);
  }
  if (!target.standalone) {
    target.headerLines.push(`extern jayess::value ${name};`);
  }
}

export function emitGlobalValueDeclaration(name, init, target, options = {}) {
  emitExternValueDeclaration(name, target, options);
  target.globalLines.push(`jayess::value ${name} = ${init};`);
}

import { collectBindingIdentifiers } from "./binding-patterns.js";

export function collectParameterBindingIdentifiers(param) {
  return collectBindingIdentifiers(param.id);
}

export function collectParameterBindingNames(params) {
  return params.flatMap((param) => collectParameterBindingIdentifiers(param).map((identifier) => identifier.name));
}

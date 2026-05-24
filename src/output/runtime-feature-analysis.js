const builtinRuntimeFeatures = new Map([
  ["jayess:array", ["array"]],
  ["jayess:archive", ["archive"]],
  ["jayess:async", ["async-helpers"]],
  ["jayess:buffer", ["bytes"]],
  ["jayess:bytes", ["bytes"]],
  ["jayess:channel", ["channel"]],
  ["jayess:clipboard", ["clipboard"]],
  ["jayess:compress", ["compress"]],
  ["jayess:collections/map", ["map"]],
  ["jayess:collections/set", ["set"]],
  ["jayess:console", ["console"]],
  ["jayess:crypto", ["crypto"]],
  ["jayess:date", ["date"]],
  ["jayess:dialog", ["dialog"]],
  ["jayess:encoding", ["encoding"]],
  ["jayess:events", ["events"]],
  ["jayess:fs", ["fs"]],
  ["jayess:gpu", ["gpu"]],
  ["jayess:http", ["http"]],
  ["jayess:image", ["image"]],
  ["jayess:iter", ["iter"]],
  ["jayess:json", ["json"]],
  ["jayess:math", ["math"]],
  ["jayess:net", ["net"]],
  ["jayess:number", ["number"]],
  ["jayess:object", ["object"]],
  ["jayess:os", ["os"]],
  ["jayess:path", ["path"]],
  ["jayess:process", ["system"]],
  ["jayess:regex", ["regex"]],
  ["jayess:set", ["set"]],
  ["jayess:string", ["string"]],
  ["jayess:stream", ["stream"]],
  ["jayess:subprocess", ["subprocess"]],
  ["jayess:system", ["system"]],
  ["jayess:terminal", ["terminal"]],
  ["jayess:time", ["time"]],
  ["jayess:thread", ["thread"]],
  ["jayess:timers", ["async-helpers", "timers"]],
  ["jayess:url", ["url"]],
  ["jayess:validate", ["validate"]],
  ["jayess:watch", ["watch"]],
  ["jayess:window", ["window"]],
  ["jayess:workqueue", ["thread"]]
]);

const builtinStringMethodNames = new Set([
  "endsWith",
  "includes",
  "indexOf",
  "slice",
  "startsWith",
  "substring"
]);

function addFeatures(features, keys) {
  for (const key of keys) {
    features.add(key);
  }
}

function addImportFeatures(features, moduleRecord) {
  for (const dependency of moduleRecord.dependencies) {
    const keys = builtinRuntimeFeatures.get(dependency.source);
    if (keys != null) {
      addFeatures(features, keys);
    }
  }
}

function isBuiltinStringMethodCall(node) {
  return node.type === "CallExpression"
    && node.callee?.type === "MemberExpression"
    && !node.callee.computed
    && builtinStringMethodNames.has(node.callee.property?.name);
}

function addNodeFeatures(features, node) {
  if (node.async || node.type === "AwaitExpression") {
    features.add("async-core");
  }
  if (node.generator || node.type === "YieldExpression") {
    features.add("generator");
  }
  if (node.type === "ClassDeclaration") {
    features.add("class");
  }
  if (node.type === "PrivateIdentifier") {
    features.add("private");
  }
  if (isBuiltinStringMethodCall(node)) {
    features.add("string");
  }
}

function visitAstNode(node, features, seen) {
  if (node == null || typeof node !== "object" || seen.has(node)) {
    return;
  }
  seen.add(node);

  if (typeof node.type === "string") {
    addNodeFeatures(features, node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end" || key === "name" || key === "source" || key === "value" || key === "kind") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        visitAstNode(item, features, seen);
      }
      continue;
    }
    visitAstNode(value, features, seen);
  }
}

export function analyzeRuntimeFeatures(graph) {
  const features = new Set(["async-core"]);

  for (const moduleRecord of graph.modules) {
    addImportFeatures(features, moduleRecord);
    visitAstNode(moduleRecord.ast, features, new Set());
  }

  return [...features].sort();
}

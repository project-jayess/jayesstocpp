import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildModuleGraph } from "../../src/modules/module-graph.js";
import { analyzeReachableSymbols } from "../../src/modules/reachable-symbols.js";
import {
  shouldCopyNativeArtifact,
  shouldRetainModuleDependency,
  shouldWriteModule
} from "../../src/output/emitted-module-plan.js";
import { planEmittedModuleMetadata } from "../../src/output/module-metadata-plan.js";

function graphAndReachability(fixture) {
  const graph = buildModuleGraph(path.resolve(fixture));
  return {
    graph,
    reachableSymbols: analyzeReachableSymbols(graph)
  };
}

function moduleByBasename(graph, basename) {
  return graph.modules.find((moduleRecord) => path.basename(moduleRecord.filename) === basename);
}

test("output planning skips unreachable dependency modules", () => {
  const { graph, reachableSymbols } = graphAndReachability("test/fixtures/modules/fs-text-only-main.js");
  const streamModule = graph.modules.find((moduleRecord) => moduleRecord.filename.endsWith(path.join("stdlib", "jayess", "stream", "index.js")));
  assert.ok(streamModule);
  assert.equal(shouldWriteModule(streamModule, graph, reachableSymbols), false);

  const { metadata } = planEmittedModuleMetadata(graph, path.resolve("temp/output-planning-probe"), reachableSymbols);
  assert.equal(metadata.has(streamModule.filename), false);
});

test("output planning retains re-export-only modules that expose reachable aliases", () => {
  const { graph, reachableSymbols } = graphAndReachability("test/fixtures/modules/reexport-chain-consumer.js");
  const reexportChain = moduleByBasename(graph, "reexport-chain.js");
  const reexportNamed = moduleByBasename(graph, "reexport-named.js");
  assert.ok(reexportChain);
  assert.ok(reexportNamed);
  assert.equal(shouldWriteModule(reexportChain, graph, reachableSymbols), true);
  assert.equal(shouldWriteModule(reexportNamed, graph, reachableSymbols), true);
});

test("output planning keeps side-effect native artifacts and prunes unused named native artifacts", () => {
  const { graph, reachableSymbols } = graphAndReachability("test/fixtures/modules/reachable-native-main.js");
  const nativeLib = moduleByBasename(graph, "reachable-native-lib.js");
  const nativeHeader = nativeLib.dependencies.find((dependency) => dependency.kind === "native-header");
  assert.ok(nativeHeader);
  assert.equal(shouldCopyNativeArtifact(nativeLib, nativeHeader, reachableSymbols), false);

  const sideEffectArtifact = {
    kind: "native-source",
    source: "./native/math.cpp",
    specifiers: []
  };
  assert.equal(shouldCopyNativeArtifact(nativeLib, sideEffectArtifact, reachableSymbols), true);
});

test("output planning prunes module dependency edges not used by retained declarations", () => {
  const { graph, reachableSymbols } = graphAndReachability("test/fixtures/modules/fs-text-only-main.js");
  const fsModule = graph.modules.find((moduleRecord) => moduleRecord.filename.endsWith(path.join("stdlib", "jayess", "fs", "index.js")));
  const streamDependency = fsModule.dependencies.find((dependency) => dependency.source === "jayess:stream");
  assert.ok(streamDependency);
  assert.equal(shouldRetainModuleDependency(fsModule, streamDependency, reachableSymbols), false);
});

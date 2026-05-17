export const transpileSnapshotCases = [
  {
    name: "simple-function",
    moduleName: "snapshot_simple_function",
    source: "function add(a, b) { return a + b; }"
  },
  {
    name: "conditional-string-import",
    moduleName: "snapshot_conditional_string_import",
    source: 'import "cpp:string"; function label(x) { if (x) { return "yes"; } return "no"; }'
  }
];

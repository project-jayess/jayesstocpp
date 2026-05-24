# Parser Organization

The Jayess parser keeps `src/parser/parse.js` as the orchestration layer and moves focused parsing responsibilities into helper factories.

Current focused helpers include:

- `src/parser/binding-patterns.js` for declaration, parameter, and assignment binding-pattern shapes.
- `src/parser/classes.js` for class member parsing.
- `src/parser/expressions.js` for expression precedence, assignment expressions, calls, members, literals, arrows, `new`, optional chaining, and spread elements in expression containers.
- `src/parser/functions.js` for function and arrow parameter lists.
- `src/parser/import-export.js` for module import and export declarations.
- `src/parser/statements.js` for statement dispatch, declarations, loops, switch, try/catch/finally, throw, return, break, continue, and blocks.

Helper factories receive narrow parser callbacks such as `advance`, `expect`, `match`, and selected recursive entry points. They should preserve AST node shapes from `src/ast/nodes.js` and keep syntax diagnostics aligned with `Jayess.md` and `Agents.md`.

When adding parser behavior:

- keep unsupported-by-design diagnostics in the parsing path when syntax must be rejected early
- prefer adding a focused helper or extending the matching helper over growing `parse.js`
- preserve recursive entry points such as `parseExpression`, `parseAssignment`, and `parseCallExpression` when other parser helpers depend on them
- add parser organization tests for extracted helper boundaries

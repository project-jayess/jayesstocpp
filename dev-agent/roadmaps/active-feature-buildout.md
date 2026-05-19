# Active Feature Buildout Policy

The active roadmap tracks implementation progress only.

AI agents must not add roadmap tasks whose purpose is only to decide what to do, decide whether to support something, or defer something. AI agents must not remove feature work from the roadmap by marking it as postponed.

The only source of truth for Jayess language non-goals and unsupported-by-design behavior is:

- [Jayess.md](../Jayess.md)
- [Agents.md](../Agents.md)

## Build Slice Shape

Each active feature slice should implement:

- one narrow user-visible surface
- the parser and AST work required for that surface, if any
- semantic diagnostics required by `Jayess.md` and `Agents.md`
- the smallest runtime or module primitive layer needed
- focused C++ lowering changes only where required
- tests under `test/`
- documentation under `docs/`

## Current Priorities

The active roadmap should describe concrete build progress:

- regex flags through `jayess:regex`
- one generator follow-up slice
- one async follow-up slice
- one class-system follow-up slice
- one system-module follow-up slice

Checklist entries should name work to build, test, and document. They should not include explanations of why other work is not being built.

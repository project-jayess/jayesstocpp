# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler.

Completed milestones through section 378 were moved to [archived-checklist.md](./archived-checklist.md) to keep the working checklist small and focused.

## Active Buildout Rule

The active checklist tracks implementation progress only.

The language boundaries are defined by [Jayess.md](./Jayess.md) and [Agents.md](./Agents.md).

Each active slice should:

- implement one narrow user-visible feature surface
- add only the parser, semantic, runtime, module, lowering, and docs work that the feature actually needs
- keep source files and tests small and focused
- place tests under `test/`
- place documentation under `docs/`
- keep diagnostics aligned with `Jayess.md` and `Agents.md`

## Active Items

No active unchecked items.

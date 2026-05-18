# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler.

Completed milestones through section 105 were moved to [archived-checklist.md](./archived-checklist.md) to keep the working checklist small and focused.

## 106. Regex Expansion

- [ ] Define the next approved `jayess:regex` slice explicitly: replacement helpers, flags policy, literal-syntax policy, and result-shape policy as separate tasks.
- [ ] Decide whether the next regex slice stays module-only or adds any parser syntax at all.
- [ ] Add only the primitive/runtime support needed for the next approved regex helper family.
- [ ] Implement the next approved `jayess:regex` helpers in Jayess source where practical.
- [ ] Add semantic diagnostics for unsupported ambient/global regex forms that still remain outside the approved slice.
- [ ] Add API, runtime, module-resolution, and compile-validation tests for the next regex slice.
- [ ] Update regex docs after the next slice lands.

## 107. Generator Follow-Up

- [ ] Define whether generator methods are the next approved generator slice or remain deferred.
- [ ] Define the next approved broader `yield` positions explicitly instead of leaving them as a vague later bucket.
- [ ] Define whether `yield` inside `try` / `catch` / `finally` belongs in the next slice or remains deferred.
- [ ] Add AST/parser support only for the approved next generator forms.
- [ ] Extend semantic analysis so `yield` legality and diagnostics match the approved next generator contexts exactly.
- [ ] Extend generator lowering/runtime only for the approved next `yield` positions, keeping one generator-frame model.
- [ ] Add parser, semantic, runtime, and compile-validation tests for each generator follow-up sub-slice.
- [ ] Update generator docs after the next follow-up slice lands.

## 108. Async Follow-Up

- [ ] Define whether async methods are the next approved async class-model slice or remain deferred.
- [ ] Define whether `await` inside `try` / `catch` / `finally` needs a broader explicit async-lowering slice.
- [ ] Define whether any module-level async initialization work becomes active or remains deferred with top-level `await` unsupported.
- [ ] Add AST/parser support only for the approved next async forms.
- [ ] Extend semantic and lifetime analysis only where the approved next async slice requires it.
- [ ] Extend async lowering/runtime only where the approved next async slice requires it, without creating a second async-result model.
- [ ] Add parser, semantic, runtime, and compile-validation tests for the next async follow-up slice.
- [ ] Update async docs after the next follow-up slice lands.

## 109. Standard-Library Breadth: Arrays, Strings, Numbers, And Objects

- [ ] Define the next approved array helper family explicitly instead of broad “more array methods”.
- [ ] Define the next approved string helper family explicitly instead of broad “more string methods”.
- [ ] Define the next approved `jayess:number` helper family explicitly instead of ambient/global numeric growth.
- [ ] Define the next approved `jayess:object` helper family explicitly instead of broad `Object.*` compatibility.
- [ ] Add the approved next array runtime/module helpers one family at a time.
- [ ] Add the approved next string runtime/module helpers one family at a time.
- [ ] Add the approved next number runtime/module helpers one family at a time.
- [ ] Add the approved next object runtime/module helpers one family at a time.
- [ ] Extend semantic diagnostics for still-unsupported built-in names and methods.
- [ ] Add API, runtime, module-resolution, and compile-validation tests for each built-in family slice separately.
- [ ] Update stdlib docs after each family slice lands.

## 110. Built-In Modules Follow-Up: Date, JSON, Map, And Set

- [ ] Define the next approved `jayess:date` slice explicitly: formatting expansion, parsing expansion, arithmetic helpers, and timezone policy as separate tasks.
- [ ] Define the next approved `jayess:json` slice explicitly: replacement/transform policy, richer validation, and formatting helpers as separate tasks.
- [ ] Define the next approved `jayess:collections/map` slice explicitly: bulk construction, bulk updates, and iteration/data helpers as separate tasks.
- [ ] Define the next approved `jayess:collections/set` slice explicitly: bulk construction, pure set operations, and iteration/data helpers as separate tasks.
- [ ] Add only the primitive/runtime support needed for the approved next built-in-module helpers.
- [ ] Implement the approved next module-level helpers in Jayess source where practical.
- [ ] Add API, runtime, module-resolution, and compile-validation tests for each new built-in-module slice separately.
- [ ] Update built-in module docs after each next slice lands.

## 111. System Modules Follow-Up

- [ ] Define whether `jayess:os`, `jayess:url`, or `jayess:timers` becomes the next approved system-module slice.
- [ ] Define the next approved `jayess:fs` helper family explicitly beyond the current file/list/stat slice.
- [ ] Define the next approved `jayess:path` helper family explicitly beyond the current path-shaping slice.
- [ ] Define the next approved `jayess:process` helper family explicitly, keeping env mutation and subprocess policy separate.
- [ ] Add only the minimal native adapter primitives needed for the approved next system-module slice.
- [ ] Implement the approved next Jayess system-module wrappers in Jayess source where practical.
- [ ] Keep unsupported raw `node:*` and non-approved host APIs rejected with focused diagnostics.
- [ ] Add module-resolution, API, runtime, and compile-validation tests for each next system-module slice separately.
- [ ] Update system-module docs after each next slice lands.

## 112. Class System And Inheritance Follow-Up

- [ ] Define whether private static fields are the next approved private-member slice or remain deferred.
- [ ] Define whether private static methods are approved separately from private static fields.
- [ ] Define whether static inheritance becomes an active approved slice or remains deferred.
- [ ] Define whether any broader `super` forms become active approved slices or remain deferred.
- [ ] Add AST/parser support only for the approved next class-system forms.
- [ ] Extend semantic analysis only for the approved next private/class/inheritance slice.
- [ ] Extend runtime/class-model support only for the approved next forms, keeping one class-chain model.
- [ ] Extend lowering only for the approved next forms without broadening unrelated class behavior.
- [ ] Add parser, semantic, runtime, and compile-validation tests for each class follow-up slice separately.
- [ ] Update class-model docs after each next slice lands.

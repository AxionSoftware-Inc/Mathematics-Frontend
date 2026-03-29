# Laboratory Module Authoring Guide (2026 Refresh)

This guide supersedes the older integral-first notes. It matches the current laboratory architecture after the Integral Studio refactor, the shared header/template standardization, view split, diagnostics v2 work, and geometry lane additions.

## Goal

Add a new large module such as `differential-studio`, `matrix-workbench`, or `tensor-lab` without rebuilding:

- workspace shell
- header and tab strip
- stale-result handling
- audit and signal cards
- report/export flow
- visualizer shell
- saved scenario and annotation flow

The new module should plug into the laboratory system, not fork it.

## Current architecture

The recommended module shape is:

```text
<slug>.tsx
<slug>/types.ts
<slug>/constants.ts
<slug>/utils.ts
<slug>/presentation-types.ts
<slug>/use-<slug>.ts
<slug>/services/
  math-service.ts
  solve-service.ts
  classification-service.ts
  visualization-service.ts      // optional
<slug>/components/
  solver-control.tsx
  visualizer-deck.tsx
  studio-header-bar.tsx         // thin wrapper around the shared header
  studio-status-bar.tsx         // optional, if custom
  trust-panel.tsx
  annotation-panel.tsx
  scenario-panel.tsx
<slug>/views/
  solve-view.tsx
  visualize-view.tsx
  compare-view.tsx
  report-view.tsx
```

The important rule:

- top-level module file orchestrates
- hook owns state and actions
- services own math, API, and classification
- views compose sections
- components stay small and reusable

## Shared building blocks you should reuse

Use these before creating anything custom.

- [workspace-shell.tsx](/D:/Complete/Mathematics/Front/components/laboratory/workspace-shell.tsx)
- [module-registry.tsx](/D:/Complete/Mathematics/Front/components/laboratory/module-registry.tsx)
- [laboratory-catalog.ts](/D:/Complete/Mathematics/Front/lib/laboratory-catalog.ts)
- [laboratory-studio-header.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-studio-header.tsx)
- [laboratory-template-catalog.ts](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-template-catalog.ts)
- [laboratory-metric-card.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-metric-card.tsx)
- [laboratory-signal-panel.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-signal-panel.tsx)
- [laboratory-data-table.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-data-table.tsx)
- [laboratory-math-panel.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-math-panel.tsx)
- [laboratory-result-levels-panel.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-result-levels-panel.tsx)
- [laboratory-solve-detail-card.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-solve-detail-card.tsx)
- [cartesian-plot.tsx](/D:/Complete/Mathematics/Front/components/laboratory/cartesian-plot.tsx)
- [scientific-plot.tsx](/D:/Complete/Mathematics/Front/components/laboratory/scientific-plot.tsx)
- [use-persisted-lab-collection.ts](/D:/Complete/Mathematics/Front/components/laboratory/use-persisted-lab-collection.ts)
- [use-laboratory-writer-bridge.ts](/D:/Complete/Mathematics/Front/components/live-writer-bridge/use-laboratory-writer-bridge.ts)

## Shared header and template standard

New modules should not invent their own top bar or preset popover.

- Use [laboratory-studio-header.tsx](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-studio-header.tsx) as the default top bar.
- Keep `studio-header-bar.tsx` as a thin adapter that maps module state into the shared header props.
- Register presets and workflow templates in [laboratory-template-catalog.ts](/D:/Complete/Mathematics/Front/components/laboratory/laboratory-template-catalog.ts) and the module `constants.ts` file.
- Keep template lists compact. The current standard is a curated set, not a zoo of demos.
- Let the shared template panel control width, dismissal, and active/recommended states instead of reimplementing popover behavior per module.

## Mandatory state model

Every serious module must separate:

1. `current input`
2. `solved snapshot`
3. `numerical snapshot`
4. `preview visualization`

Minimum state shape:

- `currentRequest`
- `solvedRequest`
- `numericalRequest`
- `solvePhase`
- `analyticSolution`
- `isResultStale`
- `previewVisualization`

If a module skips this, it will reintroduce the stale-result bug.

## Service split rules

### `math-service.ts`

Use for:

- deterministic client-side approximations
- lightweight preview data
- sample tables
- sensitivity sweep helpers

Do not put:

- fetch calls
- JSX logic
- report copy

### `solve-service.ts`

Use for:

- backend requests
- payload normalization
- error mapping

Do not put:

- local numerical math
- UI branching

### `classification-service.ts`

Use for:

- routing between families
- graceful unsupported or partial states
- lane detection

This is now mandatory for any module with multiple mathematical families.

### `visualization-service.ts`

Optional, but recommended when:

- the visualizer needs datasets that differ from solver payloads
- geometry, graph, tensor, or matrix objects need plot-ready transforms

## UI composition standard

Each module should still map into:

- `Solve`
- `Visualize`
- `Compare`
- `Report`

Suggested content:

### Solve

- composer
- exact or primary result
- assumptions
- method audit
- runtime signals
- primary visual

### Visualize

- visual deck
- computed tables
- sample tables
- sensitivity sweep

### Compare

- trust
- risk register
- scenario library
- method comparison

### Report

- executive cards
- export packet
- skeleton markdown
- annotations
- writer/live bridge

## Registration checklist

### 1. Catalog

Add metadata to:

- [laboratory-catalog.ts](/D:/Complete/Mathematics/Front/lib/laboratory-catalog.ts)

### 2. Registry

Register UI in:

- [module-registry.tsx](/D:/Complete/Mathematics/Front/components/laboratory/module-registry.tsx)

### 3. Backend

If hybrid or symbolic work is needed:

- add backend routes
- add serializers
- add solver lanes or services
- add tests before UI polish

## Recommended build order for a new big module

### Matrix example

1. classification service
2. core types
3. math-service for local matrix ops
4. solve-service for symbolic or exact backend work
5. composer
6. shared header wrapper + template catalog entries
7. solve view
8. visual deck
9. compare and report

Possible lanes:

- determinant
- inverse
- eigensystem
- decompositions
- linear system solve
- tensor-like block structures

### Differential example

1. classification service
2. local numeric derivative and slope helpers
3. symbolic derivative backend
4. shared header wrapper + compact preset/workflow catalog
5. tangent and slope-field visualizer
6. compare symbolic vs numeric
7. report/export

Possible lanes:

- derivative
- partial derivative
- Jacobian
- Hessian
- ODE starter lane

## Definition of done

A module is not done unless:

- it is registered and cataloged
- it has a stable walkthrough preset
- stale-result handling works
- audit cards use real computed data
- `solve/visualize/compare/report` all work
- writer bridge works
- shared header and template panel are used unless there is a proven product reason not to
- local tests and type-check pass
- unsupported families fail gracefully instead of pretending to solve

## Important warning

Do not copy Integral Studio line-for-line.

Copy the pattern:

- state in hook
- render in views
- diagnostics from services
- cards from structured payloads

That pattern is reusable. The integral-specific math is not.

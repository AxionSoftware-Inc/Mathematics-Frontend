# Laboratory Module Authoring Guide

This guide defines how to add a new laboratory workspace such as `differential-studio` without rebuilding the shell, audit, visualization, or export system from scratch.

## Goal

Each new module should reuse the existing laboratory foundation:

- workspace shell
- module registry
- shared metric, signal, table, and markdown cards
- plot components
- notebook / persisted collections
- writer bridge / live bridge

The module-specific code should be limited to:

- math domain types
- solver services
- module state hook
- module-specific composer and analysis panels

## Current reusable building blocks

Use these shared components before creating anything new.

- `D:/Complete/Mathematics/Front/components/laboratory/workspace-shell.tsx`
  - outer shell, module switcher, header, lab engine provider
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-metric-card.tsx`
  - compact audit / summary cards
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-signal-panel.tsx`
  - validation, warnings, runtime diagnostics
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-data-table.tsx`
  - metrics, samples, sweep tables
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-math-panel.tsx`
  - markdown / LaTeX explanation panels
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-result-levels-panel.tsx`
  - quick / technical / research interpretation
- `D:/Complete/Mathematics/Front/components/laboratory/laboratory-solve-detail-card.tsx`
  - step or derivation cards
- `D:/Complete/Mathematics/Front/components/laboratory/cartesian-plot.tsx`
  - 2D plots
- `D:/Complete/Mathematics/Front/components/laboratory/scientific-plot.tsx`
  - surface, volume, scatter3d style plots
- `D:/Complete/Mathematics/Front/components/laboratory/lab-engine.tsx`
  - shared dataset / plotting context
- `D:/Complete/Mathematics/Front/components/laboratory/use-persisted-lab-collection.ts`
  - saved scenarios, annotations
- `D:/Complete/Mathematics/Front/components/live-writer-bridge/use-laboratory-writer-bridge.ts`
  - copy, writer send, live push

## Required file structure for a new module

Create a new folder:

`D:/Complete/Mathematics/Front/components/laboratory/modules/<slug>/`

Recommended layout:

```text
<slug>.tsx                          // top-level module component
<slug>/types.ts                     // domain types
<slug>/constants.ts                 // presets, templates, tabs
<slug>/utils.ts                     // markdown builders, helpers
<slug>/use-<slug>.ts                // main state hook
<slug>/services/
  math-service.ts                   // client-side computation helpers
  solve-service.ts                  // backend exact / hybrid requests
  visualization-service.ts          // optional shape / dataset builders
<slug>/components/
  solver-control.tsx                // input composer
  visualizer-deck.tsx               // plots and visual cards
  trust-panel.tsx                   // trust / diagnostics UI
  scenario-panel.tsx                // saved scenarios
  annotation-panel.tsx              // notes
```

## Registration steps

### 1. Add catalog metadata

Edit:

`D:/Complete/Mathematics/Front/lib/laboratory-catalog.ts`

Add a new entry to `laboratoryModuleCatalog`.

Minimum fields:

- `slug`
- `title`
- `summary`
- `description`
- `category`
- `icon_name`
- `accent_color`
- `computation_mode`
- `estimated_minutes`
- `sort_order`

This file drives:

- fallback module loading
- allowed module slugs
- future expansion of the laboratory list

### 2. Register the module UI

Edit:

`D:/Complete/Mathematics/Front/components/laboratory/module-registry.tsx`

Add:

```ts
"differential-studio": defineLaboratoryModule({
  component: DifferentialStudioModule,
  capabilities: [
    "Symbolic derivative checks",
    "Numerical slope verification",
    "Phase-space visualizer",
    "Comparison and report flow",
  ],
  analysisTabs: ["solve", "visualize", "compare", "report"],
}),
```

### 3. Backend API

If the module needs hybrid/server support, add matching backend routes and a local `solve-service.ts`.

Rule:

- backend should return clean result objects
- frontend should build UX summaries from those result objects
- do not hardcode backend payload logic inside random components

## State architecture rule

Each module hook should separate 3 concepts:

1. `current input`
2. `solved snapshot`
3. `preview visualization`

This is critical. It prevents the stale-result bug where a user edits the formula but old metrics remain pretending to belong to the new input.

Recommended state pattern:

- `currentRequest`
- `solvedRequest`
- `numericalRequest`
- `isResultStale`
- `solvePhase`
- `analyticSolution`
- `previewVisualization`

## Service architecture rule

For each module, keep services split by responsibility:

- `math-service.ts`
  - pure deterministic client computations
  - no React state
  - no UI strings unless they are actual solver errors
- `solve-service.ts`
  - backend requests only
  - normalize payloads
  - no component logic
- `visualization-service.ts`
  - optional
  - convert summaries into plot-ready datasets if needed

Do not merge API calls, math logic, and JSX decisions into one file.

## UI composition rule

Keep the module page assembled from reusable slices:

- `Solve`
  - composer
  - result / derivation
  - method audit
  - assumptions
  - runtime signals
  - primary visual
- `Visualize`
  - visual deck
  - computation audit table
  - sample table
  - sweep / sensitivity
- `Compare`
  - compare summary
  - trust panel
  - risk register
  - method snapshot
  - scenario library
- `Report`
  - executive cards
  - export packet
  - markdown skeleton
  - annotations
  - live bridge

This pattern is already implemented by `integral-studio` and should be copied structurally, not duplicated line-for-line.

## Differential Studio example

If you add `differential-studio`, map the shared structure like this:

- `solver-control.tsx`
  - input function, variable, point / interval
- `math-service.ts`
  - finite difference, symbolic derivative helpers, slope field preparation
- `visualizer-deck.tsx`
  - function curve, derivative curve, tangent line, slope field
- `compare`
  - symbolic derivative vs numerical derivative
  - step size sensitivity
  - singularity / non-differentiability risks
- `report`
  - derivative result
  - assumptions
  - method audit
  - notes and export

## Definition of done for a new module

A module is not complete unless all of these are true:

- it is listed in `laboratory-catalog.ts`
- it is registered in `module-registry.tsx`
- it opens inside `workspace-shell.tsx`
- it supports stale-result separation
- it exposes method audit cards from real computed data
- it has at least one valid default walkthrough case
- it supports `solve`, `visualize`, `compare`, `report`
- it exports through writer bridge
- it has build and test coverage at least equal to the integral workspace baseline

## Practical checklist

When adding a new module:

1. Create the module folder and state hook.
2. Add one stable default walkthrough case.
3. Implement pure `math-service.ts`.
4. Implement `solve-service.ts` if backend is needed.
5. Register the module in `module-registry.tsx`.
6. Add metadata to `laboratory-catalog.ts`.
7. Reuse shared cards, tables, signals, and plot components first.
8. Add stale-result handling before polishing the UI.
9. Verify `solve`, `visualize`, `compare`, and `report`.
10. Run tests and production build.

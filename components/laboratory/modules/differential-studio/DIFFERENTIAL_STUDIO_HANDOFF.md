# Differential Studio Handoff

## Scope

Differential Studio is no longer a simple derivative demo. It is now a multi-lane differential analysis workspace with:

- ordinary derivative
- higher-order derivative
- partial / gradient
- directional derivative
- jacobian
- hessian
- ODE lane
- PDE lane
- SDE lane

The module is now strong enough to serve as the reference architecture for future differential-family expansion, but it is not mathematically final.

## Current Architecture

### Frontend entry / orchestration

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio.tsx`
  Thin shell for tab selection, header, preset apply, and status bar.

### Core hook / state

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/use-differential-studio.ts`
  Central router for:
  - current request
  - classification
  - analytic solve requests
  - numerical fallback summaries
  - compare/report cards
  - trust/scenario/annotation state

### Input / composer

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/components/solver-control.tsx`
  Mode-aware composer for all currently supported families.

### Visual layer

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/components/visualizer-deck.tsx`
  Lane-aware visual adapter.

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/components/matrix-result-panel.tsx`
  Dedicated matrix-first presentation for Jacobian / Hessian.

### Views

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/views/solve-view.tsx`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/views/visualize-view.tsx`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/views/compare-view.tsx`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/views/report-view.tsx`

### Frontend services

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/classification-service.ts`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/math-service.ts`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/solve-service.ts`
- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/presentation-service.ts`

### Backend router / lanes

- `/D:/Complete/Mathematics/backend/laboratory/differential_solver.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_common.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_derivative.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_gradient.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_jacobian.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_hessian.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_ode.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_pde.py`
- `/D:/Complete/Mathematics/backend/laboratory/differential_lane_sde.py`

## What Is Implemented Now

### 1. Ordinary differential analysis

Status: strong

Implemented:

- symbolic derivative lane
- higher-order derivative lane
- numerical fallback
- tangent line visualization
- step sweep
- compare/report integration

### 2. Multi-variable local differential analysis

Status: strong

Implemented:

- partial / gradient lane
- directional derivative lane
- jacobian lane
- hessian lane
- matrix diagnostics
- 2D field map
- 3D surface + tangent plane
- matrix-first solve and visualize panels

### 3. ODE lane

Status: working `v1`

Implemented:

- symbolic ODE solve via `SymPy dsolve`
- initial-condition parsing for common cases
- compare/report cards now read lane metadata
- visualizer:
  - slope field
  - RK-style trajectory preview

Expected syntax:

- `y' = y; y(0)=1`
- `y'' + y = 0; y(0)=0; y'(0)=1`

Limitations:

- not universal
- only families that `dsolve` can handle well
- no phase portrait family yet
- no BVP-specific dedicated lane yet

### 4. PDE lane

Status: working `v1`

Implemented:

- symbolic PDE solve via `SymPy pdsolve` for supported families
- compare/report lane support
- visualizer:
  - space-time heatmap
  - space-time surface

Expected syntax:

- `u_t = u_x`
- `u_t = k*u_xx`

Limitations:

- limited symbolic families only
- no mesh/boundary-condition engine yet
- no general PDE numeric solver yet
- current PDE visuals are family-aware approximations, not full numerical PDE infrastructure

### 5. SDE lane

Status: working `v1`

Implemented:

- Euler-Maruyama sample-path lane
- fixed-seed reproducibility
- report/compare support
- sample-path visualizer

Expected syntax:

- `dX = 0.4*X*dt + 0.2*X*dW; X(0)=1; t:[0,1]; n=200`

Limitations:

- single-path only
- no ensemble statistics
- no Milstein / higher-order stochastic schemes
- no distribution heatmap / confidence band yet

## Family Readiness Matrix

### Fully useful now

- derivative
- higher-order derivative
- partial / gradient
- directional
- jacobian
- hessian

### Real but still early

- ODE
- PDE
- SDE

### Not implemented yet

- implicit differential geometry
- variational calculus
- tensor calculus
- differential forms
- phase portrait / stability basin family
- general PDE mesh solvers
- stochastic ensemble inference

## Compare Tab Status

Current status: good for core lanes, partial for advanced lanes.

What is real:

- trust score
- risk register
- scenario snapshots
- method audit
- `h`-sweep for derivative / partial / directional
- matrix lane diagnostics
- ODE/PDE/SDE lane interpretation cards

What is still missing:

- ODE compare across integrators
- PDE compare across discretizations
- SDE compare across ensemble paths / timestep schedules
- cross-method benchmarking

## Report Tab Status

Current status: strong for a research draft workflow, not final export-grade.

What is real:

- report executive cards
- markdown skeleton
- symbolic taxonomy
- domain/diagnostics notes
- matrix diagnostics
- ODE/PDE/SDE lane-specific report sections

What is still missing:

- article-grade LaTeX export
- appendix-quality solver logs
- figure/table auto-packaging
- citation-ready computational appendix
- structured research packet export

## Technical Debt

### 1. Hook is still too large

File:

- `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/use-differential-studio.ts`

Problem:

- contains solver routing
- trust state
- compare/report card derivation
- stale-result policy
- scenario state
- annotation state

Recommended refactor:

- split lane view-models into separate service files
- move compare/report card builders to presentation services

Current status:

- partially completed
- compare/report/trust builders have started moving into `services/presentation-service.ts`
- hook orchestration is cleaner, but method table shaping and scenario/annotation state still live in the hook

Next cut:

- move `methodTableRows` and `sampleTableRows` into the presentation service
- keep `use-differential-studio.ts` focused on state, actions, and stale-result handling

### 2. ODE/PDE/SDE visuals are `v1` approximations

Problem:

- ODE visual is useful but not yet a full dynamical-systems visual layer
- PDE visual is currently family-specific approximation
- SDE visual is only a single seeded path

Recommended next step:

- ODE: phase portrait, nullclines, stability classification
- PDE: mesh-based numeric solver lane
- SDE: ensemble paths, mean/std bands, histogram snapshots

### 3. Specialized family summaries are still analytic-first

Problem:

- ODE/PDE/SDE do not produce unified frontend `summary` objects like derivative/gradient families do
- compare/report currently rely on `analyticSolution` fallback for these lanes

Recommended next step:

- introduce:
  - `ODESummary`
  - `PDESummary`
  - `SDESummary`
- make these first-class members of `DifferentialComputationSummary`

### 4. Solver syntax is still narrow

Problem:

- ODE/PDE/SDE lanes need structured user syntax
- natural-language or loose symbolic text is not robustly supported

Recommended next step:

- add lane-specific builders/forms
- add parser tests for alternative shorthands

### 5. Differential domain engine is better, but not final

Problem:

- current domain engine covers logs, inverse trig, roots, poles, non-smooth signals
- advanced family-specific domains are still thin

Need later:

- ODE singular point classification
- PDE boundary / initial condition diagnostics
- SDE positivity / explosion diagnostics
- geometry-family manifold constraints

## How To Add A New Differential Family

Use this order:

1. Add a new frontend mode if the family deserves its own composer lane.
2. Add classifier support in:
   - `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/classification-service.ts`
3. Add backend solver lane:
   - create `differential_lane_<family>.py`
   - route it in `/D:/Complete/Mathematics/backend/laboratory/differential_solver.py`
4. Add presets/templates in:
   - `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/constants.ts`
   - `/D:/Complete/Mathematics/Front/components/laboratory/laboratory-template-catalog.ts`
5. Add visual branch in:
   - `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/components/visualizer-deck.tsx`
6. Extend compare/report cards in:
   - `/D:/Complete/Mathematics/Front/components/laboratory/modules/differential-studio/services/presentation-service.ts`
7. Add backend tests in:
   - `/D:/Complete/Mathematics/backend/laboratory/tests.py`

## UI Standard Status

Implemented:

- Differential Studio now uses the shared laboratory top bar through its header wrapper
- differential presets/workflows now feed the centralized laboratory template catalog
- the old long template list was reduced to a compact curated set

Rule going forward:

- future differential lanes should register through the shared header/template system first, not through module-local popovers

## Recommended Next Families

### High-value next

- phase portrait / dynamical systems family
- PDE numeric solver family
- stochastic ensemble family

### Research-tier after that

- implicit geometry lane
- variational calculus lane
- tensor / differential forms lane

## Definition Of Done For A New Family

A family is only considered complete when it has all of these:

- solver lane
- presets/templates
- composer guidance
- dedicated visualizer branch
- compare interpretation
- report export section
- diagnostics / domain assumptions
- tests

## Validation Notes

Frontend validation that should pass after edits:

- `npx tsc --noEmit`
- `npx vitest run --pool threads`

Backend validation:

- lane smoke tests with backend venv
- `manage.py test laboratory --keepdb --noinput` when Postgres is available

Current known local blocker:

- local PostgreSQL at `127.0.0.1:5432` may be unavailable, which blocks full Django test runs even when Python lane code is valid.

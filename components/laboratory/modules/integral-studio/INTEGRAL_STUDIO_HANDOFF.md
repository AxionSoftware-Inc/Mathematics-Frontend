# Integral Studio Handoff

This file records the current shipped state of Integral Studio, what was added, and what remains as explicit debt.

## Current scope

Integral Studio is now a serious multi-lane analysis workspace, not a simple definite-integral calculator.

Supported families:

- single definite integrals
- single indefinite integrals
- improper integrals with infinite bounds
- improper integrals with endpoint singularity
- double definite integrals
- triple definite integrals
- structured line integrals
- structured surface integrals
- structured contour integrals

## What was added

### Core architecture

- top-level module split into view slices
- stale-result separation between current input and solved snapshot
- compact shared header and status bar
- reusable solve, visualize, compare, report views

Key files:

- [integral-studio.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio.tsx)
- [use-integral-studio.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/use-integral-studio.ts)
- [solve-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/views/solve-view.tsx)
- [visualize-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/views/visualize-view.tsx)
- [compare-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/views/compare-view.tsx)
- [report-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/views/report-view.tsx)

### Solver lanes

Backend lanes are no longer monolithic:

- [integral_lane_definite.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_definite.py)
- [integral_lane_indefinite.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_indefinite.py)
- [integral_lane_improper.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_improper.py)
- [integral_lane_line.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_line.py)
- [integral_lane_surface.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_surface.py)
- [integral_lane_contour.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_contour.py)
- [integral_lane_geometry.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_geometry.py)
- [integral_solver.py](/D:/Complete/Mathematics/backend/laboratory/integral_solver.py)

### Classification and routing

- family classifier exists on frontend
- unsupported free-form geometry expressions fail gracefully
- structured geometry syntax routes to real backend lanes

Key file:

- [classification-service.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/services/classification-service.ts)

### Diagnostics v2

Diagnostics are now structured instead of string-only:

- convergence
- convergence reason
- singularity
- domain constraints
- domain blockers
- hazard details
- piecewise source and branches

Key files:

- [integral_lane_common.py](/D:/Complete/Mathematics/backend/laboratory/integral_lane_common.py)
- [types.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/types.ts)

### Piecewise and assumptions

Current v2 logic can detect:

- `Abs`
- `sign`
- `Piecewise`
- `Max`
- `Min`
- denominator blockers
- log-domain constraints
- even-root constraints

### Geometry composer

Structured geometry syntax no longer has to be typed manually.

UI now includes:

- line 2D or 3D builder
- surface orientation toggle
- contour preset paths
- lightweight geometry preview

Key files:

- [geometry-lane-builder.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/components/geometry-lane-builder.tsx)
- [geometry-lane-service.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/services/geometry-lane-service.ts)

## Current templates

Templates now include real geometry-family presets:

- line circulation
- surface flux
- contour path
- improper singularity
- infinite tail
- indefinite primitive

Key file:

- [constants.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/integral-studio/constants.ts)

## Current limitations

These are the real remaining debts.

### Math debt

- geometry lanes use structured syntax, not free natural mathematical notation
- contour lane does not yet perform residue theorem analysis
- line and surface lanes do not yet support multiple patch or multi-segment compositions
- assumptions engine is still practical, not formal proof-grade
- convergence analysis is strong enough for workflow audit, not theorem-grade certification

### Visualization debt

- geometry lanes have lightweight preview cards, not true path/surface/complex-plane plotting
- contour lane lacks complex-plane visual trace
- line 3D and surface patch previews are not yet rendered as actual geometric objects

### Symbolic depth debt

- piecewise engine is still heuristic-first
- domain reasoning is not a full symbolic assumption solver
- certificate or proof artifact generation does not exist

### UX debt

- geometry builder is usable, but still technical
- free-form geometry text and builder state are synced through the expression string, not a separate normalized model
- `Beginner / Advanced / Research` still is not a full capability-gating system

## Tests currently expected to pass

- frontend type-check
- frontend vitest suite
- backend laboratory test suite

Primary commands:

- `cmd /c npx tsc --noEmit`
- `cmd /c npx vitest run --pool threads`
- `D:\Complete\Mathematics\backend\venv\Scripts\python.exe manage.py test laboratory --keepdb --noinput`

## Recommended next steps if Integral Studio is reopened later

1. true geometry plotting for line, surface, contour
2. contour residue analysis
3. multi-segment path and multi-patch support
4. stronger symbolic assumptions engine
5. proof-grade diagnostics and certificate output

## What "mathematically final" would still require

This section is intentionally more explicit. The current studio is strong enough as a product workspace, but it is not yet a mathematically final universal integral engine.

### 1. Formal assumptions and domain engine

Current state:

- practical diagnostics
- symbolic blockers for common cases
- useful audit output

Missing for final state:

- full symbolic assumption propagation
- branch-cut aware reasoning
- domain intersection between integrand, bounds, and coordinate transform
- explicit allowed/disallowed parameter regions
- reusable assumption objects across all integral families

Likely work:

- new backend symbolic domain service
- richer diagnostics schema
- frontend assumption inspector

Estimated size:

- backend: 700 to 1200 lines
- frontend: 250 to 450 lines

### 2. Theorem-grade convergence engine

Current state:

- convergent / divergent / unresolved signaling
- useful improper-lane diagnostics

Missing for final state:

- stronger asymptotic tests
- comparison-test style reasoning
- conditional vs absolute convergence
- branch-aware convergence for piecewise cases
- stronger endpoint classification

Likely work:

- dedicated convergence service
- family-specific convergence analyzers
- richer report and compare cards

Estimated size:

- backend: 600 to 1000 lines
- frontend: 150 to 300 lines

### 3. Real symbolic geometry engine

Current state:

- structured line, surface, contour lanes
- parametrization-based exact solve when symbolic reduction works

Missing for final state:

- multi-segment line paths
- piecewise contours
- multi-patch surfaces
- oriented manifold handling
- Jacobian/orientation audit at proof-grade depth
- more natural free-form math input instead of mostly structured syntax

Likely work:

- geometry parser layer
- path and patch model types
- richer route normalization
- geometry-specific diagnostics and visual datasets

Estimated size:

- backend: 900 to 1500 lines
- frontend: 400 to 700 lines

### 4. Residue and complex analysis lane

Current state:

- contour pullback solve exists

Missing for final state:

- residue theorem workflow
- singularity classification in complex plane
- contour deformation logic
- poles inside vs outside contour reasoning
- contour orientation proof trace

Likely work:

- new contour analysis service
- complex singularity model
- complex-plane visualizer

Estimated size:

- backend: 700 to 1200 lines
- frontend: 250 to 500 lines

### 5. Piecewise region engine v2 or v3

Current state:

- branch detection for common structures
- branch metadata reaches UI

Missing for final state:

- exact region decomposition
- region-wise solve splitting
- region stitching and measure tracking
- piecewise geometry and improper interactions

Likely work:

- symbolic branch partitioning service
- region graph or split tree
- compare/report branch renderers

Estimated size:

- backend: 800 to 1400 lines
- frontend: 250 to 450 lines

### 6. Real geometry visualizers

Current state:

- lightweight geometry preview cards

Missing for final state:

- true line path visualization
- true surface patch rendering
- contour path on complex plane
- singularity and region overlays
- orientation and normal previews

Likely work:

- visualization dataset service
- new visualizer components
- geometry-aware plot interactions

Estimated size:

- frontend: 700 to 1300 lines

### 7. Proof or certificate export layer

Current state:

- report workflow
- export packet
- writer bridge

Missing for final state:

- proof-grade mathematical certificate
- machine-readable assumptions
- deterministic derivation metadata
- reproducibility artifact for publication or audit

Likely work:

- backend certificate builder
- report schema upgrade
- export format additions

Estimated size:

- backend: 400 to 800 lines
- frontend: 150 to 300 lines

## Total rough scope for "mathematically near-final"

If reopened and taken seriously to near-final research-grade depth, the remaining work is not small.

Rough additional scope:

- backend: about 4100 to 7100 lines
- frontend: about 2150 to 4000 lines

Very rough total:

- about 6250 to 11100 lines of meaningful new code

This is not a one-week polish task. It is a medium-sized math-engine project.

## Priority order if resumed later

If the goal is maximum value per effort, the best order is:

1. formal assumptions and domain engine
2. theorem-grade convergence engine
3. real geometry visualizers
4. piecewise region engine v2
5. residue and complex contour analysis
6. proof or certificate export layer

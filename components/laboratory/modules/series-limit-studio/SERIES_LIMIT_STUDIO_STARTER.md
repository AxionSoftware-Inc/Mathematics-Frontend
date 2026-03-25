# Series / Limit Studio

Current scope:

- `limits`
- `sequences`
- `series`
- `convergence`
- `power-series`

Current local status:

- frontend solve / visualize / compare / report workspace
- auto-solve hooked to backend hybrid solver
- symbolic limit lane
- symbolic sequence tail-limit lane
- symbolic infinite-series lane
- power-series radius / interval starter lane
- asymptotic expansion signal
- convergence taxonomy:
  - primary test
  - secondary test
  - proof signal
  - comparison signal
- trust panel
- scenario library
- interactive annotations
- local numeric preview:
  - approach profile
  - sequence trajectory
  - term plot
  - partial sums

Key files:

- entry:
  - `series-limit-studio.tsx`
- state:
  - `use-series-limit-studio.ts`
- frontend services:
  - `services/math-service.ts`
  - `services/solve-service.ts`
- backend:
  - `backend/laboratory/series_limit_solver.py`

Current strengths:

- default preset loads a real symbolic lane
- analytic forms and final formula show in `Solve`
- `Visualize` is not placeholder anymore
- `Compare` and `Report` consume real summary data
- compare/report include test taxonomy and asymptotic class
- notebook-style trust / scenario / annotation workflow exists
- backend API test coverage exists for all five families

Current limitations:

- convergence-test family is still a starter lane, not a full proof engine
- power-series endpoint analysis is symbolic but still limited
- no complex-analysis residue / advanced asymptotic families yet
- local visualizer is 2D summary-focused, not research-grade interactive plotting
- asymptotic expansion is strongest for finite-point limits; sequence / power-series asymptotics are not yet universal

Recommended next build order:

1. richer convergence taxonomy:
   - ratio
   - root
   - comparison
   - alternating
   - integral test
2. asymptotic expansion / dominant-balance lane
3. sequence monotonicity / boundedness proof helpers
4. endpoint-proof engine for power series
5. deep compare/report/trust layer

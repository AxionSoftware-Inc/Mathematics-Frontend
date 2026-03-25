# Probability Studio Handoff

## Current Scope

Probability / Statistics Studio is now a real hybrid laboratory module, not a starter shell.

Current supported families:

- `descriptive`
- `distributions`
- `inference`
- `regression`
- `bayesian`
- `multivariate`
- `time-series`
- `monte-carlo`

The module currently has:

- auto-solve hybrid flow
- frontend numeric/visual fallback
- backend analytic/hybrid probability endpoint
- `solve / visualize / compare / report` workspace
- presets and research-style visual summaries

## Implemented Families

### 1. Descriptive

Current coverage:

- sample size
- mean
- variance
- standard deviation
- skewness
- kurtosis
- quartile snapshot
- histogram
- sample scatter trace

Readiness:

- strong `v1`

What is still missing:

- robust percentile engine
- boxplot visualization
- outlier fences
- weighted descriptive stats

### 2. Distributions

Current coverage:

- `normal`
- `exponential`
- `binomial`
- `poisson`
- `beta`
- `gamma`
- `student-t`
- `chi-square`

Current outputs:

- family summary
- mean/variance/std
- point density or mass
- line visualization
- family-specific audit cards

Readiness:

- medium `v1`

What is still missing:

- exact CDFs for all families
- quantile functions
- confidence/tail interval tooling
- inverse-CDF / sampling layer
- distribution comparison panel

### 3. Inference

Current coverage:

- two-proportion z-test
- one-sample mean test
- one-way ANOVA starter
- Mann-Whitney style nonparametric starter
- chi-square goodness-of-fit starter
- power analysis starter

Current outputs:

- p-value
- confidence interval where applicable
- test statistic
- risk signal
- method trace

Readiness:

- medium `v1`

What is still missing:

- exact t-distribution driven tests
- paired tests
- two-sample mean tests
- exact nonparametric implementation details
- richer effect size reporting
- corrected power/sample-size planning

### 4. Regression

Current coverage:

- linear regression
- quadratic regression
- multiple regression starter
- logistic regression starter

Current outputs:

- fit formula
- quality / `R^2` where applicable
- residual signal
- outlier signal
- leverage signal
- forecast/projection note

Readiness:

- medium `v1`

What is still missing:

- true matrix-based multiple regression diagnostics
- logistic fit quality metrics
- residual plot families
- Cook's distance / leverage / hat matrix
- confidence bands
- regularization families

### 5. Bayesian

Current coverage:

- beta-binomial posterior
- posterior mean
- approximate credible interval
- posterior predictive starter
- Bayes factor starter
- Metropolis-Hastings starter chain

Readiness:

- early research `v1`

What is still missing:

- exact credible interval solver
- posterior predictive distribution export
- general conjugate family support
- full MCMC diagnostics
- chain comparison / burn-in / ESS / R-hat

### 6. Multivariate

Current coverage:

- covariance signal
- correlation signal
- correlation heatmap
- PCA starter
- Mahalanobis distance starter
- k-means starter clustering signal

Readiness:

- early research `v1`

What is still missing:

- full PCA decomposition export
- explained variance chart
- covariance ellipse
- actual clustering family
- factor analysis
- canonical correlations

### 7. Time Series

Current coverage:

- trend line
- moving average
- seasonal starter signal
- ACF starter
- PACF starter
- AR(1)-class forecast

Readiness:

- early research `v1`

What is still missing:

- real decomposition engine
- seasonality estimation with confidence
- proper ACF/PACF statistics
- ARIMA parameter fitting
- residual whiteness diagnostics
- forecast intervals

### 8. Monte Carlo

Current coverage:

- pi estimator
- bootstrap mean audit
- variance reduction starter
- sampler comparison starter

Readiness:

- medium `v1`

What is still missing:

- generic sampling engine
- confidence bands for estimators
- variance diagnostics
- quasi-Monte-Carlo
- MCMC family unification with Bayesian lane

## Architecture

### Frontend

Primary files:

- [probability-studio.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio.tsx)
- [use-probability-studio.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/use-probability-studio.ts)
- [types.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/types.ts)
- [constants.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/constants.ts)
- [math-service.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/services/math-service.ts)
- [solve-service.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/services/solve-service.ts)
- [visualizer-deck.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/components/visualizer-deck.tsx)
- [solve-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/solve-view.tsx)
- [visualize-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/visualize-view.tsx)
- [compare-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/compare-view.tsx)
- [report-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/report-view.tsx)

Role split:

- `use-probability-studio.ts`
  - state orchestration
  - auto-solve lifecycle
  - summary merging
  - tab-facing notes

- `math-service.ts`
  - frontend fallback analysis
  - visual-only derived data
  - lightweight research probes

- `solve-service.ts`
  - backend API bridge

- `visualizer-deck.tsx`
  - lane-aware visual adapter

- `solve/visualize/compare/report`
  - presentation only

### Backend

Primary files:

- [probability_solver.py](/D:/Complete/Mathematics/backend/laboratory/probability_solver.py)
- [serializers.py](/D:/Complete/Mathematics/backend/laboratory/serializers.py)
- [views.py](/D:/Complete/Mathematics/backend/laboratory/views.py)
- [urls.py](/D:/Complete/Mathematics/backend/laboratory/urls.py)
- [tests.py](/D:/Complete/Mathematics/backend/laboratory/tests.py)

Role split:

- `probability_solver.py`
  - mode routing
  - parser helpers
  - family-specific summaries
  - exact/hybrid trace payloads

- `serializers/views/urls`
  - API exposure only

- `tests.py`
  - lane smoke coverage

## Current Code Size

Approximate local size at handoff time:

- frontend module-local code: `2615` lines
- backend probability-related footprint: `1749` lines

Heaviest files:

- [math-service.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/services/math-service.ts)
- [visualizer-deck.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/components/visualizer-deck.tsx)
- [probability_solver.py](/D:/Complete/Mathematics/backend/laboratory/probability_solver.py)

## Quality Assessment

Cold assessment:

- stronger than starter
- clearly usable
- not yet research-complete

Relative maturity:

- `integral` is still the strongest and cleanest research module
- `differential` is deeper than probability
- `matrix` and probability are closer in maturity

Approximate maturity:

- integral: `8.5/10`
- differential: `7.5/10`
- matrix: `6.5-7/10`
- probability: `7/10`

## Technical Debt

### 1. Overgrown Core Files

Current risk:

- `math-service.ts` is now too large
- `probability_solver.py` is also getting heavy

Recommended split:

- `distribution-service.ts`
- `inference-service.ts`
- `regression-service.ts`
- `bayesian-service.ts`
- `multivariate-service.ts`
- `time-series-service.ts`
- `monte-carlo-service.ts`

Backend:

- `probability_lane_distributions.py`
- `probability_lane_inference.py`
- `probability_lane_regression.py`
- `probability_lane_bayesian.py`
- `probability_lane_multivariate.py`
- `probability_lane_timeseries.py`
- `probability_lane_montecarlo.py`

### 2. Approximation Quality

Several current blocks are intentionally `v1` approximations:

- ANOVA p-value handling
- nonparametric normal approximation
- power analysis
- logistic regression fitting
- Bayes factor starter
- MCMC starter
- PCA starter
- clustering starter
- AR(1)-class time-series forecast

These are useful product signals, but not yet proof-grade or library-grade.

### 3. Compare / Report / Trust Depth

Current compare/report layers work, but are still shallower than integral:

- no full model comparison matrix
- no deep uncertainty packet
- no parameter sweep automation
- no publication-grade LaTeX packet
- no distribution/inference-specific research appendix

### 4. Visualization Depth

Current visuals are good `v1`, but not final:

- no boxplot / violin plot
- no QQ plot
- no residual diagnostics grid
- no covariance ellipse
- no PCA loadings view
- no seasonal decomposition view
- no forecast intervals
- no chain diagnostics panel

## Most Valuable Next Improvements

Highest leverage next steps:

1. split frontend/backend by lane family
2. deepen inference correctness
3. deepen regression diagnostics
4. deepen Bayesian diagnostics
5. deepen time-series model family
6. add richer research export packet

## How To Add A New Probability Family

Recommended process:

1. Add mode to [types.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/types.ts)
2. Add composer copy and preset to [constants.ts](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/constants.ts) and [solver-control.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/components/solver-control.tsx)
3. Add frontend fallback analysis in the appropriate lane service
4. Add backend lane handling in [probability_solver.py](/D:/Complete/Mathematics/backend/laboratory/probability_solver.py) or new split lane file
5. Merge summary fields into `ProbabilitySummary`
6. Add lane-aware cards in:
   - [solve-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/solve-view.tsx)
   - [visualizer-deck.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/components/visualizer-deck.tsx)
   - [compare-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/compare-view.tsx)
   - [report-view.tsx](/D:/Complete/Mathematics/Front/components/laboratory/modules/probability-studio/views/report-view.tsx)
7. Add API coverage in [tests.py](/D:/Complete/Mathematics/backend/laboratory/tests.py)
8. Run:
   - `tsc --noEmit`
   - backend `py_compile`
   - direct solver smoke

Definition of done for a new family:

- real summary
- real formula
- real step trace
- at least one useful visual
- compare note
- report note
- test coverage

## Suggested Future Families

Good next candidates:

- survival analysis
- causal inference
- hierarchical Bayes
- hidden Markov models
- copulas
- experimental design
- extreme value statistics

## Final Recommendation

Probability Studio is good enough to keep as an active module.

Do not keep expanding it indefinitely inside the current monolithic files.

Best next technical move:

- freeze features for a moment
- split by lane family
- then continue with deeper correctness and research export

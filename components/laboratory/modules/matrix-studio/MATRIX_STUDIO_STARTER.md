# Matrix Studio Starter

## Why this starts from a thin scaffold

Matrix Studio should not be cloned from Differential Studio wholesale.

Differential already contains derivative, multi-variable, ODE, PDE, and SDE families. Copying it directly would import the wrong complexity into a matrix-first module.

This starter therefore reuses only the laboratory shell pattern:

- module registry integration
- header / tab / status shell
- solve / visualize / compare / report structure
- starter presets and mode routing

The matrix core itself remains separate.

## Planned family roadmap

### Phase 1

- determinant / trace / rank
- inverse
- Gaussian elimination
- linear systems
- 2D transform preview

### Phase 2

- LU / QR / Cholesky
- eigenvalues / eigenvectors
- diagonalization checks
- condition number
- residual and stability compare

### Phase 3

- SVD
- least squares
- sparse matrix families
- iterative solvers
- research export packet

### Phase 4

- tensor structural audit
- mode unfolding ranks
- tensor contraction families
- Tucker / CP starter decomposition
- tensor eigen concepts
- higher-order sparse tensor visuals

## What is real now

- matrix studio is registered
- laboratory landing card exists
- starter presets exist
- auto-solve exists
- backend matrix API exists
- determinant / inverse lane works
- linear systems lane works
- decomposition lane works
- transform lane works
- method trace cards exist
- compare / report audit exists
- transform 2D visual exists
- least-squares fallback exists
- LU / QR / Cholesky audit exists
- SVD summary exists
- iterative lane audit exists
- sparse profile exists
- tensor lane exists
- tensor slice heatmap exists
- tensor unfolding rank audit exists
- tensor contraction audit exists
- Tucker / CP starter summaries exist
- tensor eigen probe exists

## What is intentionally not implemented yet

- full LU / QR / Cholesky proof lane
- full SVD lane
- sparse iterative solvers
- richer least-squares diagnostics
- full row-operation-by-operation elimination trace
- decomposition proofs deeper than starter audit
- production report export
- tensor product/contraction beyond starter audit
- full Tucker / CP decomposition engine
- true tensor eigen solvers
- higher-order tensor families beyond rank-3

## Recommended next order

1. sparse matrix family
2. iterative methods
3. richer least-squares diagnostics
4. explicit row-operation trace
5. full SVD lane
6. tensor family expansion
7. research export packet

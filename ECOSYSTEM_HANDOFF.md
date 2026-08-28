# Ecosystem Handoff — Mathematics

Branch: `ecosystem-v1-foundation-2026-08-28`
Base: `main` at `3aad0c5b8d77b2aa8f85d6b703215fa89bb450b8`

## Role

Mathematics is the ecosystem's **compute + understand + visualize instrument**. It is not the Project database, Notebook, Writer, or shared authentication service.

## Non-negotiable boundaries

- Default computation remains on the user device whenever practical.
- Do not introduce mandatory first-party compute infrastructure for normal studios.
- Math results cross app boundaries as Scientific Objects, not Writer-specific payloads.
- Visualization data must be representable independently of Plotly/Canvas/Three.js implementation details.
- Project identity comes from Platform Core.
- The existing Laboratory UI remains the capability source; ecosystem work should wrap/integrate it rather than duplicate it.

## Existing code to treat as migration input

- `Mathematics-Back` is not the future shared platform backend.
- `lib/live-writer-bridge.ts` and Writer-specific bridges are transitional. Their useful result serialization should migrate toward `lib/ecosystem/contracts.ts`.
- Existing visualization adapters remain valid while a renderer-neutral Scientific Scene contract is introduced incrementally.

## First integration pipeline

```text
Project context
  → open Mathematics studio
  → solve locally
  → normalize result + provenance
  → create Scientific Object
  → create revision
  → return object reference
  → Notebook/Writer consume the same reference
```

## Near-term implementation order

1. Add shared ecosystem/project switcher without destabilizing Laboratory routes.
2. Add `Save to Project` adapter for one reference studio (Integral first).
3. Add `Open scientific object` route/state hydration.
4. Extract a renderer-neutral scene/result shape from the existing visualization output.
5. Migrate the remaining studios to the same object adapter.
6. Replace Writer-specific bridge assumptions with generic references.

## Design rule

Keep the approved calm premium Laboratory design as the current visual reference. Ecosystem chrome must be quieter than the science: project context, app switcher and object state should never compete with the equation/result/visualization.

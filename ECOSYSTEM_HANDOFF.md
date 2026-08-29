# Ecosystem Handoff — Mathematics

Active development branch: `main`
Pre-ecosystem baseline: `freeze/pre-ecosystem-main-2026-08-29`

## Role

Mathematics is the ecosystem's **compute + understand + visualize instrument**. It is not the Project database, Notebook, Writer, or shared authentication service.

## Current milestone: local Save to Project

Keep the workflow deliberately small:

```text
Open Math with an active Project
  → solve in Laboratory
  → press Save
  → create a local Scientific Object in IndexedDB
  → Notebook / Writer can see the same object on the same browser origin
```

`useLaboratoryResultPersistence` now uses this rule:

- active Project present → save locally as a `calculation` Scientific Object;
- no active Project → preserve the previous saved-result API path.

Do not add a second save system per studio. Studios that already use the shared persistence hook should inherit this behavior.

## Non-negotiable boundaries

- Default computation remains on the user device whenever practical.
- Do not introduce mandatory first-party compute infrastructure for normal studios.
- Math results cross app boundaries as Scientific Objects, not new Writer-specific formats.
- Visualization data should remain independent of a particular rendering engine when practical.
- The existing Laboratory UI remains the capability source; ecosystem work should wrap/integrate it rather than duplicate it.

## Existing code to treat as migration input

- `Mathematics-Back` is not the future shared platform backend.
- `lib/live-writer-bridge.ts` remains transitional while existing Writer flows still use it.
- Existing visualization adapters remain valid; do not combine ecosystem wiring with a renderer rewrite.

## Current integration files

- `components/laboratory/use-laboratory-result-persistence.ts` — local Project save seam;
- `lib/ecosystem/local-object-store.ts` — shared browser Scientific Object store;
- `lib/ecosystem/project-context.ts` — remembers active Project across internal route changes;
- `components/ecosystem/ecosystem-bar.tsx` — quiet ecosystem navigation/project context.

## Near-term implementation order

1. Verify active Project survives Laboratory navigation.
2. Verify Save creates a local object without requiring backend availability.
3. Verify Writer can start a draft from the saved result.
4. Verify Notebook can see and use/copy the saved result.
5. Keep all current studio computation and visualization paths unchanged while this integration stabilizes.
6. Only after the workflow is stable, consider richer object hydration/reference semantics.

## Design rule

Keep the approved calm premium Laboratory design as the current visual reference. Ecosystem chrome must be quieter than the science: project context, app switcher and object state should never compete with the equation/result/visualization.

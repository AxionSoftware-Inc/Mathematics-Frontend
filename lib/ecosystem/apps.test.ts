import { describe, expect, it } from "vitest";

import { getEcosystemHref, getEcosystemRouteHref } from "./apps";

describe("ecosystem routing", () => {
  it("preserves Project context on primary app navigation", () => {
    expect(getEcosystemHref("notebook", "math", "project 1")).toBe("/notebook/workspace?project=project+1");
  });

  it("routes to a Writer subroute without duplicating the primary work path", () => {
    expect(getEcosystemRouteHref("writer", "/new", "math", "p1", { source: "project", objectId: "o1" }))
      .toBe("/writer/new?project=p1&source=project&objectId=o1");
  });

  it("routes to Science subroutes from the root app", () => {
    expect(getEcosystemRouteHref("science", "/projects", "math", "p1"))
      .toBe("/projects?project=p1");
  });
});

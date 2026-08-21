import { describe, expect, it } from "vitest";
import { getVolunteerOpportunityMetrics } from "../shared/volunteerOpportunityMetrics";

describe("volunteer opportunity capacity metrics", () => {
  it("uses persisted opportunity capacity and hours without producing NaN", () => {
    expect(getVolunteerOpportunityMetrics({ spotsAvailable: 12, hoursOffered: 4 }, 3)).toEqual({
      spotsTotal: 12,
      spotsFilled: 3,
      spotsRemaining: 9,
      hours: 4,
    });
  });

  it("keeps legacy opportunity cards readable while using their existing fields", () => {
    expect(getVolunteerOpportunityMetrics({ spotsTotal: 8, hours: 2 }, 10)).toEqual({
      spotsTotal: 8,
      spotsFilled: 8,
      spotsRemaining: 0,
      hours: 2,
    });
  });

  it("falls back to zero rather than emitting invalid capacity values", () => {
    expect(getVolunteerOpportunityMetrics({}, 1)).toEqual({
      spotsTotal: 0,
      spotsFilled: 0,
      spotsRemaining: 0,
      hours: 0,
    });
  });
});

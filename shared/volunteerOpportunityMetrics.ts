export type VolunteerOpportunityCapacityInput = {
  spotsAvailable?: unknown;
  spotsTotal?: unknown;
  hoursOffered?: unknown;
  hours?: unknown;
};

const toFiniteNonNegativeInteger = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : undefined;
};

export function getVolunteerOpportunityMetrics(opportunity: VolunteerOpportunityCapacityInput, activeSignupCount: number) {
  const capacity = toFiniteNonNegativeInteger(opportunity.spotsAvailable)
    ?? toFiniteNonNegativeInteger(opportunity.spotsTotal)
    ?? 0;
  const hours = toFiniteNonNegativeInteger(opportunity.hoursOffered)
    ?? toFiniteNonNegativeInteger(opportunity.hours)
    ?? 0;
  const spotsFilled = Math.min(capacity, toFiniteNonNegativeInteger(activeSignupCount) ?? 0);

  return {
    hours,
    spotsTotal: capacity,
    spotsFilled,
    spotsRemaining: Math.max(0, capacity - spotsFilled),
  };
}

export type PiSearchableModule = {
  piId?: string | null;
  cluster?: string | null;
  instructionalArea?: string | null;
  performanceIndicator?: string | null;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function filterPiStudyModules<T extends PiSearchableModule>(modules: T[], query: string): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return modules;

  return modules.filter((module) => [
    module.piId,
    module.cluster,
    module.instructionalArea,
    module.performanceIndicator,
  ].some((value) => normalize(value ?? "").includes(normalizedQuery)));
}

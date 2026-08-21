export type TimelineStrategy = "roleplay_exam" | "written" | "pitch" | "prepared" | "simulation";

const WRITTEN_CODES = new Set(["SEOR", "BMOR", "FOR", "HTOR", "BOR", "PMBS", "PMCD", "PMCA", "PMCG", "PMFL", "PMSP"]);
const PITCH_CODES = new Set(["IBP", "EBG", "EFB", "EIB", "EIP", "ESB"]);
const PREPARED_CODES = new Set(["PSE", "HTPS"]);
const SIMULATION_CODES = new Set(["SMG"]);

export function getTimelineStrategy(eventCode: string): TimelineStrategy {
  const normalized = eventCode.toUpperCase();
  if (PITCH_CODES.has(normalized)) return "pitch";
  if (WRITTEN_CODES.has(normalized)) return "written";
  if (PREPARED_CODES.has(normalized)) return "prepared";
  if (SIMULATION_CODES.has(normalized)) return "simulation";
  return "roleplay_exam";
}

export function strategyLabel(strategy: TimelineStrategy) {
  return {
    roleplay_exam: "Roleplay + Exam",
    written: "Written Project",
    pitch: "Pitch Deck",
    prepared: "Prepared Presentation",
    simulation: "Online Simulation",
  }[strategy];
}

export function clusterForEvent(eventCode: string) {
  const code = eventCode.toUpperCase();
  if (["ACT", "BFS", "FCE", "PFN", "FTDM", "FOR"].includes(code)) return "Finance";
  if (["HLM", "QSRM", "RFSM", "PHT", "HTDM", "TTDM", "HTPS", "HTOR"].includes(code)) return "Hospitality & Tourism";
  if (["HRM", "PBM", "BLTDM", "BOR", "PMBS", "PMCD", "PMCA", "PMCG", "IBP", "ENT", "PEN", "ETDM", "EBG", "EFB", "EIB", "EIP", "ESB"].includes(code)) return "Business Management & Administration";
  return "Marketing";
}

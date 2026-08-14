import { BarChart3, BriefcaseBusiness, Hotel, Landmark } from "lucide-react";

export const PRACTICE_CLUSTERS = [
  { value: "Marketing", label: "Marketing", description: "Customer insight, promotion, and selling", questions: "9,200+", Icon: BarChart3, accent: "blue", ring: "border-blue-400/25 hover:border-blue-300/55", icon: "border-blue-400/25 bg-blue-400/10 text-blue-200", bar: "bg-blue-400", glow: "shadow-[0_18px_42px_oklch(0.13_0.09_250/0.38)]" },
  { value: "Business Management & Administration", label: "Business", description: "Leadership, operations, and strategy", questions: "9,500+", Icon: BriefcaseBusiness, accent: "cyan", ring: "border-cyan-400/25 hover:border-cyan-300/55", icon: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200", bar: "bg-cyan-400", glow: "shadow-[0_18px_42px_oklch(0.15_0.08_215/0.34)]" },
  { value: "Finance", label: "Finance", description: "Business finance, accounting, and risk", questions: "9,100+", Icon: Landmark, accent: "indigo", ring: "border-indigo-400/25 hover:border-indigo-300/55", icon: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200", bar: "bg-indigo-400", glow: "shadow-[0_18px_42px_oklch(0.14_0.1_275/0.34)]" },
  { value: "Hospitality & Tourism", label: "Hospitality & Tourism", description: "Service, travel, and guest experience", questions: "9,300+", Icon: Hotel, accent: "sky", ring: "border-sky-400/25 hover:border-sky-300/55", icon: "border-sky-400/25 bg-sky-400/10 text-sky-200", bar: "bg-sky-400", glow: "shadow-[0_18px_42px_oklch(0.15_0.08_235/0.34)]" },
] as const;

import type { StateData, WaterfowlStatusPeriod } from "./types";
import { partialStatusCoverage, statusPeriodsByState } from "./seasonCalendars";

export type DashboardSeasonStatus = {
  kind: "open" | "partial" | "closed" | "reference";
  headline: string;
  message: string;
  icon: string;
  activePeriods: WaterfowlStatusPeriod[];
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function getDashboardSeasonStatus(state: StateData, date = new Date()): DashboardSeasonStatus {
  if (state.dataStatus === "archived") {
    return {
      kind: "reference",
      headline: "CURRENT DATA PENDING",
      message: `${state.seasonYear} is displayed for reference only.`,
      icon: "!",
      activePeriods: [],
    };
  }

  const today = localDateKey(date);
  const calendar = state.statusPeriods ?? statusPeriodsByState[state.code] ?? [];
  const activePeriods = calendar.filter((period) => today >= period.startDate && today <= period.endDate);

  if (activePeriods.length === 0) {
    if (partialStatusCoverage.has(state.code) || calendar.length === 0) {
      return {
        kind: "reference",
        headline: "STATUS CHECK REQUIRED",
        message: `${state.name} does not yet have enough final, zone-specific dates loaded to safely declare every waterfowl season closed today. Check the detailed dates and official agency source.`,
        icon: "!",
        activePeriods,
      };
    }
    return {
      kind: "closed",
      headline: "CLOSED TODAY",
      message: `You’re in ${state.name}. Here are the currently loaded dates.`,
      icon: "×",
      activePeriods,
    };
  }

  const names = unique(activePeriods.map((period) => period.name));
  const zones = unique(activePeriods.map((period) => period.zone));
  const categories = new Set(activePeriods.map((period) => period.category));
  const kind = categories.has("ducks") && categories.has("geese") ? "open" : "partial";
  const seasonLabel = names.join(" and ");
  const verb = names.length === 1 ? "is" : "are";
  const zoneLabel = zones.length === 1 ? ` in ${zones[0]}` : ` in ${zones.length} loaded zones`;

  return {
    kind,
    headline: kind === "open" ? "OPEN TODAY" : "PARTIALLY OPEN",
    message: `${seasonLabel} ${verb} open today${zoneLabel}. ${kind === "partial" ? "Other loaded waterfowl seasons remain closed. " : ""}Verify residency, zone, license, and eligibility requirements.`,
    icon: kind === "open" ? "✓" : "◐",
    activePeriods,
  };
}

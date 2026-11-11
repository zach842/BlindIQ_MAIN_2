import type { BirdRule, StateData } from "./types";

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function countBirds(state: StateData, harvest: Record<string, number>, group?: BirdRule["group"]): number {
  return state.birds.filter(bird => !group || bird.group === group)
    .reduce((total, bird) => total + Math.max(0, harvest[bird.id] ?? 0), 0);
}

/** Bag arithmetic only: dates, permits, eligibility and special areas still apply. */
export function effectiveBirdLimit(bird: BirdRule, zone: string, date = localDateKey()): number {
  const matches = bird.limitPeriods?.filter(period => (!period.zone || period.zone === zone)
    && date >= period.startDate && date <= period.endDate) ?? [];
  // Explicit closures win over overlapping special-day or higher-bag records.
  return matches.length ? Math.min(...matches.map(period => period.limit)) : bird.zoneLimits?.[zone]
    ?? (bird.zoneLimits ? Math.min(bird.limit, ...Object.values(bird.zoneLimits)) : bird.limit);
}

export function remainingBirds(state: StateData, bird: BirdRule, harvest: Record<string, number>, zone: string, date = localDateKey()): number {
  const speciesRemaining = effectiveBirdLimit(bird, zone, date) - (harvest[bird.id] ?? 0);
  const constraints = [speciesRemaining];
  if (bird.group === "Ducks") {
    constraints.push(duckBagLimit(state, zone) - countBirds(state, harvest, "Ducks"));
  }
  if (bird.parent) {
    const siblings = state.birds.filter(item => item.parent === bird.parent);
    const caps = siblings.map(item => item.parentLimits?.[zone] ?? item.parentLimit
      ?? (item.parentLimits ? Math.min(...Object.values(item.parentLimits)) : undefined))
      .filter((cap): cap is number => cap !== undefined);
    // Every sibling uses the same aggregate cap, including species without an explicit cap.
    const parentCap = caps.length ? Math.min(...caps) : effectiveBirdLimit(bird, zone, date);
    constraints.push(parentCap - siblings.reduce((sum, item) => sum + (harvest[item.id] ?? 0), 0));
  }
  return Math.max(0, Math.min(...constraints));
}

export function duckBagLimit(state: StateData, zone: string): number {
  return state.duckDailyLimits?.[zone] ?? state.duckDailyLimit
    ?? (state.duckDailyLimits ? Math.min(...Object.values(state.duckDailyLimits)) : 6);
}

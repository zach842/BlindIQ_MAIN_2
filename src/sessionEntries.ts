import type { BirdRule, HarvestEntry } from "./types";

// Sightings are observations, never a harvest allowance or a deduction from a bag.
export function buildSessionEntries(species: BirdRule[], harvest: Record<string, number>, saw: Record<string, number>): HarvestEntry[] {
  return species.filter((item) => (harvest[item.id] ?? 0) > 0 || (saw[item.id] ?? 0) > 0)
    .map((item) => ({ ...item, count: harvest[item.id] ?? 0, saw: saw[item.id] ?? 0 }));
}
export function changeSightings(current: Record<string, number>, id: string, delta: 1 | -1): Record<string, number> {
  return { ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) };
}

import { huntCategories } from "./gameCatalog";
import { huntingLocations } from "./huntingLocations";
import type { HuntCategoryId } from "./types";

export type HuntPreferences = { stateCode: string; categoryId: HuntCategoryId | null };

export function parseHuntPreferences(value: unknown): HuntPreferences {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    stateCode: huntingLocations.some(state => state.code === row.stateCode) ? row.stateCode as string : "MD",
    categoryId: huntCategories.some(category => category.id === row.categoryId) ? row.categoryId as HuntCategoryId : null,
  };
}

export function validateHuntPreferences(stateCode: string, categoryId: string) {
  if (!huntingLocations.some(state => state.code === stateCode) || !huntCategories.some(category => category.id === categoryId)) {
    throw new Error("Choose a valid state and hunting category.");
  }
}

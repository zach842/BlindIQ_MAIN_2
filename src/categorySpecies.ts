import { huntCategoryById } from "./gameCatalog";
import type { BirdRule, HuntCategoryId } from "./types";

// Display catalog for common huntable deer, not a season/permit authorization.
// Exotic or uncommon lawful deer can always be recorded using Other Legal Deer.
const muleStates = new Set("AZ CA CO ID KS MT NE NV NM ND OK OR SD TX UT WA WY".split(" "));
const blacktailStates = new Set(["CA", "HI", "OR", "WA"]);
const noStandardWhitetail = new Set(["AK", "AZ", "CA", "HI", "NV", "UT"]);
export function categorySpecies(categoryId: HuntCategoryId, stateCode: string, waterfowl: BirdRule[]): BirdRule[] {
  if (categoryId === "waterfowl") return waterfowl;
  const species = huntCategoryById(categoryId).species;
  if (categoryId !== "deer") return species;
  const families = new Set(["other"]);
  if (/^[A-Z]{2}$/.test(stateCode) && !noStandardWhitetail.has(stateCode)) families.add("whitetail");
  if (muleStates.has(stateCode)) families.add("mule");
  if (blacktailStates.has(stateCode)) families.add("blacktail");
  if (["AZ", "NM"].includes(stateCode)) families.add("coues");
  if (stateCode === "AK") families.add("sitka");
  if (["MD", "VA", "TX"].includes(stateCode)) families.add("sika");
  if (["HI", "TX"].includes(stateCode)) families.add("axis");
  return species.filter(item => families.has(item.id.slice("deer-".length).split("-")[0]));
}

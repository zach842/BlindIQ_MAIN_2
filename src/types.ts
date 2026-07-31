export type BirdRule = {
  id: string;
  label: string;
  group: "Ducks" | "Geese" | "Other";
  limit: number;
  note?: string;
  sex?: "Drake" | "Hen";
  parent?: string;
};

export type Season = {
  name: string;
  dates: string;
  open: boolean;
  zone: string;
};

export type StateData = {
  code: string;
  name: string;
  verifiedLabel: string;
  officialUrl: string;
  shootingHours: string;
  seasons: Season[];
  zones: string[];
  birds: BirdRule[];
  overview: string;
};

export type HarvestEntry = BirdRule & { count: number };

export type HuntRecord = {
  id: string;
  date: string;
  state: string;
  zone: string;
  entries: HarvestEntry[];
};

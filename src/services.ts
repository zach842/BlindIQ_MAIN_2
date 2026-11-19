import { createClient, type User } from "@supabase/supabase-js";
import { parseHuntPreferences, validateHuntPreferences, type HuntPreferences } from "./huntPreferences";
import { validateReports, validDay } from "./logbookSummary";
import { TERMS_VERSION } from "./legal";
import { migrationStatus, previewMigrationData, type MigrationData, type MigrationRegion, type MigrationSnapshot } from "./migration";
import type { HarvestEntry, HuntCategoryId, HuntRecord, HarvestReport, NewHuntRecord } from "./types";

const REMEMBERED_DEVICE_KEY = "blindiq-remembered-device";
const EXPLICIT_LOGOUT_KEY = "blindiq-explicit-logout-v1";
const ACTIVE_TAB_KEY = "blindiq-active-tab";
const DEMO_HUNTS_KEY = "blindiq-demo-hunts-v1";
const OFFLINE_USER_KEY = "blindiq-offline-user-v1";
const OFFLINE_SUBSCRIPTION_KEY = "blindiq-offline-subscription-v1";
const OFFLINE_DEFAULT_STATE_KEY = "blindiq-offline-default-state-v1";
const OFFLINE_HUNTS_KEY = "blindiq-offline-hunts-v1";
const PENDING_HUNTS_KEY = "blindiq-pending-hunts-v1";
const MIGRATION_CACHE_KEY = "blindiq-migration-pulse-v3";
const HUNT_PHOTOS_BUCKET = "hunt-photos";
const DEVICE_ID_KEY = "blindiq-device-id-v1";
const ACTIVE_HUNT_ID_KEY = "blindiq-active-hunt-id-v1";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type RememberedDevice = {
  userId: string;
  expiresAt: number;
};

type OfflineUser = {
  id: string;
  name: string;
  email: string;
};

type SubscriptionSnapshot = {
  status: string;
  isPremium: boolean;
  currentPeriodEnd: string | null;
};

type PendingHunt = {
  offlineId: string;
  huntedAt: string;
  input: NewHuntRecord;
};

export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID ?? "",
  stripeCheckoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL ?? "",
  webPushPublicKey: import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? "",
};

export const supabase =
  appConfig.supabaseUrl && appConfig.supabasePublishableKey
    ? createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;

export const isDemoMode = !supabase;

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Offline mode remains best effort if the browser blocks local storage.
  }
}

function deviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

function cacheOfflineUser(user: OfflineUser) {
  writeJson(OFFLINE_USER_KEY, user);
}

function cachedOfflineUser() {
  return readJson<OfflineUser | null>(OFFLINE_USER_KEY, null);
}

function cachedSubscription(): SubscriptionSnapshot {
  return readJson<SubscriptionSnapshot>(OFFLINE_SUBSCRIPTION_KEY, {
    status: "inactive",
    isPremium: false,
    currentPeriodEnd: null,
  });
}

function cachedHunts() {
  return readJson<HuntRecord[]>(OFFLINE_HUNTS_KEY, []);
}

function cacheHunts(records: HuntRecord[]) {
  writeJson(OFFLINE_HUNTS_KEY, records);
}

function pendingHunts() {
  return readJson<PendingHunt[]>(PENDING_HUNTS_KEY, []);
}

function cachePendingHunts(records: PendingHunt[]) {
  writeJson(PENDING_HUNTS_KEY, records);
}

function isConnectivityError(error: unknown) {
  if (!navigator.onLine) return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|network|load failed|fetch failed/i.test(message);
}

function readRememberedDevice() {
  try {
    const saved = localStorage.getItem(REMEMBERED_DEVICE_KEY);
    if (!saved) return { device: null as RememberedDevice | null, expired: false };
    const device = JSON.parse(saved) as Partial<RememberedDevice>;
    if (typeof device.userId !== "string" || typeof device.expiresAt !== "number") {
      localStorage.removeItem(REMEMBERED_DEVICE_KEY);
      return { device: null, expired: false };
    }
    if (device.expiresAt <= Date.now()) {
      localStorage.removeItem(REMEMBERED_DEVICE_KEY);
      return { device: null, expired: true };
    }
    return { device: device as RememberedDevice, expired: false };
  } catch {
    return { device: null, expired: false };
  }
}

function markActiveTab(userId: string) {
  try {
    sessionStorage.setItem(ACTIVE_TAB_KEY, userId);
  } catch {
    // Private browsing or device policy may prevent browser storage.
  }
}

function activeTabUserId() {
  try {
    return sessionStorage.getItem(ACTIVE_TAB_KEY);
  } catch {
    return null;
  }
}

export function rememberDevice(userId: string, shouldRemember: boolean) {
  try { localStorage.removeItem(EXPLICIT_LOGOUT_KEY); } catch {}
  try { sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY); } catch {}
  markActiveTab(userId);
  try {
    if (shouldRemember) {
      const device: RememberedDevice = { userId, expiresAt: Date.now() + THIRTY_DAYS_MS };
      localStorage.setItem(REMEMBERED_DEVICE_KEY, JSON.stringify(device));
    } else {
      localStorage.removeItem(REMEMBERED_DEVICE_KEY);
    }
  } catch {
    // The login remains valid for the current tab if persistent storage is unavailable.
  }
}

export function forgetRememberedDevice() {
  try {
    localStorage.removeItem(REMEMBERED_DEVICE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
  try {
    sessionStorage.removeItem(ACTIVE_TAB_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function clearOfflineAccountCache() {
  try {
    [OFFLINE_USER_KEY, OFFLINE_SUBSCRIPTION_KEY, OFFLINE_DEFAULT_STATE_KEY, OFFLINE_HUNTS_KEY, PENDING_HUNTS_KEY]
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // The Supabase local session is still cleared below when available.
  }
}

export function displayNameFor(user: User) {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim()) return username.trim();
  return user.email?.split("@")[0] || "Hunter";
}

export async function signIn(email: string, password: string, shouldRemember = true) {
  if (!supabase) {
    if (email.toLowerCase() !== "hunter" || password !== "confidence") {
      throw new Error("Incorrect username or password.");
    }
    rememberDevice("demo-user", shouldRemember);
    return { id: "demo-user", name: "Hunter", email: "hunter" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  rememberDevice(data.user.id, shouldRemember);
  const user = { id: data.user.id, name: displayNameFor(data.user), email: data.user.email ?? email };
  cacheOfflineUser(user);
  return user;
}

export async function signUp(username: string, email: string, password: string, shouldRemember = true) {
  if (!supabase) {
    rememberDevice("demo-user", shouldRemember);
    return { id: "demo-user", name: username, email, confirmationRequired: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  // Keep the user's device choice even when email confirmation is enabled and
  // Supabase does not return a session until the confirmation link is opened.
  if (data.user) rememberDevice(data.user.id, shouldRemember);
  const user = {
    name: data.user ? displayNameFor(data.user) : username,
    id: data.user?.id ?? "",
    email,
    confirmationRequired: !data.session,
  };
  if (data.session && data.user) cacheOfflineUser({ id: user.id, name: user.name, email: user.email });
  return user;
}

export async function getDefaultState() {
  if (!supabase) return localStorage.getItem("blindiq-default-state") || "MD";
  if (!navigator.onLine) return localStorage.getItem(OFFLINE_DEFAULT_STATE_KEY) || "MD";
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isConnectivityError(userError)) return localStorage.getItem(OFFLINE_DEFAULT_STATE_KEY) || "MD";
    throw userError;
  }
  if (!userData.user) return "MD";
  const { data, error } = await supabase.from("profiles").select("default_state").eq("id", userData.user.id).maybeSingle();
  if (error) {
    if (isConnectivityError(error)) return localStorage.getItem(OFFLINE_DEFAULT_STATE_KEY) || "MD";
    throw error;
  }
  const stateCode = data?.default_state || "MD";
  localStorage.setItem(OFFLINE_DEFAULT_STATE_KEY, stateCode);
  return stateCode;
}

export async function saveDefaultState(stateCode: string) {
  localStorage.setItem(OFFLINE_DEFAULT_STATE_KEY, stateCode);
  if (!supabase) {
    localStorage.setItem("blindiq-default-state", stateCode);
    return;
  }
  if (!navigator.onLine) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Log in before saving a default state.");
  const { error } = await supabase.from("profiles").update({ default_state: stateCode, updated_at: new Date().toISOString() }).eq("id", userData.user.id);
  if (error) throw error;
}

// The cache is account-scoped; a second hunter on this device cannot inherit setup.
const huntPreferencesKey = (userId: string) => `blindiq-hunt-preferences-v1:${userId}`;
function cachedHuntPreferences(userId: string): HuntPreferences | null {
  try {
    const value = localStorage.getItem(huntPreferencesKey(userId));
    return value ? parseHuntPreferences(JSON.parse(value)) : null;
  } catch { return null; }
}
function cacheHuntPreferences(userId: string, preferences: HuntPreferences) {
  try { localStorage.setItem(huntPreferencesKey(userId), JSON.stringify(preferences)); } catch { /* Cloud save still succeeded. */ }
}
export async function getHuntPreferences(userId: string): Promise<HuntPreferences> {
  const cached = cachedHuntPreferences(userId);
  if (!supabase) return cached ?? parseHuntPreferences({ stateCode: localStorage.getItem("blindiq-default-state") });
  if (!navigator.onLine) return cached ?? { stateCode: "MD", categoryId: null };
  const { data, error } = await supabase.from("profiles").select("default_state,default_hunt_category").eq("id", userId).maybeSingle();
  if (error) { if (cached && isConnectivityError(error)) return cached; throw error; }
  const preferences = parseHuntPreferences({ stateCode: data?.default_state, categoryId: data?.default_hunt_category });
  cacheHuntPreferences(userId, preferences);
  return preferences;
}
export async function saveHuntPreferences(userId: string, stateCode: string, categoryId: HuntCategoryId) {
  validateHuntPreferences(stateCode, categoryId);
  const preferences = { stateCode, categoryId };
  if (!supabase) {
    try { localStorage.setItem(huntPreferencesKey(userId), JSON.stringify(preferences)); }
    catch { throw new Error("This browser could not save your defaults. Allow browser storage and try again."); }
    return;
  }
  if (!navigator.onLine) throw new Error("Connect to the internet to save defaults to your account.");
  const { data, error } = await supabase.from("profiles").update({ default_state: stateCode, default_hunt_category: categoryId, updated_at: new Date().toISOString() }).eq("id", userId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Your defaults were not saved. Please sign in again and retry.");
  cacheHuntPreferences(userId, preferences);
  try { localStorage.setItem(OFFLINE_DEFAULT_STATE_KEY, stateCode); } catch { /* Optional offline compatibility cache. */ }
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function restoreRememberedUser() {
  try { if (localStorage.getItem(EXPLICIT_LOGOUT_KEY)) return null; } catch {}
  try { if (sessionStorage.getItem(EXPLICIT_LOGOUT_KEY)) return null; } catch {}
  const { device, expired } = readRememberedDevice();
  const tabUserId = activeTabUserId();

  if (expired) {
    forgetRememberedDevice();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
    return null;
  }

  if (!device && !tabUserId) {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.signOut({ scope: "local" });
    }
    return null;
  }

  if (!supabase) {
    return device?.userId === "demo-user" || tabUserId === "demo-user"
      ? { id: "demo-user", name: "Hunter", email: "hunter" }
      : null;
  }

  const expectedUserId = device?.userId ?? tabUserId;
  const cachedUser = cachedOfflineUser();
  if (!navigator.onLine) {
    if (cachedUser && cachedUser.id === expectedUserId) {
      markActiveTab(cachedUser.id);
      return cachedUser;
    }
    return null;
  }

  // First restore the persisted Supabase session locally. A remote verification
  // follows, but a temporary network failure must not erase a valid 30-day
  // device choice.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    if (isConnectivityError(sessionError) && cachedUser?.id === expectedUserId) {
      markActiveTab(cachedUser.id);
      return cachedUser;
    }
    if (!isConnectivityError(sessionError)) {
      forgetRememberedDevice();
      await supabase.auth.signOut({ scope: "local" });
    }
    return null;
  }

  const sessionUser = sessionData.session?.user;
  if (!sessionUser) {
    // This is normal immediately after signup when email confirmation is
    // required. Preserve the opt-in so the confirmation redirect can restore.
    return null;
  }
  if (sessionUser.id !== expectedUserId) {
    forgetRememberedDevice();
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (error && isConnectivityError(error)) {
      const fallbackUser = cachedUser?.id === expectedUserId
        ? cachedUser
        : {
            id: sessionUser.id,
            name: displayNameFor(sessionUser),
            email: sessionUser.email ?? "",
          };
      markActiveTab(fallbackUser.id);
      cacheOfflineUser(fallbackUser);
      return fallbackUser;
    }
    forgetRememberedDevice();
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }

  markActiveTab(data.user.id);
  const user = {
    id: data.user.id,
    name: displayNameFor(data.user),
    email: data.user.email ?? "",
  };
  cacheOfflineUser(user);
  return user;
}

function clearPersistedAuth() {
  if (!appConfig.supabaseUrl) return;
  // Matches this configured client's default storage key in SupabaseClient.
  const key = `sb-${new URL(appConfig.supabaseUrl).hostname.split(".")[0]}-auth-token`;
  for (const storage of [() => localStorage, () => sessionStorage]) {
    try {
      const target = storage();
      const keys = Array.from({length: target.length}, (_, index) => target.key(index));
      for (const name of keys) if (name === key || name?.startsWith(key + "-")) target.removeItem(name);
    } catch { /* Browser storage may be unavailable. */ }
  }
}

export function forceLocalSignOut() {
  try { localStorage.setItem(EXPLICIT_LOGOUT_KEY, "true"); } catch {}
  try { sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, "true"); } catch {}
  forgetRememberedDevice();
  clearOfflineAccountCache();
  clearPersistedAuth();
}

export async function signOut() {
  // Persist the user's explicit intent before any SDK/network wait. A reload
  // must stay signed out even if the local Supabase sign-out cannot finish.
  try { localStorage.setItem(EXPLICIT_LOGOUT_KEY, "true"); } catch {}
  try { sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, "true"); } catch {}
  forgetRememberedDevice();
  clearOfflineAccountCache();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } finally { clearPersistedAuth(); }
  }
}

export async function getSubscription() {
  if (!supabase) {
    return { status: "active", isPremium: true, currentPeriodEnd: null as string | null };
  }
  if (!navigator.onLine) return cachedSubscription();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isConnectivityError(userError)) return cachedSubscription();
    throw userError;
  }
  if (!userData.user) return { status: "inactive", isPremium: false, currentPeriodEnd: null };
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) {
    if (isConnectivityError(error)) return cachedSubscription();
    throw error;
  }
  const status = data?.status ?? "inactive";
  const snapshot = {
    status,
    isPremium: status === "active" || status === "trialing",
    currentPeriodEnd: data?.current_period_end ?? null,
  };
  writeJson(OFFLINE_SUBSCRIPTION_KEY, snapshot);
  return snapshot;
}

function cachedMigrationData() {
  const cached = readJson<MigrationData | null>(MIGRATION_CACHE_KEY, null);
  return cached ? { ...cached, mode: "cached" as const } : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function getMigrationData(): Promise<MigrationData> {
  if (!supabase) return previewMigrationData();
  if (!navigator.onLine) return cachedMigrationData() ?? previewMigrationData();

  const [regionResult, snapshotResult] = await Promise.all([
    supabase
      .from("migration_regions")
      .select("id,flyway,name,short_name,state_codes,description,latitude,longitude,display_order")
      .eq("active", true)
      .order("flyway")
      .order("display_order"),
    supabase
      .from("migration_snapshots")
      .select("region_id,observed_index,forecast_index,confidence,direction,trend,status,summary,drivers,sources,generated_at,valid_through")
      .eq("species_group", "all-waterfowl")
      .order("generated_at", { ascending: false })
      .limit(100),
  ]);

  if (regionResult.error || snapshotResult.error) {
    const cached = cachedMigrationData();
    if (cached) return cached;
    return previewMigrationData();
  }

  const regions: MigrationRegion[] = (regionResult.data ?? []).map((row) => ({
    id: row.id,
    flyway: row.flyway === "Mississippi" || row.flyway === "Central" || row.flyway === "Pacific" ? row.flyway : "Atlantic",
    name: row.name,
    shortName: row.short_name,
    states: stringArray(row.state_codes),
    description: row.description,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    displayOrder: Number(row.display_order),
  }));

  const newestByRegion = new Map<string, MigrationSnapshot>();
  for (const row of snapshotResult.data ?? []) {
    if (newestByRegion.has(row.region_id)) continue;
    const forecastIndex = Number(row.forecast_index);
    newestByRegion.set(row.region_id, {
      regionId: row.region_id,
      observedIndex: Number(row.observed_index),
      forecastIndex,
      confidence: Number(row.confidence),
      direction: row.direction === "northbound" || row.direction === "staging" ? row.direction : "southbound",
      trend: row.trend === "rising" || row.trend === "falling" ? row.trend : "steady",
      status: row.status || migrationStatus(forecastIndex),
      summary: row.summary,
      drivers: stringArray(row.drivers),
      sources: stringArray(row.sources),
      generatedAt: row.generated_at,
      validThrough: row.valid_through,
    });
  }

  const snapshots = [...newestByRegion.values()];
  if (!regions.length || !snapshots.length) return previewMigrationData();
  const retrievedAt = snapshots.reduce((latest, snapshot) => snapshot.generatedAt > latest ? snapshot.generatedAt : latest, snapshots[0].generatedAt);
  const result: MigrationData = { regions, snapshots, mode: "live", retrievedAt };
  writeJson(MIGRATION_CACHE_KEY, result);
  return result;
}

function formatHuntDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type HuntRow = {
  id: string;
  hunted_at: string;
  hunt_local_date?: string | null;
  spot_name?: string | null;
  reporting_details?: unknown;
  state_code: string;
  state_name: string;
  zone: string;
  is_simulation?: boolean | null;
  hunt_category?: HuntCategoryId | null;
  entries?: unknown;
  blind_name?: string | null;
  firearm_used?: string | null;
  notes?: string | null;
  photo_path?: string | null;
};

function rowToHuntRecord(row: HuntRow): HuntRecord {
  const entries = Array.isArray(row.entries) ? row.entries as HarvestEntry[] : [];
  const categoryFromEntries = entries.find((entry) => entry.huntCategory)?.huntCategory;
  return {
    id: row.id,
    date: formatHuntDate(row.hunt_local_date ? row.hunt_local_date + "T12:00:00" : row.hunted_at),
    huntedAt: row.hunted_at,
    huntLocalDate: row.hunt_local_date ?? undefined,
    spotName: row.spot_name ?? null,
    reportingDetails: Array.isArray(row.reporting_details) ? row.reporting_details.filter((r): r is HarvestReport => !!r && typeof r === "object" && ["id","speciesId","confirmationNumber","harvestDate","county","weaponClass"].every(key => typeof (r as Record<string, unknown>)[key] === "string")) : [],
    stateCode: row.state_code,
    state: row.state_name,
    zone: row.zone,
    isSimulation: row.is_simulation ?? false,
    huntCategory: row.hunt_category ?? categoryFromEntries ?? "waterfowl",
    entries,
    blindName: row.blind_name ?? null,
    firearmUsed: row.firearm_used ?? null,
    notes: row.notes ?? null,
    photoPath: row.photo_path ?? null,
  };
}

function isMissingHuntCategoryColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "42703"
    || (message.includes("hunt_category") && /does not exist|column|schema cache/i.test(message));
}

function isHuntDatabaseSetupError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "42P01"
    || error.code === "42501"
    || /relation .*hunts.* does not exist|schema cache|could not find .* column|column .* does not exist|permission denied|row-level security/i.test(message);
}

function huntDatabaseSetupMessage(action: "load" | "save") {
  const verb = action === "load" ? "loaded" : "saved";
  return `Saved hunts could not be ${verb} because BlindIQ’s hunt-log database needs the included one-time Logbook Setup update. Existing hunts have not been deleted.`;
}

async function addPrivatePhotoUrls(records: HuntRecord[]) {
  if (!supabase) return records;
  const paths = records.flatMap((record) => record.photoPath ? [record.photoPath] : []);
  if (!paths.length) return records;

  const { data, error } = await supabase.storage.from(HUNT_PHOTOS_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) return records;
  const signedUrls = new Map(
    (data ?? []).flatMap((item) => item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : []),
  );
  return records.map((record) => ({ ...record, photoUrl: record.photoPath ? signedUrls.get(record.photoPath) ?? null : null }));
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Photo preview could not be saved."));
    reader.onerror = () => reject(new Error("Photo preview could not be saved."));
    reader.readAsDataURL(blob);
  });
}

function readDemoHunts(): HuntRecord[] {
  try {
    const stored = localStorage.getItem(DEMO_HUNTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed as HuntRecord[] : [];
  } catch {
    return [];
  }
}

export async function deleteHuntRecord(hunt: HuntRecord): Promise<{ warning?: string }> {
  if (!supabase) {
    try { localStorage.setItem(DEMO_HUNTS_KEY, JSON.stringify(readDemoHunts().filter(record => record.id !== hunt.id))); }
    catch { throw new Error("This browser could not delete the hunt. Please check available storage and try again."); }
    return {};
  }
  // Queued records can be in an active sync. Wait until sync finishes rather than
  // racing an insert and incorrectly reporting that the hunt has been removed.
  if (hunt.id.startsWith("offline-")) throw new Error("This hunt is waiting to sync. Connect to the internet and let it sync before deleting it.");
  if (!navigator.onLine) throw new Error("Connect to the internet to delete a saved hunt. Nothing has been removed.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Please sign in again before deleting this hunt.");
  const { data, error } = await supabase.from("hunts").delete()
    .eq("id", hunt.id).eq("user_id", userData.user.id).select("id,photo_path");
  if (error) {
    if (isHuntDatabaseSetupError(error)) throw new Error("Hunt deletion needs the included one-time HUNT_DELETE_SETUP.sql database update. Your hunt has not been removed.");
    throw new Error(error.message || "The hunt could not be deleted. Please try again.");
  }
  if (!data?.length) throw new Error("Deletion was not confirmed. Refresh your logbook; if the hunt remains, apply HUNT_DELETE_SETUP.sql. No local record was removed.");
  cacheHunts(cachedHunts().filter(record => record.id !== hunt.id));
  // Only use the path returned by the owner-filtered DELETE, never a UI-supplied path.
  const path = data[0].photo_path;
  if (typeof path === "string" && path.startsWith(userData.user.id + "/")) {
    try {
      const { error: photoError } = await supabase.storage.from(HUNT_PHOTOS_BUCKET).remove([path]);
      if (photoError) return { warning: "Hunt deleted. Its stored photo could not be removed; please contact support for photo cleanup." };
    } catch { return { warning: "Hunt deleted. Its stored photo could not be removed; please contact support for photo cleanup." }; }
  }
  return {};
}

export async function saveHuntReportingDetails(hunt: HuntRecord, reports: HarvestReport[], spot = hunt.spotName ?? hunt.blindName ?? ""): Promise<HuntRecord> {
  const reportingDetails = validateReports(hunt, reports);
  if (spot.length > 120) throw new Error("Spot names must be 120 characters or fewer.");
  if (!supabase) {
    const record = { ...hunt, reportingDetails, spotName: spot.trim() || null };
    const rows = readDemoHunts();
    const stored = rows.find(row => row.id === hunt.id);
    if (!stored || JSON.stringify(stored.reportingDetails ?? []) !== JSON.stringify(hunt.reportingDetails ?? []) || (stored.spotName ?? null) !== (hunt.spotName ?? null)) throw new Error("This hunt changed. Close this panel and refresh the logbook before editing.");
    try { localStorage.setItem(DEMO_HUNTS_KEY, JSON.stringify(rows.map(row => row.id === hunt.id ? record : row))); }
    catch { throw new Error("This browser could not save reporting details. Please retry."); }
    return record;
  }
  if (!navigator.onLine || hunt.id.startsWith("offline-")) throw new Error("Connect and sync this hunt before saving confirmation numbers.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Please sign in again before editing this hunt.");
  let query = supabase.from("hunts").update({ reporting_details: reportingDetails, spot_name: spot.trim() || null }).eq("id", hunt.id).eq("user_id", userData.user.id).eq("reporting_details", JSON.stringify(hunt.reportingDetails ?? []));
  query = hunt.spotName ? query.eq("spot_name", hunt.spotName) : query.is("spot_name", null);
  const { data, error } = await query.select("id,reporting_details");
  if (error) throw new Error(error.message || "Reporting details could not be saved.");
  if (!data?.length) throw new Error("This hunt changed or saving was not confirmed. Close this panel and refresh the logbook before editing.");
  const record = { ...hunt, reportingDetails, spotName: spot.trim() || null };
  cacheHunts(cachedHunts().map(row => row.id === hunt.id ? record : row));
  return record;
}

const huntReadNotices = new WeakMap<HuntRecord[], string>();
export const getHuntReadNotice = (records: HuntRecord[]) => huntReadNotices.get(records) ?? "";
function readCopy(records: HuntRecord[], notice: string) { huntReadNotices.set(records, notice); return records; }
export async function listHunts(): Promise<HuntRecord[]> {
  if (!supabase) return readDemoHunts();
  if (!navigator.onLine) { return readCopy(cachedHunts(), "Offline copy: hunts saved on other devices may be missing. Refresh online before using renewal totals."); }
  const rows: HuntRow[] = [];
  const cutoff = new Date().toISOString();
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabase.from("hunts").select("*").lte("hunted_at", cutoff).order("hunted_at", { ascending: false }).order("id", { ascending: false }).range(start, start + 499);
    if (error) {
      const cached = cachedHunts();
      if (cached.length || isConnectivityError(error)) { return readCopy(cached, "Saved copy: the logbook could not be refreshed. Totals may be incomplete; retry online before using renewal information."); }
      if (isHuntDatabaseSetupError(error)) throw new Error(huntDatabaseSetupMessage("load"));
      throw new Error(error.message || "Unable to load saved hunts.");
    }
    rows.push(...(data ?? []) as HuntRow[]);
    if (!data || data.length < 500) break;
  }
  const records = await addPrivatePhotoUrls([...new Map(rows.map(row => [row.id, rowToHuntRecord(row)])).values()]);
  const ids = new Set(records.map(row => row.id));
  const queued = pendingHunts().filter(item => !ids.has(item.offlineId.replace(/^offline-/, ""))).map(item => offlineRecord(item.input, item.huntedAt, item.offlineId));
  const combined = [...queued, ...records];
  cacheHunts(combined);
  return combined;
}

function offlineRecord(input: NewHuntRecord, huntedAt: string, id = `offline-${crypto.randomUUID()}`): HuntRecord {
  return {
    id,
    date: formatHuntDate(huntedAt),
    huntedAt,
    huntLocalDate: input.huntLocalDate,
    spotName: input.spotName || null,
    reportingDetails: [],
    stateCode: input.stateCode,
    state: input.state,
    zone: input.zone,
    entries: input.entries,
    isSimulation: input.isSimulation,
    huntCategory: input.huntCategory ?? "waterfowl",
    blindName: input.blindName || null,
    firearmUsed: input.firearmUsed || null,
    notes: input.notes || null,
  };
}

function queueOfflineHunt(input: NewHuntRecord, huntedAt: string) {
  const record = offlineRecord(input, huntedAt);
  cachePendingHunts([...pendingHunts(), { offlineId: record.id, huntedAt, input }]);
  cacheHunts([record, ...cachedHunts().filter((hunt) => hunt.id !== record.id)]);
  return record;
}

export async function saveHuntRecord(input: NewHuntRecord, photo?: Blob | null): Promise<HuntRecord> {
  const huntedAt = new Date().toISOString();
  const local = new Date(huntedAt);
  const day = `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,"0")}-${String(local.getDate()).padStart(2,"0")}`;
  input = { ...input, huntLocalDate: input.huntLocalDate ?? day };
  if (!validDay(input.huntLocalDate ?? "")) throw new Error("The hunt date is invalid.");
  const birdCount = input.entries.reduce((sum, entry) => sum + entry.count, 0);

  if (!supabase) {
    const photoUrl = photo ? await blobToDataUrl(photo) : null;
    const record: HuntRecord = {
      id: crypto.randomUUID(),
      date: formatHuntDate(huntedAt),
      huntedAt,
      huntLocalDate: input.huntLocalDate,
      spotName: input.spotName || null,
      reportingDetails: [],
      stateCode: input.stateCode,
      state: input.state,
      zone: input.zone,
      entries: input.entries,
      isSimulation: input.isSimulation,
      huntCategory: input.huntCategory ?? "waterfowl",
      blindName: input.blindName || null,
      firearmUsed: input.firearmUsed || null,
      notes: input.notes || null,
      photoPath: null,
      photoUrl,
    };
    try {
      localStorage.setItem(DEMO_HUNTS_KEY, JSON.stringify([record, ...readDemoHunts()]));
    } catch {
      throw new Error("This browser does not have enough local space for that photo. Remove the photo and save again.");
    }
    return record;
  }

  if (photo && !navigator.onLine) {
    throw new Error("Connect to the internet to save this photo, or remove it and save the hunt offline.");
  }
  if (!navigator.onLine) return queueOfflineHunt(input, huntedAt);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    if (isConnectivityError(userError) && !photo) return queueOfflineHunt(input, huntedAt);
    if (isConnectivityError(userError)) throw new Error("Connect to the internet to save this photo, or remove it and save the hunt offline.");
    throw new Error("Log in before saving a hunt.");
  }

  const huntId = crypto.randomUUID();
  let photoPath: string | null = null;
  if (photo) {
    photoPath = `${userData.user.id}/${huntId}/harvest.jpg`;
    const { error: photoError } = await supabase.storage
      .from(HUNT_PHOTOS_BUCKET)
      .upload(photoPath, photo, { cacheControl: "3600", contentType: "image/jpeg", upsert: false });
    if (photoError) throw new Error(`Photo upload failed: ${photoError.message}`);
  }

  const insertPayload = {
      id: huntId,
      user_id: userData.user.id,
      hunted_at: huntedAt,
      hunt_local_date: input.huntLocalDate,
      spot_name: input.spotName?.trim() || null,
      state_code: input.stateCode,
      state_name: input.state,
      zone: input.zone,
      is_simulation: input.isSimulation,
      hunt_category: input.huntCategory ?? "waterfowl",
      season_year: input.seasonYear ?? null,
      entries: input.entries,
      bird_count: birdCount,
      blind_name: input.blindName?.trim() || null,
      firearm_used: input.firearmUsed?.trim() || null,
      notes: input.notes?.trim() || null,
      photo_path: photoPath,
      app_version: "1.72.0",
    };
  let { data, error } = await supabase
    .from("hunts")
    .insert(insertPayload)
    .select("id,hunted_at,hunt_local_date,spot_name,reporting_details,state_code,state_name,zone,is_simulation,hunt_category,entries,blind_name,firearm_used,notes,photo_path")
    .single();
  if (isMissingHuntCategoryColumn(error)) {
    const { hunt_category: _huntCategory, ...legacyPayload } = insertPayload;
    const legacyResult = await supabase
      .from("hunts")
      .insert(legacyPayload)
      .select("id,hunted_at,hunt_local_date,spot_name,reporting_details,state_code,state_name,zone,is_simulation,entries,blind_name,firearm_used,notes,photo_path")
      .single();
    data = legacyResult.data ? { ...legacyResult.data, hunt_category: null } : null;
    error = legacyResult.error;
  }
  if (error) {
    if (photoPath) await supabase.storage.from(HUNT_PHOTOS_BUCKET).remove([photoPath]);
    if (isConnectivityError(error) && !photo) return queueOfflineHunt(input, huntedAt);
    if (isConnectivityError(error)) throw new Error("Connect to the internet to save this photo, or remove it and save the hunt offline.");
    if (isHuntDatabaseSetupError(error)) throw new Error(huntDatabaseSetupMessage("save"));
    throw error;
  }
  if (!data) throw new Error("The hunt was saved, but the saved record could not be loaded.");
  const [record] = await addPrivatePhotoUrls([rowToHuntRecord(data)]);
  cacheHunts([record, ...cachedHunts().filter((hunt) => hunt.id !== record.id)]);
  return record;
}

export async function syncPendingHunts() {
  if (!supabase || !navigator.onLine) return 0;
  const queue = pendingHunts();
  if (!queue.length) return 0;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return 0;

  let synced = 0;
  const remainingQueue: PendingHunt[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    const birdCount = item.input.entries.reduce((sum, entry) => sum + entry.count, 0);
    const insertPayload = {
      id: item.offlineId.replace(/^offline-/, ""),
      user_id: userData.user.id,
      hunted_at: item.huntedAt,
      hunt_local_date: item.input.huntLocalDate ?? null,
      spot_name: item.input.spotName?.trim() || null,
      state_code: item.input.stateCode,
      state_name: item.input.state,
      zone: item.input.zone,
      is_simulation: item.input.isSimulation,
      hunt_category: item.input.huntCategory ?? "waterfowl",
      season_year: item.input.seasonYear ?? null,
      entries: item.input.entries,
      bird_count: birdCount,
      blind_name: item.input.blindName?.trim() || null,
      firearm_used: item.input.firearmUsed?.trim() || null,
      notes: item.input.notes?.trim() || null,
      app_version: "1.72.0-offline-sync",
    };
    let { error } = await supabase.from("hunts").upsert(insertPayload, { onConflict: "id", ignoreDuplicates: true });
    if (isMissingHuntCategoryColumn(error)) {
      const { hunt_category: _huntCategory, ...legacyPayload } = insertPayload;
      const legacyResult = await supabase.from("hunts").upsert(legacyPayload, { onConflict: "id", ignoreDuplicates: true });
      error = legacyResult.error;
    }
    if (error) {
      remainingQueue.push(...queue.slice(index));
      break;
    }
    synced += 1;
  }

  cachePendingHunts(remainingQueue);
  if (synced) {
    const records = await listHunts();
    cacheHunts(records.filter((hunt) => !hunt.id.startsWith("offline-")));
  }
  return synced;
}

export async function beginActiveHunt(input: { stateCode: string; stateName: string; zone: string }) {
  if (!supabase || !navigator.onLine) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const now = new Date().toISOString();
  // A device can only have one current live hunt. Closing a stale local hunt
  // prevents duplicate unfinished-hunt reminders if a hunter starts over.
  await supabase
    .from("active_hunts")
    .update({ status: "discarded", completed_at: now, last_activity_at: now })
    .eq("user_id", userData.user.id)
    .eq("device_id", deviceId())
    .eq("status", "active");
  const { data, error } = await supabase
    .from("active_hunts")
    .insert({
      user_id: userData.user.id,
      device_id: deviceId(),
      state_code: input.stateCode,
      state_name: input.stateName,
      zone: input.zone,
      status: "active",
    })
    .select("id")
    .single();
  if (error) return null;
  localStorage.setItem(ACTIVE_HUNT_ID_KEY, data.id);
  return data.id as string;
}

export async function touchActiveHunt(zone?: string) {
  if (!supabase || !navigator.onLine) return;
  const huntId = localStorage.getItem(ACTIVE_HUNT_ID_KEY);
  if (!huntId) return;
  const update: Record<string, string> = { last_activity_at: new Date().toISOString() };
  if (zone) update.zone = zone;
  await supabase.from("active_hunts").update(update).eq("id", huntId);
}

export async function finishActiveHunt(status: "saved" | "discarded") {
  const huntId = localStorage.getItem(ACTIVE_HUNT_ID_KEY);
  localStorage.removeItem(ACTIVE_HUNT_ID_KEY);
  if (!huntId || !supabase || !navigator.onLine) return;
  await supabase.from("active_hunts").update({ status, completed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq("id", huntId);
}

export function beginCheckout(userId: string, email: string) {
  if (!navigator.onLine) return "offline";
  if (appConfig.stripeCheckoutUrl) {
    const checkout = new URL(appConfig.stripeCheckoutUrl);
    if (userId && userId !== "demo-user") checkout.searchParams.set("client_reference_id", userId);
    if (email.includes("@")) checkout.searchParams.set("prefilled_email", email);
    window.location.href = checkout.toString();
    return;
  }
  return "demo";
}

export async function openCustomerPortal() {
  if (!navigator.onLine) return "offline" as const;
  if (!supabase) return "demo" as const;

  const { data, error } = await supabase.functions.invoke("stripe-customer-portal", {
    method: "POST",
  });
  if (error) {
    let message = error.message || "Unable to open membership management.";
    if ("context" in error && error.context instanceof Response) {
      try {
        const payload = await error.context.clone().json();
        if (payload?.error && typeof payload.error === "string") message = payload.error;
      } catch {
        // Fall back to the Supabase Functions error when no JSON body is available.
      }
    }
    throw new Error(message);
  }
  if (!data?.url || typeof data.url !== "string") {
    throw new Error(data?.error || "Stripe did not return a membership-management link.");
  }

  window.location.assign(data.url);
  return "redirecting" as const;
}

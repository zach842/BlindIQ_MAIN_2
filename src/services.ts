import { createClient, type User } from "@supabase/supabase-js";
import { TERMS_VERSION } from "./legal";
import type { HarvestEntry, HuntRecord, NewHuntRecord } from "./types";

const REMEMBERED_DEVICE_KEY = "blindiq-remembered-device";
const ACTIVE_TAB_KEY = "blindiq-active-tab";
const DEMO_HUNTS_KEY = "blindiq-demo-hunts-v1";
const OFFLINE_USER_KEY = "blindiq-offline-user-v1";
const OFFLINE_SUBSCRIPTION_KEY = "blindiq-offline-subscription-v1";
const OFFLINE_DEFAULT_STATE_KEY = "blindiq-offline-default-state-v1";
const OFFLINE_HUNTS_KEY = "blindiq-offline-hunts-v1";
const PENDING_HUNTS_KEY = "blindiq-pending-hunts-v1";
const HUNT_PHOTOS_BUCKET = "hunt-photos";
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
};

export const supabase =
  appConfig.supabaseUrl && appConfig.supabasePublishableKey
    ? createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey)
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
  if (data.session && data.user) rememberDevice(data.user.id, shouldRemember);
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
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return "MD";
  const { data, error } = await supabase.from("profiles").select("default_state").eq("id", userData.user.id).maybeSingle();
  if (error) throw error;
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

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function restoreRememberedUser() {
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
  if (!navigator.onLine) {
    const cachedUser = cachedOfflineUser();
    if (cachedUser && cachedUser.id === expectedUserId) {
      markActiveTab(cachedUser.id);
      return cachedUser;
    }
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== expectedUserId) {
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

export async function signOut() {
  forgetRememberedDevice();
  clearOfflineAccountCache();
  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Local app data has already been cleared, including during offline logout.
    }
  }
}

export async function getSubscription() {
  if (!supabase) {
    return { status: "active", isPremium: true, currentPeriodEnd: null as string | null };
  }
  if (!navigator.onLine) return cachedSubscription();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { status: "inactive", isPremium: false, currentPeriodEnd: null };
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  const status = data?.status ?? "inactive";
  const snapshot = {
    status,
    isPremium: status === "active" || status === "trialing",
    currentPeriodEnd: data?.current_period_end ?? null,
  };
  writeJson(OFFLINE_SUBSCRIPTION_KEY, snapshot);
  return snapshot;
}

function formatHuntDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function rowToHuntRecord(row: {
  id: string;
  hunted_at: string;
  state_code: string;
  state_name: string;
  zone: string;
  is_simulation: boolean;
  entries: unknown;
  photo_path: string | null;
}): HuntRecord {
  return {
    id: row.id,
    date: formatHuntDate(row.hunted_at),
    huntedAt: row.hunted_at,
    stateCode: row.state_code,
    state: row.state_name,
    zone: row.zone,
    isSimulation: row.is_simulation,
    entries: Array.isArray(row.entries) ? row.entries as HarvestEntry[] : [],
    photoPath: row.photo_path,
  };
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

export async function listHunts(): Promise<HuntRecord[]> {
  if (!supabase) return readDemoHunts();
  if (!navigator.onLine) return cachedHunts();
  const { data, error } = await supabase
    .from("hunts")
    .select("id,hunted_at,state_code,state_name,zone,is_simulation,entries,photo_path")
    .order("hunted_at", { ascending: false });
  if (error) {
    if (isConnectivityError(error)) return cachedHunts();
    throw error;
  }
  const records = await addPrivatePhotoUrls((data ?? []).map(rowToHuntRecord));
  cacheHunts(records);
  return records;
}

function offlineRecord(input: NewHuntRecord, huntedAt: string, id = `offline-${crypto.randomUUID()}`): HuntRecord {
  return {
    id,
    date: formatHuntDate(huntedAt),
    huntedAt,
    stateCode: input.stateCode,
    state: input.state,
    zone: input.zone,
    entries: input.entries,
    isSimulation: input.isSimulation,
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
  const birdCount = input.entries.reduce((sum, entry) => sum + entry.count, 0);

  if (!supabase) {
    const photoUrl = photo ? await blobToDataUrl(photo) : null;
    const record: HuntRecord = {
      id: crypto.randomUUID(),
      date: formatHuntDate(huntedAt),
      huntedAt,
      stateCode: input.stateCode,
      state: input.state,
      zone: input.zone,
      entries: input.entries,
      isSimulation: input.isSimulation,
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

  const { data, error } = await supabase
    .from("hunts")
    .insert({
      id: huntId,
      user_id: userData.user.id,
      hunted_at: huntedAt,
      state_code: input.stateCode,
      state_name: input.state,
      zone: input.zone,
      is_simulation: input.isSimulation,
      season_year: input.seasonYear ?? null,
      entries: input.entries,
      bird_count: birdCount,
      photo_path: photoPath,
      app_version: "1.39",
    })
    .select("id,hunted_at,state_code,state_name,zone,is_simulation,entries,photo_path")
    .single();
  if (error) {
    if (photoPath) await supabase.storage.from(HUNT_PHOTOS_BUCKET).remove([photoPath]);
    if (isConnectivityError(error) && !photo) return queueOfflineHunt(input, huntedAt);
    if (isConnectivityError(error)) throw new Error("Connect to the internet to save this photo, or remove it and save the hunt offline.");
    throw error;
  }
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
    const { error } = await supabase.from("hunts").insert({
      user_id: userData.user.id,
      hunted_at: item.huntedAt,
      state_code: item.input.stateCode,
      state_name: item.input.state,
      zone: item.input.zone,
      is_simulation: item.input.isSimulation,
      season_year: item.input.seasonYear ?? null,
      entries: item.input.entries,
      bird_count: birdCount,
      app_version: "1.39-offline-sync",
    });
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

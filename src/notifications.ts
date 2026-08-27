import { appConfig, isDemoMode, supabase } from "./services";

const DEMO_PREFERENCES_KEY = "blindiq-demo-notification-preferences-v1";
const DEMO_INBOX_KEY = "blindiq-demo-notification-inbox-v1";

export type NotificationPreferences = {
  userId: string;
  enabled: boolean;
  seasonAlerts: boolean;
  regulationAlerts: boolean;
  migrationAlerts: boolean;
  huntReminders: boolean;
  membershipAlerts: boolean;
  huntMilestones: boolean;
  followedStates: string[];
  followedFlyways: string[];
  migrationThreshold: number;
};

export type NotificationInboxItem = {
  id: string;
  eventType: string;
  title: string;
  body: string;
  url: string;
  priority: "urgent" | "normal" | "digest";
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type PushCapability = {
  supported: boolean;
  configured: boolean;
  permission: NotificationPermission | "unsupported";
  iosNeedsHomeScreen: boolean;
  installed: boolean;
};

function navigatorStandalone() {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function installedApp() {
  return window.matchMedia("(display-mode: standalone)").matches || navigatorStandalone();
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getPushCapability(): PushCapability {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const installed = installedApp();
  const iosNeedsHomeScreen = isIosDevice() && !installed;
  return {
    supported,
    configured: Boolean(appConfig.webPushPublicKey) || isDemoMode,
    permission: supported ? Notification.permission : "unsupported",
    iosNeedsHomeScreen,
    installed,
  };
}

function defaults(userId: string, defaultState = "MD"): NotificationPreferences {
  return {
    userId,
    enabled: false,
    seasonAlerts: true,
    regulationAlerts: true,
    migrationAlerts: true,
    huntReminders: true,
    membershipAlerts: true,
    huntMilestones: true,
    followedStates: [defaultState],
    followedFlyways: ["Atlantic", "Mississippi", "Central", "Pacific"],
    migrationThreshold: 65,
  };
}

function readDemoPreferences(defaultState = "MD") {
  try {
    const value = localStorage.getItem(DEMO_PREFERENCES_KEY);
    return value ? { ...defaults("demo-user", defaultState), ...JSON.parse(value) } as NotificationPreferences : defaults("demo-user", defaultState);
  } catch {
    return defaults("demo-user", defaultState);
  }
}

function readDemoInbox() {
  try {
    const value = localStorage.getItem(DEMO_INBOX_KEY);
    return value ? JSON.parse(value) as NotificationInboxItem[] : [];
  } catch {
    return [];
  }
}

function writeDemoInbox(items: NotificationInboxItem[]) {
  localStorage.setItem(DEMO_INBOX_KEY, JSON.stringify(items));
}

function rowToPreferences(row: Record<string, unknown>): NotificationPreferences {
  return {
    userId: String(row.user_id),
    enabled: Boolean(row.enabled),
    seasonAlerts: Boolean(row.season_alerts),
    regulationAlerts: Boolean(row.regulation_alerts),
    migrationAlerts: Boolean(row.migration_alerts),
    huntReminders: Boolean(row.hunt_reminders),
    membershipAlerts: Boolean(row.membership_alerts),
    huntMilestones: Boolean(row.hunt_milestones),
    followedStates: Array.isArray(row.followed_states) ? row.followed_states.filter((value): value is string => typeof value === "string") : [],
    followedFlyways: Array.isArray(row.followed_flyways) ? row.followed_flyways.filter((value): value is string => typeof value === "string") : [],
    migrationThreshold: Number(row.migration_threshold) || 65,
  };
}

function preferencesToRow(preferences: NotificationPreferences) {
  return {
    user_id: preferences.userId,
    enabled: preferences.enabled,
    season_alerts: preferences.seasonAlerts,
    regulation_alerts: preferences.regulationAlerts,
    migration_alerts: preferences.migrationAlerts,
    hunt_reminders: preferences.huntReminders,
    membership_alerts: preferences.membershipAlerts,
    hunt_milestones: preferences.huntMilestones,
    followed_states: preferences.followedStates,
    followed_flyways: preferences.followedFlyways,
    migration_threshold: preferences.migrationThreshold,
    updated_at: new Date().toISOString(),
  };
}

export async function ensureNotificationPreferences(defaultState = "MD") {
  if (!supabase) return readDemoPreferences(defaultState);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Log in to manage alerts.");
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userData.user.id).maybeSingle();
  if (error) throw error;
  if (data) return rowToPreferences(data);
  const initial = defaults(userData.user.id, defaultState);
  const { data: created, error: createError } = await supabase.from("notification_preferences").insert(preferencesToRow(initial)).select("*").single();
  if (createError) throw createError;
  return rowToPreferences(created);
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  if (!supabase) {
    localStorage.setItem(DEMO_PREFERENCES_KEY, JSON.stringify(preferences));
    return preferences;
  }
  const { data, error } = await supabase.from("notification_preferences").upsert(preferencesToRow(preferences), { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return rowToPreferences(data);
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function deviceLabel() {
  if (isIosDevice()) return "iPhone or iPad Home Screen";
  if (/Android/i.test(navigator.userAgent)) return "Android device";
  return "Web browser";
}

async function currentBrowserSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

async function saveBrowserSubscription(subscription: PushSubscription) {
  if (!supabase) return;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Log in before turning on alerts.");
  const serialized = subscription.toJSON();
  if (!serialized.keys?.p256dh || !serialized.keys?.auth) throw new Error("This device did not return valid push-encryption keys.");
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: userData.user.id,
    endpoint: subscription.endpoint,
    p256dh: serialized.keys.p256dh,
    auth_key: serialized.keys.auth,
    user_agent: navigator.userAgent.slice(0, 1000),
    device_label: deviceLabel(),
    enabled: true,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function enablePushNotifications(preferences: NotificationPreferences) {
  const capability = getPushCapability();
  if (!capability.supported) throw new Error("This browser does not support Web Push notifications.");
  if (capability.iosNeedsHomeScreen) throw new Error("On iPhone or iPad, add BlindIQ to your Home Screen first, then open the installed icon and turn on alerts.");
  if (!capability.configured) throw new Error("BlindIQ Web Push is not configured on this deployment yet.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "Notifications are blocked in this device’s browser settings." : "Notification permission was not granted.");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription && !isDemoMode) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(appConfig.webPushPublicKey) });
  }
  if (subscription) await saveBrowserSubscription(subscription);
  const saved = await saveNotificationPreferences({ ...preferences, enabled: true });
  if (isDemoMode) {
    await registration.showNotification("BlindIQ alerts are ready", { body: "Demo alerts are enabled on this device.", icon: "/icon-192.png", badge: "/icon-192.png", tag: "blindiq-demo-enabled", data: { url: "/?view=notifications" } });
  }
  return saved;
}

export async function disablePushNotifications(preferences: NotificationPreferences) {
  const subscription = await currentBrowserSubscription();
  if (subscription && supabase) await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  if (subscription) await subscription.unsubscribe();
  return await saveNotificationPreferences({ ...preferences, enabled: false });
}

export async function detachCurrentPushDevice() {
  const subscription = await currentBrowserSubscription();
  if (!subscription) return;
  // Remove the account-to-device link while the current user is still signed
  // in. The browser subscription itself stays available so another BlindIQ
  // account on the same device can opt in without an endpoint collision.
  if (supabase) await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
}

export async function syncCurrentPushDevice() {
  if (!supabase || !("Notification" in window) || Notification.permission !== "granted") return;
  const subscription = await currentBrowserSubscription();
  if (subscription) await saveBrowserSubscription(subscription);
}

function rowToInboxItem(row: Record<string, unknown>): NotificationInboxItem {
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    title: String(row.title),
    body: String(row.body),
    url: String(row.url || "/?view=notifications"),
    priority: row.priority === "urgent" || row.priority === "digest" ? row.priority : "normal",
    payload: typeof row.payload === "object" && row.payload ? row.payload as Record<string, unknown> : {},
    readAt: typeof row.read_at === "string" ? row.read_at : null,
    createdAt: String(row.created_at),
  };
}

export async function listNotificationInbox() {
  if (!supabase) return readDemoInbox();
  const { data, error } = await supabase.from("notification_inbox").select("id,event_type,title,body,url,priority,payload,read_at,created_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).map(rowToInboxItem);
}

export async function unreadNotificationCount() {
  if (!supabase) return readDemoInbox().filter((item) => !item.readAt).length;
  const { count, error } = await supabase.from("notification_inbox").select("id", { count: "exact", head: true }).is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const readAt = new Date().toISOString();
  if (!supabase) {
    writeDemoInbox(readDemoInbox().map((item) => item.id === id ? { ...item, readAt } : item));
    return;
  }
  const { error } = await supabase.from("notification_inbox").update({ read_at: readAt }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const readAt = new Date().toISOString();
  if (!supabase) {
    writeDemoInbox(readDemoInbox().map((item) => ({ ...item, readAt })));
    return;
  }
  const { error } = await supabase.from("notification_inbox").update({ read_at: readAt }).is("read_at", null);
  if (error) throw error;
}

export async function sendTestNotification() {
  if (!supabase) {
    const item: NotificationInboxItem = { id: crypto.randomUUID(), eventType: "test", title: "BlindIQ alerts are ready", body: "Your device can receive BlindIQ field updates.", url: "/?view=notifications", priority: "normal", payload: {}, readAt: null, createdAt: new Date().toISOString() };
    writeDemoInbox([item, ...readDemoInbox()]);
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(item.title, { body: item.body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "blindiq-demo-test", data: { url: item.url } });
    return;
  }
  const { data, error } = await supabase.functions.invoke("notification-test", { method: "POST" });
  if (error) throw error;
  if (!data?.sent) throw new Error(data?.error || "The test alert could not be delivered.");
}

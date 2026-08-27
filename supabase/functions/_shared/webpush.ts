import webpush from "npm:web-push@3.6.7";

export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export type BlindIqPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  eventType?: string;
  priority?: "urgent" | "normal" | "digest";
  data?: Record<string, unknown>;
};

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

let configured = false;

function configureWebPush() {
  if (configured) return;
  webpush.setVapidDetails(
    Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:office@blindiq.app",
    requireEnv("WEB_PUSH_PUBLIC_KEY"),
    requireEnv("WEB_PUSH_PRIVATE_KEY"),
  );
  configured = true;
}

export async function sendWebPush(subscription: StoredPushSubscription, payload: BlindIqPushPayload) {
  configureWebPush();
  return await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/?view=notifications",
      tag: payload.tag || `blindiq-${payload.eventType || "update"}`,
      eventType: payload.eventType || "update",
      priority: payload.priority || "normal",
      data: payload.data || {},
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    }),
    {
      TTL: payload.priority === "urgent" ? 60 * 60 * 12 : 60 * 60 * 48,
      urgency: payload.priority === "urgent" ? "high" : "normal",
      topic: (payload.tag || payload.eventType || "blindiq-update").slice(0, 32),
    },
  );
}

export function webPushStatusCode(error: unknown) {
  if (typeof error === "object" && error && "statusCode" in error) {
    const value = Number((error as { statusCode?: unknown }).statusCode);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

export function webPushErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1000);
  return String(error ?? "Unknown Web Push error").slice(0, 1000);
}

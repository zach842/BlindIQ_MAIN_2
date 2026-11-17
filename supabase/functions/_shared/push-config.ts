import { createClient } from "npm:@supabase/supabase-js@2.57.4";
type RuntimeConfig = Record<string, string>;
let cached: RuntimeConfig | null = null;
let expires = 0;
export async function getPushRuntime(): Promise<RuntimeConfig> {
  const keys = ["WEB_PUSH_PUBLIC_KEY", "WEB_PUSH_PRIVATE_KEY", "WEB_PUSH_SUBJECT", "NOTIFICATION_CRON_SECRET"];
  const environment = Object.fromEntries(keys.flatMap(key => Deno.env.get(key) ? [[key, Deno.env.get(key)!]] : []));
  if (environment.WEB_PUSH_PUBLIC_KEY && environment.WEB_PUSH_PRIVATE_KEY && environment.NOTIFICATION_CRON_SECRET) return environment;
  if (!cached || Date.now() >= expires) {
    const url = Deno.env.get("SUPABASE_URL"), secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !secret) throw new Error("Push server credentials are unavailable.");
    const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.rpc("blindiq_push_runtime_config");
    if (error || !data || typeof data !== "object") throw new Error("Push server configuration is unavailable.");
    cached = Object.fromEntries(keys.filter(key => typeof data[key] === "string").map(key => [key, data[key]]));
    expires = Date.now() + 5 * 60_000;
  }
  return { ...cached, ...environment };
}

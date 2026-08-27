import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { sendWebPush, webPushErrorMessage, webPushStatusCode } from "../_shared/webpush.ts";

function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Log in before sending a test notification." }, { status: 401, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ error: "Your session could not be verified." }, { status: 401, headers });
  }

  const { data: devices, error: deviceError } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth_key")
    .eq("user_id", userData.user.id)
    .eq("enabled", true);
  if (deviceError) return Response.json({ error: deviceError.message }, { status: 500, headers });
  if (!devices?.length) return Response.json({ error: "No enabled device was found. Turn on alerts first." }, { status: 409, headers });

  const eventKey = `test:${userData.user.id}:${crypto.randomUUID()}`;
  const { data: event, error: eventError } = await admin
    .from("notification_events")
    .insert({
      event_key: eventKey,
      event_type: "test",
      audience_kind: "user",
      target_user_id: userData.user.id,
      title: "BlindIQ alerts are ready",
      body: "Your device can now receive season, migration, hunt, membership, and regulation updates.",
      url: "/?view=notifications",
      status: "processing",
    })
    .select("id")
    .single();
  if (eventError) return Response.json({ error: eventError.message }, { status: 500, headers });

  await admin.from("notification_inbox").insert({
    event_id: event.id,
    user_id: userData.user.id,
    event_type: "test",
    title: "BlindIQ alerts are ready",
    body: "Your device can now receive season, migration, hunt, membership, and regulation updates.",
    url: "/?view=notifications",
  });

  let sent = 0;
  const failures: string[] = [];
  for (const device of devices) {
    try {
      await sendWebPush(device, {
        title: "BlindIQ alerts are ready",
        body: "Your device can now receive season, migration, hunt, membership, and regulation updates.",
        url: "/?view=notifications",
        tag: "blindiq-test",
        eventType: "test",
      });
      sent += 1;
      await admin.from("notification_deliveries").insert({
        event_id: event.id,
        user_id: userData.user.id,
        subscription_id: device.id,
        status: "sent",
        response_code: 201,
        delivered_at: new Date().toISOString(),
      });
    } catch (error) {
      const statusCode = webPushStatusCode(error);
      failures.push(webPushErrorMessage(error));
      await admin.from("notification_deliveries").insert({
        event_id: event.id,
        user_id: userData.user.id,
        subscription_id: device.id,
        status: statusCode === 404 || statusCode === 410 ? "expired" : "failed",
        response_code: statusCode,
        error_message: webPushErrorMessage(error),
      });
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").update({ enabled: false, updated_at: new Date().toISOString() }).eq("id", device.id);
      }
    }
  }

  await admin.from("notification_events").update({ status: "sent", processed_at: new Date().toISOString() }).eq("id", event.id);
  return Response.json({ sent, failed: failures.length, failures }, { status: sent ? 200 : 502, headers });
});

import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { sendWebPush, webPushErrorMessage, webPushStatusCode } from "../_shared/webpush.ts";

type EventRow = {
  id: string;
  event_type: string;
  audience_kind: "all" | "state" | "flyway" | "user";
  target_value: string | null;
  target_user_id: string | null;
  title: string;
  body: string;
  url: string;
  priority: "urgent" | "normal" | "digest";
  payload: Record<string, unknown>;
};

type PreferenceRow = {
  user_id: string;
  enabled: boolean;
  season_alerts: boolean;
  regulation_alerts: boolean;
  migration_alerts: boolean;
  hunt_reminders: boolean;
  membership_alerts: boolean;
  hunt_milestones: boolean;
  followed_states: string[];
  followed_flyways: string[];
  migration_threshold: number;
};

type MigrationSnapshotRow = {
  id: string;
  region_id: string;
  forecast_index: number;
  status: string;
  generated_at: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);

function easternDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function categoryEnabled(eventType: string, preference: PreferenceRow) {
  if (eventType.startsWith("season_")) return preference.season_alerts;
  if (eventType === "regulation_update") return preference.regulation_alerts;
  if (eventType === "migration_threshold") return preference.migration_alerts;
  if (eventType === "hunt_reminder") return preference.hunt_reminders;
  if (eventType === "membership_trial") return preference.membership_alerts;
  if (eventType === "hunt_milestone") return preference.hunt_milestones;
  return true;
}

async function queueEvent(row: Record<string, unknown>) {
  const { error } = await admin.from("notification_events").upsert(row, { onConflict: "event_key", ignoreDuplicates: true });
  if (error) throw error;
}

async function generateSeasonEvents(today: string) {
  const tomorrow = shiftDate(today, 1);
  const yesterday = shiftDate(today, -1);
  const { data, error } = await admin
    .from("notification_season_periods")
    .select("id,state_code,state_name,season_name,category,zone,start_date,end_date,data_status,source_url")
    .eq("active", true)
    .or(`start_date.eq.${today},start_date.eq.${tomorrow},end_date.eq.${today},end_date.eq.${yesterday}`);
  if (error) throw error;

  for (const period of data ?? []) {
    const provisional = period.data_status !== "current";
    const qualifier = provisional ? " Published dates are provisional—verify the official source." : " Verify zone details and current official rules before hunting.";
    if (period.start_date === tomorrow) {
      await queueEvent({ event_key: `season-opens-tomorrow:${period.id}:${period.start_date}`, event_type: "season_open_tomorrow", audience_kind: "state", target_value: period.state_code, title: `${period.state_name} ${period.season_name} opens tomorrow`, body: `${period.zone}.${qualifier}`, url: `/?view=dashboard&state=${period.state_code}`, priority: "urgent", payload: { periodId: period.id, stateCode: period.state_code, sourceUrl: period.source_url, provisional } });
    }
    if (period.start_date === today) {
      await queueEvent({ event_key: `season-open:${period.id}:${period.start_date}`, event_type: "season_open", audience_kind: "state", target_value: period.state_code, title: `${period.season_name} is now open in ${period.state_name}`, body: `${period.zone}.${qualifier}`, url: `/?view=dashboard&state=${period.state_code}`, priority: "urgent", payload: { periodId: period.id, stateCode: period.state_code, sourceUrl: period.source_url, provisional } });
    }
    if (period.end_date === today) {
      await queueEvent({ event_key: `season-last-day:${period.id}:${period.end_date}`, event_type: "season_closes_today", audience_kind: "state", target_value: period.state_code, title: `Last loaded day: ${period.season_name}`, body: `${period.zone} in ${period.state_name}.${qualifier}`, url: `/?view=dashboard&state=${period.state_code}`, priority: "urgent", payload: { periodId: period.id, stateCode: period.state_code, sourceUrl: period.source_url, provisional } });
    }
    if (period.end_date === yesterday) {
      await queueEvent({ event_key: `season-closed:${period.id}:${period.end_date}`, event_type: "season_closed", audience_kind: "state", target_value: period.state_code, title: `${period.season_name} segment has closed`, body: `${period.zone} in ${period.state_name}. Check BlindIQ for later splits and verify official rules.`, url: `/?view=dashboard&state=${period.state_code}`, priority: "normal", payload: { periodId: period.id, stateCode: period.state_code, sourceUrl: period.source_url, provisional } });
    }
  }
}

async function generateTrialEvents() {
  // This window catches subscriptions ending roughly tomorrow without baking
  // Eastern daylight/standard offsets into the scheduler.
  const start = new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("subscriptions").select("user_id,current_period_end").eq("status", "trialing").gte("current_period_end", start).lt("current_period_end", end);
  if (error) throw error;
  for (const subscription of data ?? []) {
    await queueEvent({ event_key: `trial-ends-tomorrow:${subscription.user_id}:${subscription.current_period_end}`, event_type: "membership_trial", audience_kind: "user", target_user_id: subscription.user_id, title: "Your BlindIQ trial ends tomorrow", body: "Your annual membership renews at $10.99 unless cancelled through Account → Manage or cancel free trial.", url: "/?view=account", priority: "urgent", payload: { currentPeriodEnd: subscription.current_period_end } });
  }
}

async function generateActiveHuntReminders() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("active_hunts").select("id,user_id,state_name,zone").eq("status", "active").is("reminder_sent_at", null).lte("started_at", fourHoursAgo).limit(500);
  if (error) throw error;
  for (const hunt of data ?? []) {
    await queueEvent({ event_key: `unfinished-hunt:${hunt.id}`, event_type: "hunt_reminder", audience_kind: "user", target_user_id: hunt.user_id, title: "Finish and save today’s hunt", body: `${hunt.state_name} • ${hunt.zone}. Open BlindIQ to finish or discard the active field log.`, url: "/?view=dashboard", priority: "normal", payload: { activeHuntId: hunt.id } });
    await admin.from("active_hunts").update({ reminder_sent_at: new Date().toISOString() }).eq("id", hunt.id);
  }
}

async function generateRegulationEvents() {
  const { data, error } = await admin.from("regulation_releases").select("id,state_code,season_year,version,title,summary,source_url").eq("status", "published").not("published_at", "is", null).order("published_at", { ascending: false }).limit(100);
  if (error) throw error;
  for (const release of data ?? []) {
    await queueEvent({ event_key: `regulation-release:${release.id}:${release.version}`, event_type: "regulation_update", audience_kind: "state", target_value: release.state_code, title: release.title, body: release.summary, url: `/?view=dashboard&state=${release.state_code}`, priority: "urgent", payload: { releaseId: release.id, stateCode: release.state_code, seasonYear: release.season_year, sourceUrl: release.source_url } });
  }
}

async function generateMigrationEvents() {
  const { data: regions, error: regionError } = await admin.from("migration_regions").select("id,flyway,name").eq("active", true);
  if (regionError) throw regionError;
  const { data: snapshots, error: snapshotError } = await admin.from("migration_snapshots").select("id,region_id,forecast_index,status,generated_at").eq("species_group", "all-waterfowl").order("generated_at", { ascending: false }).limit(200);
  if (snapshotError) throw snapshotError;
  const regionMap = new Map((regions ?? []).map((region) => [region.id, region]));
  const byRegion = new Map<string, MigrationSnapshotRow[]>();
  for (const snapshot of (snapshots ?? []) as MigrationSnapshotRow[]) {
    const rows = byRegion.get(snapshot.region_id) ?? [];
    if (rows.length < 2) rows.push(snapshot);
    byRegion.set(snapshot.region_id, rows);
  }
  for (const [regionId, rows] of byRegion) {
    if (rows.length < 2) continue;
    const [latest, previous] = rows;
    const current = Number(latest.forecast_index);
    const prior = Number(previous.forecast_index);
    if (current <= prior || current < 25) continue;
    const region = regionMap.get(regionId);
    if (!region) continue;
    await queueEvent({ event_key: `migration-rise:${latest.id}`, event_type: "migration_threshold", audience_kind: "flyway", target_value: region.flyway, title: `${region.flyway} Flyway movement reached ${current}/100`, body: `${region.name} is ${latest.status.toLowerCase()}. Migration Pulse is a planning forecast, not a promise of birds.`, url: "/?view=migration", priority: current >= 80 ? "urgent" : "normal", payload: { regionId, flyway: region.flyway, score: current, previousScore: prior, generatedAt: latest.generated_at } });
  }
}

async function generateHuntMilestones() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("hunts").select("id,user_id,state_name,zone,bird_count,hunted_at").eq("is_simulation", false).gte("created_at", oneDayAgo).gte("bird_count", 4).limit(500);
  if (error) throw error;
  for (const hunt of data ?? []) {
    await queueEvent({ event_key: `great-hunt:${hunt.id}`, event_type: "hunt_milestone", audience_kind: "user", target_user_id: hunt.user_id, title: `Great hunt—${hunt.bird_count} birds logged`, body: `${hunt.state_name} • ${hunt.zone}. Your hunt is saved in your BlindIQ field log.`, url: "/?view=history", priority: "normal", payload: { huntId: hunt.id, birdCount: hunt.bird_count }, deliver_at: new Date(new Date(hunt.hunted_at).getTime() + 15 * 60 * 1000).toISOString() });
  }
}

function audienceMatches(event: EventRow, preference: PreferenceRow) {
  if (!categoryEnabled(event.event_type, preference)) return false;
  if (event.audience_kind === "user") return preference.user_id === event.target_user_id;
  if (event.audience_kind === "state") return preference.followed_states.includes(event.target_value || "");
  if (event.audience_kind === "flyway") {
    if (!preference.followed_flyways.includes(event.target_value || "")) return false;
    if (event.event_type === "migration_threshold") {
      const score = Number(event.payload?.score ?? 0);
      const previous = Number(event.payload?.previousScore ?? 0);
      return score >= preference.migration_threshold && previous < preference.migration_threshold;
    }
  }
  return true;
}

async function deliverEvent(event: EventRow) {
  let preferenceQuery = admin.from("notification_preferences").select("user_id,enabled,season_alerts,regulation_alerts,migration_alerts,hunt_reminders,membership_alerts,hunt_milestones,followed_states,followed_flyways,migration_threshold");
  if (event.audience_kind === "user" && event.target_user_id) preferenceQuery = preferenceQuery.eq("user_id", event.target_user_id);
  const { data: preferenceData, error: preferenceError } = await preferenceQuery;
  if (preferenceError) throw preferenceError;
  const recipients = ((preferenceData ?? []) as PreferenceRow[]).filter((preference) => audienceMatches(event, preference));
  if (!recipients.length) return { recipients: 0, sent: 0, failed: 0 };
  const inboxRows = recipients.map((preference) => ({ event_id: event.id, user_id: preference.user_id, event_type: event.event_type, title: event.title, body: event.body, url: event.url, priority: event.priority, payload: event.payload, expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }));
  const { error: inboxError } = await admin.from("notification_inbox").upsert(inboxRows, { onConflict: "event_id,user_id", ignoreDuplicates: true });
  if (inboxError) throw inboxError;
  const pushRecipients = recipients.filter((preference) => preference.enabled).map((preference) => preference.user_id);
  if (!pushRecipients.length) return { recipients: recipients.length, sent: 0, failed: 0 };
  const { data: devices, error: deviceError } = await admin.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth_key").in("user_id", pushRecipients).eq("enabled", true);
  if (deviceError) throw deviceError;
  let sent = 0;
  let failed = 0;
  for (const device of devices ?? []) {
    const { data: existing } = await admin.from("notification_deliveries").select("status").eq("event_id", event.id).eq("subscription_id", device.id).maybeSingle();
    if (existing?.status === "sent") continue;
    try {
      await sendWebPush(device, { title: event.title, body: event.body, url: event.url, tag: `blindiq-${event.event_type}-${event.id}`, eventType: event.event_type, priority: event.priority, data: event.payload });
      sent += 1;
      await admin.from("notification_deliveries").upsert({ event_id: event.id, user_id: device.user_id, subscription_id: device.id, status: "sent", response_code: 201, error_message: null, attempted_at: new Date().toISOString(), delivered_at: new Date().toISOString() }, { onConflict: "event_id,subscription_id" });
    } catch (error) {
      failed += 1;
      const statusCode = webPushStatusCode(error);
      const expired = statusCode === 404 || statusCode === 410;
      await admin.from("notification_deliveries").upsert({ event_id: event.id, user_id: device.user_id, subscription_id: device.id, status: expired ? "expired" : "failed", response_code: statusCode, error_message: webPushErrorMessage(error), attempted_at: new Date().toISOString() }, { onConflict: "event_id,subscription_id" });
      if (expired) await admin.from("push_subscriptions").update({ enabled: false, updated_at: new Date().toISOString() }).eq("id", device.id);
    }
  }
  return { recipients: recipients.length, sent, failed };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expectedSecret = Deno.env.get("NOTIFICATION_CRON_SECRET");
  if (!expectedSecret || request.headers.get("x-cron-secret") !== expectedSecret) return new Response("Unauthorized", { status: 401 });
  const today = easternDate();
  const failures: string[] = [];
  for (const generate of [() => generateSeasonEvents(today), generateTrialEvents, generateActiveHuntReminders, generateRegulationEvents, generateMigrationEvents, generateHuntMilestones]) {
    try { await generate(); } catch (error) { failures.push(webPushErrorMessage(error)); }
  }

  // Recover events if a previous invocation stopped after claiming them.
  const staleProcessingCutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  await admin
    .from("notification_events")
    .update({ status: "pending", processing_started_at: null })
    .eq("status", "processing")
    .lt("processing_started_at", staleProcessingCutoff);

  const { data: events, error: eventError } = await admin.from("notification_events").select("id,event_type,audience_kind,target_value,target_user_id,title,body,url,priority,payload").eq("status", "pending").lte("deliver_at", new Date().toISOString()).order("deliver_at").limit(100);
  if (eventError) return Response.json({ error: eventError.message, failures }, { status: 500 });
  let sent = 0;
  let recipients = 0;
  let deliveryFailures = 0;
  let eventsProcessed = 0;
  for (const event of (events ?? []) as EventRow[]) {
    const { data: claimed, error: claimError } = await admin
      .from("notification_events")
      .update({ status: "processing", processing_started_at: new Date().toISOString() })
      .eq("id", event.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (claimError) {
      failures.push(claimError.message);
      continue;
    }
    if (!claimed) continue;
    eventsProcessed += 1;
    try {
      const result = await deliverEvent(event);
      sent += result.sent;
      recipients += result.recipients;
      deliveryFailures += result.failed;
      await admin.from("notification_events").update({ status: "sent", processed_at: new Date().toISOString() }).eq("id", event.id);
    } catch (error) {
      failures.push(webPushErrorMessage(error));
      await admin.from("notification_events").update({ status: "pending", processing_started_at: null }).eq("id", event.id);
    }
  }
  return Response.json({ date: today, eventsProcessed, recipients, pushesSent: sent, pushFailures: deliveryFailures, generatorOrProcessingFailures: failures }, { status: failures.length ? 207 : 200 });
});

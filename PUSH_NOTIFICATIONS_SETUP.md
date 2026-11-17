# Active installation — November 17, 2026

The production notification schema, nationwide upgrade, hunt-deletion policy and both notification functions are deployed. Private push settings are in Supabase Vault; a service-only security-invoker RPC reads only the named push settings. The processor also supports Edge environment variables. Vercel has only the public VAPID key. A 15-minute scheduler is installed. Device permission and an actual Send test receipt are still required; complete verified calendar coverage is not yet loaded.

Vault-based installs also apply `supabase/NOTIFICATION_VAULT_SETUP.sql`. Never grant its RPC to anon or authenticated. Existing VAPID keys must not be rotated casually.

The original setup instructions below describe the alternative Edge-environment configuration and the historical pre-activation state. Do not repeat key generation on this active installation.

# BlindIQ v1.66.0 — activate field alerts

## Observed production status (November 17, 2026)

The connected Supabase project has no notification tables and neither notification-process nor notification-test deployed. Therefore scheduled server pushes are NOT active. This package does not change hosted infrastructure or send messages.

## Activation order

1. Back up/review the existing project migration history. In the existing Supabase SQL editor, apply supabase/migrations/202608270001_web_push_notifications.sql if the tables are absent, then supabase/NOTIFICATION_NATIONWIDE_SETUP.sql. For a project where the old notification schema already exists, apply only the new upgrade SQL. It is idempotent. Keep existing user opt-ins: the upgrade does not automatically enable pushes, nationwide scope or logging nudges for existing accounts.
2. Generate one VAPID key pair using the official web-push tooling. Store WEB_PUSH_PRIVATE_KEY, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_SUBJECT (mailto:office@blindiq.app) and a random NOTIFICATION_CRON_SECRET as Supabase server secrets. Only the VAPID public key belongs in Vercel as VITE_WEB_PUSH_PUBLIC_KEY. Never put private keys, service-role credentials or the cron secret in GitHub/Vite/client code. Keep the same key pair for existing subscriptions; rotation requires re-subscription.
3. Deploy the included notification-test and notification-process Edge Functions, plus their _shared imports. They require gateway verify_jwt=false as specified in supabase/config.toml; each performs its own authentication (signed-in user for test; private x-cron-secret for processor). Use the installed Supabase CLI's --help to confirm current deploy/project flags before running commands. CLI v3 differs from older setup snippets.
4. Deploy the full app package through the existing manual GitHub flow, with the public VAPID key configured in Vercel. On an installed compatible device, explicitly choose Allow notifications and Send test. Do not enable the scheduler until a test push arrives with the app closed and opens the correct destination. On iPhone, use a supported iOS version and the installed Home Screen app; OS permission remains required.
5. Store notification_project_url and notification_cron_secret in Supabase Vault, using the same server cron secret. Apply supabase/cron/notification_process_schedule.sql to enable the 15-minute server job. It operates independently of whether the app is open. Review net.http responses/function logs after each job; HTTP 207 includes partial failures and is not an all-clear.
6. A signed x-cron-secret POST with JSON {"dry_run":true} to notification-process returns configuration/calendar metadata without generating events or sending pushes. It does not prove endpoint delivery, coverage completeness or VAPID key validity. Never paste the secret into a public URL.
7. Follow notifications/REVIEW_WORKFLOW.md to publish calendar rows and regulation releases. The legacy seed dates remain UNVERIFIED and will not produce season pushes. All-50-state source review is still required; no complete nationwide legal calendar is bundled.

## Behavior

- New accounts default to nationwide scope, but OS/server push remains off until enabled. Existing accounts retain scope. The all-50-state picker and nationwide toggle do not depend on residence.
- Season notices cover tomorrow, start date, final date and day after a segment ends using each reviewed hunting-zone time zone. Notices are calendar guidance, not a legal opening-time determination.
- Optional inactivity nudges are OFF by default, wait for 7/14/30 days without a saved live hunt and at least the same cooldown since the previous queued nudge, and use a varied 15-minute slot inside a chosen local hour between 8 AM and 8 PM. Nudges do not imply the user actually hunted. No continuous location collection is used. They can be skipped after an outage and do not catch up at night.
- Existing unfinished online waterfowl session reminders remain distinct from general inactivity nudges; old active sessions beyond 24 hours are excluded.
- Temporary delivery failures retry on later job runs, with a maximum of five recorded attempts. 404/410 subscriptions are disabled. Successful devices are skipped on retry. Event claims and unique keys limit duplicates, but a crash between provider acceptance and database acknowledgement can still duplicate a push: delivery is not exactly-once, nor can provider acceptance prove a person saw it.
- Season events expire when the hunting-zone calendar day changes; logging nudges expire when their selected local hour ends. Unsent late events are cancelled instead of sending stale wording. Regulation releases are manually published, not inferred from package uploads or scraped pages.
- Nationwide scope may create many notifications, one per applicable verified zone event. Users can switch to selected states and turn individual categories off. This release does not implement a national digest, global quiet hours or a daily push cap. Load-test throughput before a broad rollout; processor fan-out is serial and bounded by Edge runtime limits.

No real subscriber or live hunt was contacted during local verification. Live activation and all-state calendar verification remain outstanding.

# BlindIQ Migration Pulse setup

BlindIQ v1.41 includes the complete Atlantic and Mississippi Flyway interface, a safe seasonal preview, offline cache support, database tables, and an automated weather-driven updater. The website app runs immediately after deployment. Complete this one-time Supabase setup to replace the preview with automatic six-hour updates.

## What the first automated version measures

Migration Pulse combines:

- a transparent seasonal flyway baseline;
- National Weather Service wind direction and speed;
- 48-hour temperature change;
- precipitation and freezing-weather pressure; and
- broad North, Mid, and South monitoring regions in both flyways.

It reports **movement potential**, not confirmed bird counts or exact bird locations. BlindIQ does not ingest eBird, BirdCast, forum, or commercial observation data unless the appropriate commercial rights and attribution terms are approved.

## Step 1 — Apply the database migration

1. Open the BlindIQ project in Supabase.
2. Choose **SQL Editor**.
3. Choose **New query**.
4. Open `supabase/migrations/20260825135713_migration_pulse.sql` from this package.
5. Copy the entire file into the query editor.
6. Choose **Run**.

This creates six public planning regions, time-stamped forecast snapshots, private source observations, and private update-health logs. Row Level Security lets signed-in members read the region and forecast summaries while keeping raw update records server-only.

## Step 2 — Deploy the scheduled updater

From Terminal in the project folder, run:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy migration-refresh --no-verify-jwt
```

Your project reference is the part before `.supabase.co` in the Supabase Project URL.

The gateway JWT check is disabled because Supabase Cron is the caller. The function itself still requires a Supabase **secret API key** through its server-only authentication wrapper. Do not place that key in React, GitHub, Vercel, `.env.local`, or any variable beginning with `VITE_`.

## Step 3 — Store the scheduler credentials in Vault

In Supabase, open **Project Settings → API Keys** and copy a current **secret key**. It normally begins with `sb_secret_`. Never use the publishable key for the updater.

Then open **SQL Editor → New query** and run these two statements after replacing both placeholder values:

```sql
select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'migration_project_url'
);

select vault.create_secret(
  'sb_secret_REPLACE_WITH_YOUR_REAL_SECRET_KEY',
  'migration_secret_key'
);
```

Vault encrypts these values. They do not belong in the website app.

## Step 4 — Turn on the automatic schedule

1. Open `supabase/cron/migration_refresh_schedule.sql` from this package.
2. Copy the entire file into a new Supabase SQL Editor query.
3. Choose **Run**.

The updater will run four times per day. No GitHub commit or Vercel deployment is needed when the data refreshes.

## Step 5 — Run the first update immediately

Instead of waiting for the next scheduled time, run this in Supabase SQL Editor. It reads the encrypted values from Vault, so the secret key is not pasted into the request:

```sql
select net.http_post(
  url := (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'migration_project_url'
    limit 1
  ) || '/functions/v1/migration-refresh',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'apikey', (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'migration_secret_key'
      limit 1
    )
  ),
  body := '{}'::jsonb
);
```

The query returns a request ID because `pg_net` sends the request asynchronously. Wait approximately 15 seconds, then verify the tables in Step 6. A temporary National Weather Service failure can produce a `partial` result; successful regions are still retained.

## Step 6 — Verify the result

In **Table Editor**, confirm:

- `migration_regions` contains six rows;
- `migration_snapshots` contains fresh rows; and
- `migration_source_runs` shows `success` or `partial` with a recent completion time.

Then sign in to BlindIQ, open **Migration**, and confirm the banner says **AUTOMATIC UPDATE ACTIVE**. If the tables or updater are not ready, BlindIQ safely displays **PREVIEW MODEL** instead of breaking the app.

## Ongoing operation

- The website reads the newest snapshot automatically.
- The last successful snapshot is cached on the hunter's device for offline use.
- The update function isolates regional failures so one unavailable forecast does not erase the other flyway regions.
- The source-run table provides a basic operational audit trail.
- Adding a properly licensed observation or radar partner later will not require redesigning the member interface.

# Add Central and Pacific Flyways before deploying BlindIQ v1.52

This cumulative update works whether the live database currently has two flyways or already has Central. You do **not** need to recreate the scheduler, Vault secrets, VAPID keys, or Stripe settings.

## 1 — Add the new database regions

1. Open the BlindIQ project in Supabase.
2. Choose **SQL Editor → New query**.
3. Open `supabase/migrations/202608270003_add_pacific_flyway.sql` from this package.
4. Copy the entire file into the query editor.
5. Choose **Run** once.

The query expands the allowed flyways, inserts or updates all Central and Pacific planning regions, updates existing alert preferences, and verifies that both flyways contain three active regions.

## 2 — Update the automatic migration function

Open Terminal in the unzipped BlindIQ folder and run:

```bash
npx supabase login
npx supabase functions deploy migration-refresh \
  --project-ref bkspxwqtiaerhlsyvels \
  --no-verify-jwt
```

The existing six-hour schedule will call the updated twelve-region function automatically.

## 3 — Refresh and verify

Run the immediate-refresh query from Step 5 of `MIGRATION_PULSE_SETUP.md`, or wait for the next scheduled refresh. Then confirm:

- `migration_regions` contains **12 rows**;
- the `central-...` and `pacific-...` regions have recent snapshots;
- `migration_source_runs.regions_attempted` is **12**; and
- all four tabs show **AUTOMATIC UPDATE ACTIVE** after their data loads.

Pacific Flyway membership follows the U.S. Fish & Wildlife Service administrative structure. Colorado, Montana, New Mexico, and Wyoming are divided at the Continental Divide; an asterisk in BlindIQ marks those partial-state entries. Migration Pulse remains a planning estimate, not a legal-boundary or bird-location map.

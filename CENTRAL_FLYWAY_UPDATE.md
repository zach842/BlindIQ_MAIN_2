# Add the Central Flyway to an existing BlindIQ deployment

Use these steps if Atlantic and Mississippi Migration Pulse are already working. You do **not** need to recreate the scheduler, Vault secrets, VAPID keys, or Stripe settings.

## 1 — Add the Central Flyway database rows

1. Open your BlindIQ project in Supabase.
2. Choose **SQL Editor → New query**.
3. Open `supabase/migrations/202608270002_add_central_flyway.sql` from this package.
4. Copy the entire file into the query editor.
5. Choose **Run** once.

The query expands the allowed flyways, inserts the three Central Flyway planning regions, adds Central to existing alert preferences, and verifies that all three new regions exist.

## 2 — Update the automatic migration function

Open Terminal in the unzipped BlindIQ folder and run:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy migration-refresh --no-verify-jwt
```

The existing six-hour schedule will call the updated function automatically. No new schedule or Vault secret is required.

## 3 — Refresh immediately and verify

Run the immediate-refresh query from Step 5 of `MIGRATION_PULSE_SETUP.md`, or wait for the next scheduled refresh. Then confirm:

- `migration_regions` contains **9 rows**;
- the three `central-...` regions have recent rows in `migration_snapshots`;
- `migration_source_runs.regions_attempted` is **9**; and
- BlindIQ shows **AUTOMATIC UPDATE ACTIVE** on the Central tab.

The Central report is a broad planning summary. Official flyway boundaries divide portions of some western states, and the report is not a legal-boundary or bird-location map.

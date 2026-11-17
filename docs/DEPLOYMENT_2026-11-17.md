# Production deployment — November 17, 2026

The cleanup/v1.66 update was merged via PR #1 and Vercel deployed merge commit 4cdce7de7e7985181d31f78a370b4331666e8dbd successfully. The v1.66.1 follow-up connects server-side Vault settings and the public Vercel push key without committing any secret.

Hosted changes: base notification schema, nationwide preference/review upgrade, owner-only hunt deletion policy, service-only Vault runtime RPC, both notification Edge Functions and the 15-minute scheduler. The runtime RPC is security invoker and executable only by service_role; anon/authenticated execute checks both returned false. Private VAPID and cron settings are encrypted in Vault. No private value is included in the repository or browser bundle.

The live no-send processor diagnostic returned HTTP 200, pushConfigured=true, 25 legacy calendar rows and zero reviewed states. A real device must still grant permission and verify closed-app receipt using Send test. No successful end-user push delivery is claimed. Unreviewed season dates remain blocked and regulation notices need reviewed publication.

Local validation: 60 tests, production build and notification processor TypeScript compatibility check passed. The new PostgreSQL Vault test verifies service-only execution, invoker security and a named-setting whitelist. Existing cleanup/offline checks passed on the prior unchanged frontend flow.

Security advisors: the service-only event/delivery/release tables intentionally have RLS and no client policies ([linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). A pre-existing auth advisory for [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains outside this deployment; auth settings were not changed.

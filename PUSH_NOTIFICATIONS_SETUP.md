# BlindIQ field-alert setup

BlindIQ v1.52 includes a member notification center and installable website-app push alerts for:

- season openings, final loaded days, and segment closings;
- published regulation updates;
- Atlantic, Mississippi, Central, and Pacific Flyway movement thresholds;
- unfinished online hunts;
- seven-day trial expiration reminders; and
- saved live hunts with four or more birds.

The front end is complete, but push delivery requires this one-time Supabase and Vercel setup. The private Web Push key and scheduler secret must never be placed in GitHub or a variable beginning with `VITE_`.

## Step 1 — Apply the notification database update

1. Open the BlindIQ project in Supabase.
2. Choose **SQL Editor → New query**.
3. Open this file from the package:

   ```text
   supabase/migrations/202608270001_web_push_notifications.sql
   ```

4. Copy the entire file into Supabase and choose **Run** once.

This creates private device subscriptions, member preferences, the in-app notification center, delivery records, exact season-alert periods, regulation releases, and online active-hunt reminders. Row Level Security keeps each hunter's devices, preferences, active hunts, and notification inbox private.

The included exact season calendar covers the current source-backed Maryland, Virginia, North Dakota, and South Dakota periods. The other loaded states still receive regulation, membership, hunt, and followed-flyway alerts; add their exact season segments to `notification_season_periods` only after dates are verified.

## Step 2 — Generate the Web Push keys

In Terminal, run:

```bash
npx web-push generate-vapid-keys --json
```

The result contains one **publicKey** and one **privateKey**. Keep the private key secret. These two values are a permanent pair; do not generate a different pair for Vercel and Supabase.

## Step 3 — Add the server-only Supabase secrets

In Terminal from the BlindIQ project folder:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set WEB_PUSH_PUBLIC_KEY="YOUR_PUBLIC_KEY"
npx supabase secrets set WEB_PUSH_PRIVATE_KEY="YOUR_PRIVATE_KEY"
npx supabase secrets set WEB_PUSH_SUBJECT="mailto:office@blindiq.app"
npx supabase secrets set NOTIFICATION_CRON_SECRET="CREATE_A_LONG_RANDOM_SECRET"
```

The project reference is the text before `.supabase.co` in your Supabase Project URL. Make the cron secret a long random value and save it temporarily; the same value is added to Vault in Step 6.

## Step 4 — Deploy the two notification functions

Run:

```bash
npx supabase functions deploy notification-test --no-verify-jwt
npx supabase functions deploy notification-process --no-verify-jwt
```

`notification-test` manually verifies the signed-in member before sending. `notification-process` accepts only the private `x-cron-secret` header. Turning off the gateway check does not make either function publicly usable without those checks.

## Step 5 — Add the public key to Vercel

1. Open Vercel and choose the BlindIQ project.
2. Open **Settings → Environment Variables**.
3. Create:

   ```text
   VITE_WEB_PUSH_PUBLIC_KEY
   ```

4. Paste only the VAPID **publicKey** from Step 2.
5. Enable it for **Production** and **Preview**.
6. Save and redeploy the latest BlindIQ deployment.

Never put the private key or `NOTIFICATION_CRON_SECRET` in Vercel's `VITE_` variables.

## Step 6 — Store scheduler settings in Supabase Vault

Open **Supabase → SQL Editor → New query** and run this after replacing both placeholders:

```sql
select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'notification_project_url'
);

select vault.create_secret(
  'THE_SAME_LONG_RANDOM_SECRET_FROM_STEP_3',
  'notification_cron_secret'
);
```

## Step 7 — Turn on the automatic schedule

1. Open:

   ```text
   supabase/cron/notification_process_schedule.sql
   ```

2. Copy the whole file into a new Supabase SQL Editor query.
3. Choose **Run** once.

Supabase now checks due alerts every 15 minutes. Unique event keys prevent repeat sends when the scheduler checks the same season date, regulation release, hunt, or migration snapshot again.

## Step 8 — Test on a real device

1. Open the deployed HTTPS BlindIQ site and sign in with an active account.
2. On iPhone or iPad, use **ADD TO HOME SCREEN**, close Safari, and reopen BlindIQ from the installed icon. Apple requires this for website-app push alerts.
3. Open the bell beside the user bubble, or go to **Account → Field alerts**.
4. Choose **Allow notifications** and approve the phone/browser prompt.
5. Choose **Send test**.
6. Lock the phone or close BlindIQ and confirm the alert arrives.
7. Tap the alert and confirm BlindIQ opens its Notification Center.

Android and desktop browsers can normally enable alerts directly. The in-app Notification Center remains useful even if a browser does not support push.

## Publishing a regulation update

When BlindIQ publishes a reviewed regulation package or material correction, add a release row. The scheduler creates the alert automatically:

```sql
insert into public.regulation_releases
  (state_code, season_year, version, title, summary, source_url, status, published_at)
values
  ('MD', '2026–2027', '2026.09.01',
   'New 2026–2027 Maryland regulations are available',
   'BlindIQ updated the loaded dates and material restrictions. Review the changes and verify the official DNR source.',
   'https://dnr.maryland.gov/', 'published', now());
```

Use a new `version` value for each material release. Do not publish an alert for an unverified rumor, forum post, or cosmetic copy change.

## Ongoing safeguards

- Only members who explicitly allow alerts receive device push messages.
- Members can turn categories, states, flyways, or the entire device off at any time.
- Season alerts come only from exact rows in `notification_season_periods` and identify provisional data.
- Migration alerts fire only when a followed flyway crosses the hunter's chosen threshold; Migration Pulse remains a planning forecast, not a promise of birds.
- Expired browser endpoints are disabled automatically.
- Push notifications are an additional planning aid. Hunters must still verify current official regulations.

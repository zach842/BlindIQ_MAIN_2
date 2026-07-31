# Secure BlindIQ Membership Setup

The code is complete, but the database migration, Edge Function, secrets, and Stripe webhook must be activated in their dashboards before membership access can work.

## Part 1 — Create the Supabase tables

1. Open the BlindIQ project in Supabase.
2. Select **SQL Editor**.
3. Choose **New query**.
4. Open `supabase/migrations/202607290001_memberships.sql` from this project.
5. Copy the entire file into the SQL Editor.
6. Select **Run**.

This creates:

- `profiles`
- `subscriptions`
- Automatic profile/subscription records for new accounts
- Backfilled records for existing test accounts
- Row-level security policies

## Part 2 — Create the Stripe webhook function

Use either the Supabase Dashboard or CLI.

### Dashboard method

1. Open **Edge Functions** in Supabase.
2. Create a function named exactly:

   ```text
   stripe-webhook
   ```

3. Replace its sample code with the contents of:

   ```text
   supabase/functions/stripe-webhook/index.ts
   ```

4. Turn off JWT verification for this function. Stripe authenticates through its webhook signature instead.
5. Deploy the function.

The resulting endpoint is:

```text
https://bkspxwqtiaerhlsyvels.supabase.co/functions/v1/stripe-webhook
```

## Part 3 — Add secure Supabase secrets

In Supabase, open **Edge Functions → Secrets** and add:

```text
STRIPE_SECRET_KEY
```

Use the Stripe secret key from the same mode as the Payment Link. A live Payment Link requires a live secret key.

Do not place this key in Vercel, React source code, GitHub, screenshots, email, or chat.

You will add 'STRIPE_WEBHOOK_SECRET` after creating the Stripe endpoint.

## Part 4 — Register the webhook in Stripe

1. Open the Stripe Dashboard.
2. Make sure you are in the same Test or Live mode as the Payment Link.
3. Open **Developers → Webhooks**.
4. Add an endpoint:

   ```text
   https://bkspxwqtiaerhlsyvels.supabase.co/functions/v1/stripe-webhook
   ```

5. Subscribe to:

   ```text
   checkout.session.completed
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   ```

6. Save the endpoint.
7. Reveal and copy its signing secret beginning with `whsec_`.
8. Return to Supabase **Edge Functions → Secrets** and add:

   ```text
   STRIPE_WEBHOOK_SECRET
   ```

9. Paste the `whsec_` value there.
10. Redeploy `stripe-webhook` if Supabase requests it.

## Part 5 — Configure Vercel

Add these environment variables under **Vercel → BlindIQ → Settings → Environment Variables**:

```text
VITE_SUPABASE_URL=https://bkspxwqtiaerhlsyvels.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your Supabase publishable key
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/aFa8wP84abhXgfdawY48000
```

Apply them to Production, Preview, and Development, then redeploy.

## Part 6 — Configure return URLs

In Supabase **Authentication → URL Configuration**:

- Set Site URL to the production Vercel address.
- Add the production address and `http://localhost:5173/**` as redirect URLs.

In the Stripe Payment Link:

- Set after-payment behavior to redirect to the production BlindIQ address.
- Confirm promotion codes are enabled.

## Part 7 — Test securely

Use a new email address for a complete test:

1. Create a BlindIQ account.
2. Confirm the email.
3. Log in.
4. Open Account.
5. Start annual membership.
6. Enter promotion code `100Ducks`.
7. Complete checkout.
8. Return to BlindIQ.
9. Open Account and select **Refresh membership**.
10. Confirm the status becomes `active` and Start Hunt unlocks.

In Supabase, verify that the tester has:

- A row in `profiles`
- A row in `subscriptions`
- `status = active`
- Stripe customer and subscription IDs

## Security model

- The React app receives only publishable browser keys.
- The Stripe secret key remains in Supabase Edge Function secrets.
- Stripe signs every webhook request.
- The Edge Function rejects invalid signatures.
- The webhook uses the checkout `client_reference_id` to associate the Stripe subscription with the authenticated Supabase user.
- Row-level security allows each hunter to read only their own profile and subscription.
- Membership access is based on the verified database row, not a redirect URL or browser flag.

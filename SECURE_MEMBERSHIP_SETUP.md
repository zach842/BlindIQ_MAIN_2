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

You will add `STRIPE_WEBHOOK_SECRET` after creating the Stripe endpoint.

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

## Part 5 — Activate membership management and cancellation

### Configure the Stripe Customer Portal

1. Open the Stripe Dashboard in the same Live or Test mode used by the BlindIQ Payment Link.
2. Open **Settings → Billing → Customer portal**. If Stripe's navigation has changed, use the Dashboard search for **Customer portal**.
3. Activate the portal.
4. Enable customers to update payment methods and view billing history.
5. Enable **Cancel subscriptions**.
6. Choose whether cancellations happen immediately or at the end of the current billing period. For the seven-day trial, confirm a trialing member can cancel before the first charge.
7. Save the portal configuration.

### Deploy the authenticated Supabase function

1. Open **Edge Functions** in Supabase.
2. Create a function named exactly:

   ```text
   stripe-customer-portal
   ```

3. Replace the sample code with the complete contents of:

   ```text
   supabase/functions/stripe-customer-portal/index.ts
   ```

4. Keep JWT verification **on** for this function. Unlike the public Stripe webhook, this function is available only to a signed-in BlindIQ member.
5. Deploy the function.
6. Open **Edge Functions → Secrets** and add:

   ```text
   BLINDIQ_APP_URL=https://blindiq.app
   ```

The function reuses the existing `STRIPE_SECRET_KEY` in Supabase. Do not add the secret key to Vercel or React. It looks up `stripe_customer_id` from the authenticated member's own `subscriptions` row; the browser cannot submit a different Stripe customer ID.

The existing `stripe-webhook` function already handles `customer.subscription.updated` and `customer.subscription.deleted`. Those events keep the BlindIQ membership row synchronized after a portal cancellation.

## Part 6 — Configure Vercel

### Change the annual Stripe price to $10.99

1. In Stripe, open **Product catalog** and select the BlindIQ annual membership product.
2. Add a new price of **$10.99 USD** with **Recurring** billing and a **Yearly** interval.
3. Create a new Payment Link that uses that new yearly price.
4. Turn on **Include a free trial** and set the trial length to **7 days**.
5. Require a payment method during signup if the $10.99 annual membership should begin automatically when the trial ends unless the member cancels.
6. Turn on **Allow promotion codes** and confirm any customer-facing promotion code is eligible for this product.
7. Set the after-payment redirect to the production BlindIQ website.
8. Copy the new `price_...` ID and `https://buy.stripe.com/...` Payment Link into Vercel as described below.
9. Complete one checkout with a new email in Stripe test mode before replacing the live link.

Changing the words in BlindIQ does not change what Stripe charges. The Payment Link’s recurring price is the billing authority.

Add these environment variables under **Vercel → BlindIQ → Settings → Environment Variables**:

```text
VITE_SUPABASE_URL=https://bkspxwqtiaerhlsyvels.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your Supabase publishable key
VITE_STRIPE_PRICE_ID=price_REPLACE_WITH_10_99_ANNUAL_PRICE_ID
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/REPLACE_WITH_10_99_ANNUAL_LINK
```

Apply them to Production, Preview, and Development, then redeploy.

The Stripe price must be **$10.99 USD, recurring yearly**. Stripe price amounts are immutable, so create a new price and a new Payment Link instead of editing or reusing the previous link.

## Part 7 — Configure return URLs

In Supabase **Authentication → URL Configuration**:

- Set Site URL to the production Vercel address.
- Add the production address and `http://localhost:5173/**` as redirect URLs.

In the Stripe Payment Link:

- Set after-payment behavior to redirect to the production BlindIQ address.
- Confirm **Include a free trial** is enabled for **7 days**.
- Confirm whether the member must enter a payment method before starting the trial.
- Confirm promotion codes are enabled.

## Part 8 — Test securely

Use a new email address for a complete test:

1. Create a BlindIQ account.
2. Confirm the email.
3. Log in.
4. Open Account.
5. Start annual membership.
6. Confirm Stripe shows a seven-day free trial and the correct $10.99/year post-trial price.
7. Enter an active promotion code if testing a campaign.
8. Complete checkout.
9. Return to BlindIQ.
10. Open Account and select **Refresh membership**.
11. Confirm the status becomes `trialing` and Start Hunt unlocks.
12. Open Account and select **Manage or cancel free trial**.
13. Confirm Stripe's customer portal opens for the same member.
14. Cancel the trial in Stripe, return to BlindIQ, and select **Refresh membership**.
15. Confirm the status reflects the cancellation behavior selected in Stripe.

In Supabase, verify that the tester has:

- A row in `profiles`
- A row in `subscriptions`
- `status = trialing` during the seven-day trial, then `active` after the first successful payment
- Stripe customer and subscription IDs

## Security model

- The React app receives only publishable browser keys.
- The Stripe secret key remains in Supabase Edge Function secrets.
- Stripe signs every webhook request.
- The Edge Function rejects invalid signatures.
- The webhook uses the checkout `client_reference_id` to associate the Stripe subscription with the authenticated Supabase user.
- Row-level security allows each hunter to read only their own profile and subscription.
- Membership access is based on the verified database row, not a redirect URL or browser flag.
- The customer-portal function verifies the signed-in Supabase user and retrieves that user's Stripe customer ID server-side.
- Stripe creates a short-lived portal link for cancellation and billing changes; BlindIQ never receives card details.

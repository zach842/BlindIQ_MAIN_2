# BlindIQ

**HUNT. LOG. SHARE**

BlindIQ is a mobile-first digital field guide and field log for waterfowl hunters. Its core promise is simple: **Know the regulations. Log the birds. Save the hunts.** This React + Vite foundation includes authentication, 29 state field-guide dashboards, duck and goose regulation cards, a live hunt logger, remaining-harvest guidance, hunt summaries and history, and a seven-day free trial followed by a $10.99/year membership.

This package is **BlindIQ v1.56**. Dashboard season banners use machine-readable calendars across every loaded state with usable final dates. The banner distinguishes **Open Today**, **Partially Open**, and **Closed Today** from the waterfowl categories active on the selected date. States without enough complete, final zone dates show **Status Check Required** instead of incorrectly declaring every waterfowl season closed. This release also uses a uniquely named service worker so installed home-screen copies reliably replace the older v1.52 offline cache. Hunters can save an optional blind location/name, firearm used, and private notes with every live or test hunt. Migration Pulse continues to cover all four U.S. administrative flyways: Atlantic, Mississippi, Central, and Pacific.

> Important: BlindIQ is a hunting companion, not legal advice. State packages are versioned as current, tentative, or archived. Hunters must always verify current federal, state, local, WMA, refuge, permit, and emergency rules with the responsible wildlife agency before hunting.

## What works now

- Welcome, login, and account-creation screens
- Prominent seven-day free-trial messaging on welcome, login, signup, and membership screens
- Hunt-log-first welcome and authentication messaging
- Supabase email/password authentication when environment settings are present
- Automatic Stripe Checkout after signup or login for inactive members
- Secure **Manage or cancel free trial / membership** action for verified members
- Stripe-hosted cancellation, payment-method, invoice, and billing management without exposing secret keys in the browser
- Demo-mode fallback when Supabase settings are absent
- Twenty-nine selectable states: Arkansas, California, Delaware, Florida, Idaho, Illinois, Iowa, Kansas, Louisiana, Maryland, Michigan, Minnesota, Missouri, Montana, Nebraska, New Jersey, New York, North Carolina, North Dakota, Ohio, Oregon, Pennsylvania, South Carolina, South Dakota, Texas, Virginia, Washington, West Virginia, and Wisconsin
- Alphabetical state choices on both the dashboard and account settings screens
- Required click-to-accept Terms of Use and User Agreement during account creation
- Agreement version and acceptance time recorded with new Supabase accounts
- Optional **Remember this device for 30 days** access during signup and login
- Automatic restoration of an authenticated Supabase session on that device
- Current-tab-only access when device remembrance is not selected
- Remembered-device data and the local session cleared immediately at logout
- User-selectable default hunting state saved to the Supabase profile
- Improved compact BlindIQ wordmark contrast in the app header
- Clearly labeled **ADD TO HOME SCREEN** action beside the user bubble
- Automatic post-login **Add BlindIQ to Your Home Screen** prompt, shown once per browser session until installed
- Step-by-step home-screen instructions for both iPhone and Android
- Native Android install prompt when the browser makes it available
- Dedicated opaque iPhone, Android, and Android maskable home-screen icons
- Installable web-app manifest and update-aware offline service worker
- Cached app shell, loaded regulations, and complete in-app bird-reference library for offline field access after the first connected load
- Offline hunt-saving queue with automatic Supabase synchronization when the device reconnects
- Visible offline banner and unsynced-hunt labels so field status is never ambiguous
- Date-aware dashboard status with separate **Open Today**, **Partially Open**, **Closed Today**, and **Status Check Required** banners
- Machine-readable banner calendars for all 27 loaded states with usable active-season dates, tested across every date boundary in the loaded 2026–2027 season
- Safe incomplete-data treatment for Delaware and New York, plus archived-data treatment for West Virginia, so missing dates are never presented as a confirmed statewide closure
- North Dakota’s complete structured 2026–2027 waterfowl calendar, including its August early Canada goose zones
- South Dakota’s final 2026–2027 duck, goose, youth, swan, snipe and light-goose calendar, four duck zones, two regular goose units, August resident management take, nonresident unit guidance, and Traditional-versus-Three-Duck warnings
- Weather and forecast controls removed from the current interface for a more focused dashboard
- Banner status and detailed loaded season dates remain separate so hunters can see both today’s summary and the underlying zone-specific periods
- Duck and goose seasons, zones, shooting hours, bag rules, and official links
- Reviewed agency and eRegulations links for the newly audited state packages
- Full 2026–27 Virginia, North Carolina, and South Carolina waterfowl packages
- Complete provisional Maryland package with its federal-approval warning
- Delaware proposal options clearly separated from final regulations
- Corrected 2026 Minnesota youth/early-goose dates and pintail limit
- Start Hunt flow with zone selection
- Separate **Test Hunt** action for off-season practice
- Test records visibly labeled and excluded from live hunt and harvest totals
- Add and remove harvested birds
- Public-domain USFWS reference thumbnails replace the letter placeholders in the hunt logger
- In-app **Not sure?** field guide with reference photographs, concise identification markers, filters, source credit, and a link to the complete official USFWS guide
- Representative group photos are visibly marked when a regulation uses a broad category instead of an exact species
- State- and zone-aware aggregate duck limits, including Montana’s seven-bird Pacific Flyway bag
- Species, sex, parent-species, and zone-specific bag-limit logic
- Live list of birds that remain available under loaded demo rules
- Hunt summary and permanent account-scoped Supabase history
- Optional blind location/name, firearm used, and 2,000-character notes on the Save Hunt screen
- Field details retained in demo mode, offline hunt queues, Supabase synchronization, and My Hunts
- Optional harvest-photo capture or camera-roll selection on the Save Hunt screen
- In-browser photo resizing and compression before upload
- Private, account-owned Supabase Storage photos with short-lived signed viewing links in My Hunts
- Branded 1080 × 1350 hunt-share card generated privately in the browser
- Native phone sharing to compatible installed apps such as Facebook, Instagram, Messages, and Mail
- Separate image-download fallback for browsers that do not support file sharing
- Shared cards include state and zone but never precise GPS coordinates
- Zero-bird hunt saving
- Demo-mode hunt persistence in local browser storage
- **Better the Community** form for regulation errors, app bugs, feature ideas, and general feedback
- End-of-dashboard and Account links to the community form, with context-aware Back navigation
- Prepared feedback and support emails addressed to office@blindiq.app
- Group Hunt Mode — In Development preview directly below Test Hunt
- Migration Pulse for all four U.S. administrative flyways
- North, Mid, and South monitoring regions in each flyway, including official divided-state labeling for Central and Pacific
- Weather-driven 48-hour movement potential using current National Weather Service forecasts and a transparent seasonal baseline
- Clearly labeled live, cached, and preview modes—without presenting modeled conditions as confirmed bird observations
- Automatic six-hour Supabase refresh scaffolding, source-run health logs, and server-only raw observations
- Offline access to the last successfully loaded Migration Pulse snapshot
- Member-controlled Field Alerts page and in-app Notification Center
- Web Push support for installed iPhone/iPad website apps, Android, and compatible desktop browsers
- Automated season, regulation, Migration Pulse, unfinished-hunt, trial, and saved-hunt milestone events
- State, flyway, alert-category, and migration-threshold preferences
- Visible v1.56 markers beneath the dashboard feedback card and at the bottom of Account for deployment confirmation
- Account and seven-days-free, then $10.99/year annual membership presentation
- Supabase and Stripe environment placeholders
- Responsive phone, tablet, and desktop design

## 1. Install Node.js

Node.js is the program that runs the app on your computer.

1. Visit [nodejs.org](https://nodejs.org/).
2. Download the current **LTS** version (version 20 or newer).
3. Open the downloaded installer and accept the defaults.
4. Restart your terminal after installation.
5. Confirm it worked:

   ```bash
   node --version
   npm --version
   ```

## 2. Run BlindIQ locally

1. Download or clone this project.
2. Open Terminal.
3. Move into the project folder. Example:

   ```bash
   cd path/to/blindiq
   ```

4. Install the project:

   ```bash
   npm install
   ```

5. Start it:

   ```bash
   npm run dev
   ```

6. Open the **Local** address shown in Terminal, normally:

   ```text
   http://localhost:5173
   ```

Demo login:

```text
Username: hunter
Password: confidence
```

### Test 30-day device remembrance

1. Log in with **Remember this device for 30 days** selected.
2. Close the browser tab, reopen BlindIQ, and confirm the app restores the account automatically.
3. Log out and reopen BlindIQ; the welcome screen should appear.
4. Log in again with the option cleared. A refresh in the same tab remains active, but closing that tab ends device remembrance.

BlindIQ stores an authenticated Supabase session and a 30-day expiration time in that browser. It never stores the hunter's password. Private browsing, cleared website data, browser privacy controls, or manual logout can end remembrance earlier.

## 3. Test on an iPhone or Android phone over Wi-Fi

1. Connect the computer and phone to the same Wi-Fi network.
2. Run:

   ```bash
   npm run dev
   ```

3. Terminal will show both a **Local** and **Network** address.
4. On the phone, open Safari or Chrome.
5. Type the Network address exactly, for example:

   ```text
   http://192.168.1.25:5173
   ```

6. Keep the terminal running while you test.

If the phone cannot connect, make sure both devices are on the same non-guest network and approve any firewall prompt on the computer. Some business, hotel, and guest networks block device-to-device connections.

### Add BlindIQ to an iPhone home screen

For the most reliable test, use the live HTTPS Vercel address.

1. Open BlindIQ in **Safari**.
2. Log in and tap **ADD TO HOME SCREEN** beside the user bubble.
3. Read the iPhone instructions, then close the guide.
4. Tap Safari's **Share** button—the square with the upward arrow.
5. Scroll down and tap **Add to Home Screen**.
6. Tap **Add**.

### Add BlindIQ to an Android home screen

1. Open BlindIQ in **Chrome**.
2. Log in and tap **ADD TO HOME SCREEN** beside the user bubble.
3. If **Install BlindIQ now** appears, tap it and confirm installation.
4. Otherwise, open Chrome's three-dot menu.
5. Tap **Install app** or **Add to Home screen**.
6. Confirm the installation.

After installation, BlindIQ opens in its own app-style window. The **ADD TO HOME SCREEN** action remains available so the device instructions can always be reopened. Browser wording can vary slightly by phone and operating-system version.

### Test offline field mode

1. While connected to the internet, open the deployed BlindIQ site and log in.
2. Add BlindIQ to the phone's Home Screen and open it once from the new icon.
3. Browse the selected state's dashboard and open the bird field guide once.
4. Turn on Airplane Mode or disable Wi-Fi and mobile data.
5. Reopen BlindIQ from the Home Screen. The app, loaded regulation data, and bird references should remain available.
6. Save a hunt without a photo while offline. It will appear in My Hunts with an **OFFLINE** label.
7. Restore service and leave BlindIQ open. The queued hunt will upload automatically and the label will clear after history refreshes.

The first login, membership checkout, account verification, regulation updates, first app load, and harvest-photo upload require internet access. Hunts without photos can still be queued offline. If a photo is selected while offline, BlindIQ asks the hunter to reconnect or remove the photo before saving. Offline mode uses the last app and regulation package successfully loaded on that device, so hunters must reconnect before a hunt to receive the newest published release.

## 4. Upload to GitHub

### Easiest method: GitHub Desktop

1. Create a free account at [github.com](https://github.com/).
2. Install [GitHub Desktop](https://desktop.github.com/).
3. Open GitHub Desktop and sign in.
4. Choose **File → Add Local Repository**.
5. Select the BlindIQ project folder.
6. If prompted, choose **Create a repository**.
7. Name it `blindiq`.
8. Enter a commit message such as `Initial BlindIQ app`.
9. Click **Commit to main**.
10. Click **Publish repository**.
11. Leave it private while developing, unless you intentionally want the code public.

Never upload a real `.env` file. This project already ignores it.

## 5. Deploy with Vercel

1. Go to [vercel.com](https://vercel.com/) and choose **Sign Up with GitHub**.
2. Click **Add New → Project**.
3. Import the `blindiq` GitHub repository.
4. Vercel should detect **Vite** automatically.
5. Keep these settings:

   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

6. Do not add environment variables yet if you want demo mode.
7. Click **Deploy**.
8. Vercel will provide a public HTTPS address.

Every later push to the `main` branch will automatically update the live Vercel site.

## 6. Environment settings

Copy `.env.example` to a new file named `.env` only when connecting services:

```bash
cp .env.example .env
```

Expected values:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_ID=
VITE_STRIPE_CHECKOUT_URL=
VITE_WEB_PUSH_PUBLIC_KEY=
```

- Blank values keep the app in demo mode.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` connect authentication.
- `VITE_STRIPE_PRICE_ID` identifies the $10.99 recurring annual price in Stripe.
- `VITE_STRIPE_CHECKOUT_URL` can temporarily point to a Stripe Payment Link.
- `VITE_WEB_PUSH_PUBLIC_KEY` is the public half of the Web Push VAPID key pair. The private half stays only in Supabase.

After creating the new $10.99 recurring annual Stripe price and Payment Link, set:

```text
VITE_STRIPE_PRICE_ID=price_REPLACE_WITH_10_99_ANNUAL_PRICE_ID
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/REPLACE_WITH_10_99_ANNUAL_LINK
```

The Stripe Payment Link must use the $10.99 yearly recurring price, include a **seven-day free trial**, and have promotion codes enabled for any active customer-facing promotion code.

For production, membership entitlement must be confirmed server-side with Stripe webhooks. A browser environment variable alone must never be trusted to decide whether a customer has active access.

### Stripe price-change checklist

Stripe does not allow an existing price amount to be edited. Create a new **$10.99 USD recurring yearly** price and a new Payment Link, then replace `VITE_STRIPE_CHECKOUT_URL` in Vercel. Update `VITE_STRIPE_PRICE_ID` to the new `price_...` identifier for configuration consistency. The existing Stripe webhook endpoint and signing secret remain valid when the new price and link are created in the same Stripe account; the webhook records the price actually used by the subscription.

Existing subscriptions do not automatically move to a new price. Decide separately whether existing members keep their original renewal price or whether each existing subscription should be migrated to the new yearly price. Review proration and customer notice before migrating active subscriptions.

### Seven-day Stripe trial checklist

1. Open the current $10.99 yearly subscription Payment Link in Stripe.
2. Edit its subscription options and turn on **Include a free trial**.
3. Set the trial length to **7 days**.
4. Require a payment method during signup if the membership should begin automatically after the trial unless the member cancels.
5. Confirm the post-checkout redirect points to the production BlindIQ address and save the link.
6. If Stripe creates a different Payment Link URL, replace `VITE_STRIPE_CHECKOUT_URL` in Vercel and redeploy.

The existing membership webhook already recognizes Stripe's `trialing` status as authorized access. Test the full flow with a new email address before advertising the offer.

### Stripe customer portal and cancellation

BlindIQ v1.52 includes a **Manage or cancel free trial** button for trialing members and a **Manage or cancel membership** button for active members. These buttons open Stripe's secure customer portal; BlindIQ never handles card details directly.

Activation requires three dashboard steps:

1. In Stripe, activate the Customer Portal and enable **Cancel subscriptions**.
2. In Supabase, deploy `supabase/functions/stripe-customer-portal/index.ts` as an Edge Function named `stripe-customer-portal` with JWT verification kept **on**.
3. In Supabase Edge Function secrets, add `BLINDIQ_APP_URL=https://blindiq.app`. The existing `STRIPE_SECRET_KEY` is reused server-side.

No new Vercel environment variable is required. The existing `stripe-webhook` function already listens for `customer.subscription.updated` and `customer.subscription.deleted`, so a cancellation made in Stripe is written back to the BlindIQ membership record.

## v1.38 regulation sources

- **South Dakota:** [South Dakota GFP waterfowl hub](https://gfp.sd.gov/waterfowl/), [official 2026 key dates](https://gfp.sd.gov/events/keydates/), [final April 2026 Commission Book](https://gfp.sd.gov/UserDocs/nav/April_2026_Commission_Book.pdf), [2026 nonresident guide](https://gfp.sd.gov/UserDocs/nav/NonresidentWaterfowl_.pdf), [duck-limit choices](https://gfp.sd.gov/three-duck-limit/), and [youth waterfowl rules](https://gfp.sd.gov/youth-waterfowl/)
- When the general GFP waterfowl landing page conflicts with the later final 2026 Commission action, BlindIQ uses the final action. That is why v1.38 shows an eight-bird Canada goose limit for the August Management Take and Early Fall season rather than an older fifteen-bird value.

## v1.23 regulation sources

- **Idaho:** [Idaho Fish and Game 2026–27 migratory game-bird regulations](https://idfg.idaho.gov/rules/migratory) and [official brochure PDF](https://idfg.idaho.gov/sites/default/files/migratorygame2026-2027_web.pdf)
- **Oregon:** [ODFW 2026–27 migratory game-bird seasons](https://www.eregulations.com/oregon/hunting/game-bird/migratory-game-bird-seasons), [zone maps](https://www.eregulations.com/oregon/hunting/game-bird/migratory-game-bird-zone-maps), and [Northwest Permit Goose rules](https://www.eregulations.com/oregon/hunting/game-bird/northwest-permit-goose-season)
- **Washington:** [WDFW 2026–27 game-bird regulations](https://wdfw.wa.gov/hunting/regulations/migratory-waterfowl-upland-game), [WAC 220-416-060](https://app.leg.wa.gov/wac/default.aspx?cite=220-416-060), and [WDFW Hunt Planner](https://geodataservices.wdfw.wa.gov/hunt-planner/)

## v1.22 regulation sources

- **California:** [CDFW 2026–27 waterfowl seasons and limits](https://wildlife.ca.gov/Hunting/Waterfowl)
- **Florida:** [FWC/eRegulations 2026–27 migratory bird seasons and limits](https://www.eregulations.com/florida/hunting/migratory-bird-hunting-regulations/)
- **Iowa:** [Iowa DNR 2026–27 migratory game bird seasons](https://www.iowadnr.gov/things-do/hunting-trapping/types-hunting-trapping/migratory-game-bird-hunting)
- **Michigan:** [Michigan DNR 2026 Waterfowl Hunting Regulations Summary](https://www.michigan.gov/dnr/managing-resources/laws/regulations/waterfowl)
- **Missouri:** [MDC 2026–27 commission-approved season selections](https://mdc.mo.gov/newsroom/mdc-sets-upcoming-migratory-game-bird-waterfowl-seasons-4)
- **Nebraska:** [Nebraska Game and Parks 2026–27 waterfowl seasons](https://outdoornebraska.gov/hunt/hunting-seasons/)
- **New Jersey:** [NJ Fish & Wildlife 2026–27 migratory game bird hub](https://dep.nj.gov/njfw/hunting/waterfowl-and-migratory-birds-in-new-jersey/)
- **Ohio:** [Ohio DNR 2026–27 hunting season table](https://dam.assets.ohio.gov/image/upload/ohiodnr.gov/documents/wildlife/news/2026-27_Hunting_Seasons.pdf)

## v1.14 regulation sources

- **Wisconsin:** [Wisconsin DNR 2026 migratory game-bird dates and limits](https://dnr.wisconsin.gov/topic/Hunt/regulations/OnlineHuntingRegulations?page=8)
- **Illinois:** [Illinois DNR waterfowl resources](https://dnr.illinois.gov/hunting/waterfowlhunting.html). The zone structure and dates are official; the app displays a preseason notice until the final 2026–2027 bag-limit digest is published.
- **Montana:** [Montana FWP 2026 migratory-bird regulations](https://fwp.mt.gov/hunt/regulations/migratory-bird)
- **Minnesota:** [Minnesota DNR 2026 waterfowl seasons and daily limits](https://www.dnr.state.mn.us/hunting/waterfowl/index.html)
- **Kansas:** [Kansas Wildlife & Parks 2026–2027 duck seasons and limits](https://www.ksoutdoors.gov/outdoor-activities/hunting-in-kansas/what-to-hunt/migratory-birds/ducks)

Every official source remains linked from its state dashboard so hunters can verify the loaded package before hunting.

## 7. Production integration plan

The current `src/services.ts` file is the boundary for live services:

1. Configure Supabase Site URL and allowed redirect URLs for local and deployed environments.
2. Add a protected profiles table if usernames must be unique.
3. Store hunts and harvest entries in Supabase Postgres.
4. Create the annual Stripe price.
5. Start checkout through a protected server or Supabase Edge Function.
6. Use a Stripe webhook to write subscription status to the database.
7. Add row-level security so hunters can access only their own records.
8. Replace demo regulation packages with reviewed, season-versioned data.

## Secure membership deployment

The secure Stripe webhook, subscription schema, row-level security policies, and membership gating are included. Follow `SECURE_MEMBERSHIP_SETUP.md` to activate them in Supabase and Stripe.

## Activate all four Migration Pulse flyways

The member interface works immediately in a clearly marked seasonal preview mode. To activate automatic National Weather Service updates, follow `MIGRATION_PULSE_SETUP.md`. The one-time setup applies:

- `supabase/migrations/20260825135713_migration_pulse.sql` for the secured database tables;
- `supabase/migrations/202608270002_add_central_flyway.sql` is retained for anyone who previously deployed the Central-only v1.51 update;
- `supabase/migrations/202608270003_add_pacific_flyway.sql` is the current cumulative Central + Pacific update for an existing two-flyway deployment. If v1.51 was never deployed, run only this file;
- `supabase/functions/migration-refresh/index.ts` for the server-only updater; and
- `supabase/cron/migration_refresh_schedule.sql` for the six-hour schedule.

Once configured, Supabase refreshes Migration Pulse without a GitHub upload or Vercel redeployment. A secret Supabase API key is stored only in Supabase Vault and must never be placed in the React app or a `VITE_` environment variable.

## Apply the default-state and agreement database update

Before deploying this version, open **Supabase → SQL Editor → New query**. Copy the complete contents of:

```text
supabase/migrations/202608040001_default_state_and_terms.sql
```

Paste it into the query editor and click **Run** once. This adds the default state and agreement-acceptance fields to user profiles. Do this before asking testers to create new accounts with this version.

The included agreement is a product-specific working draft, not a substitute for legal advice. Have a qualified attorney review the agreement, business name/entity, governing-law provision, privacy practices, and subscription terms before broad commercial launch.

## Activate website-app push alerts

The notification interface is included in the build. Complete the one-time database, VAPID-key, Edge Function, Vercel variable, and 15-minute scheduler setup in `PUSH_NOTIFICATIONS_SETUP.md`. Push delivery will not begin until those steps are completed.

## Apply the private hunt-photo database update

Before deploying this version, open **Supabase → SQL Editor → New query**. Copy the complete contents of:

```text
supabase/migrations/20260823235658_hunt_photos.sql
```

Paste it into the query editor and click **Run** once. This adds the optional photo path to each hunt, creates a private `hunt-photos` Storage bucket with a 5 MB JPEG limit, and installs user-owned upload, view, and delete policies. Run this migration **before** deploying the new front end; otherwise My Hunts cannot read the new `photo_path` field.

No new Vercel environment variable is required. The existing signed-in Supabase account controls access. Harvest photos are compressed in the browser and stored in a folder belonging to that user; the app creates a short-lived private viewing link when My Hunts loads.

## Project structure

```text
src/
├── App.tsx       Screens, navigation, and interactive hunt flow
├── data.ts       Season-versioned state regulations and bird rules
├── legal.ts      Versioned Terms of Use and User Agreement
├── huntPhotos.ts Private harvest-photo validation and compression
├── location.ts   Reserved location/forecast service for a possible future release; not currently shown
├── migration.ts  All four flyways, region types, and transparent preview model
├── MigrationPage.tsx Migration Pulse interface and source transparency
├── notifications.ts Browser push registration, preferences, and inbox services
├── NotificationsPage.tsx Member Field Alerts and Notification Center interface
├── seasonStatus.ts Date-aware state season-status resolver
├── services.ts   Supabase/Stripe configuration boundary
├── styles.css    BlindIQ design system and responsive layout
├── types.ts      Shared data types
└── main.tsx      React entry point
```

## Useful commands

```bash
npm run dev      # Start local development
npm run build    # Create and verify a production build
npm run preview  # Preview the production build
```

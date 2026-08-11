# BlindIQ

**HUNT WITH CONFIDENCE**

BlindIQ is a mobile-first waterfowl hunting companion. This React + Vite foundation includes authentication, 17 state dashboards, duck and goose regulation cards, a live hunt logger, remaining-harvest guidance, hunt summaries and history, and a $14.99/year membership.

This package is **BlindIQ v1.19**. It adds a dedicated **Better the Community** feedback experience while retaining the reviewed 2026–27 regulation update, alphabetical 17-state selectors, and hunt-log-first experience.

> Important: BlindIQ is a hunting companion, not legal advice. State packages are versioned as current, tentative, or archived. Hunters must always verify current federal, state, local, WMA, refuge, permit, and emergency rules with the responsible wildlife agency before hunting.

## What works now

- Welcome, login, and account-creation screens
- Hunt-log-first welcome and authentication messaging
- Supabase email/password authentication when environment settings are present
- Automatic Stripe Checkout after signup or login for inactive members
- Demo-mode fallback when Supabase settings are absent
- Seventeen selectable states: Maryland, Delaware, Virginia, North Carolina, Pennsylvania, New York, West Virginia, South Carolina, Louisiana, Texas, Arkansas, North Dakota, Wisconsin, Illinois, Montana, Minnesota, and Kansas
- Alphabetical state choices on both the dashboard and account settings screens
- Required click-to-accept Terms of Use and User Agreement during account creation
- Agreement version and acceptance time recorded with new Supabase accounts
- Optional **Remember this device for 30 days** access during signup and login
- Automatic restoration of an authenticated Supabase session on that device
- Current-tab-only access when device remembrance is not selected
- Remembered-device data and the local session cleared immediately at logout
- User-selectable default hunting state saved to the Supabase profile
- Improved compact BlindIQ wordmark contrast in the app header
- Small, always-visible **+ HOME** action beside the user bubble
- Step-by-step home-screen instructions for both iPhone and Android
- Native Android install prompt when the browser makes it available
- Installable web-app manifest, icon, and service worker
- Permission-based weather at the hunter’s current location
- Weather stays collapsed by default so hunting controls remain immediately accessible
- One-tap weather opening and closing with a compact condition summary after loading
- Current temperature, conditions, wind, humidity, and GPS accuracy
- Active National Weather Service alerts
- Twelve-hour and seven-day National Weather Service forecasts
- Location is used for the forecast and is not stored by BlindIQ
- Closed-today banner and loaded season dates
- Duck and goose seasons, zones, shooting hours, bag rules, and official links
- Reviewed agency and eRegulations links for the newly audited state packages
- Full 2026–27 Virginia, North Carolina, and South Carolina waterfowl packages
- Complete provisional Maryland package with its federal-approval warning
- Delaware proposal options clearly separated from final regulations
- Corrected 2026 Minnesota youth/early-goose dates and pintail limit
- Start Hunt flow with zone selection
- Add and remove harvested birds
- State- and zone-aware aggregate duck limits, including Montana’s seven-bird Pacific Flyway bag
- Species, sex, parent-species, and zone-specific bag-limit logic
- Live list of birds that remain available under loaded demo rules
- Hunt summary and history
- **Better the Community** form for regulation errors, app bugs, feature ideas, and general feedback
- Prepared feedback and support emails addressed to office@blindiq.app
- Account and $14.99/year subscription presentation
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
2. Log in and tap the small **+ HOME** button beside the user bubble.
3. Read the iPhone instructions, then close the guide.
4. Tap Safari's **Share** button—the square with the upward arrow.
5. Scroll down and tap **Add to Home Screen**.
6. Tap **Add**.

### Add BlindIQ to an Android home screen

1. Open BlindIQ in **Chrome**.
2. Log in and tap the small **+ HOME** button beside the user bubble.
3. If **Install BlindIQ now** appears, tap it and confirm installation.
4. Otherwise, open Chrome's three-dot menu.
5. Tap **Install app** or **Add to Home screen**.
6. Confirm the installation.

After installation, BlindIQ opens in its own app-style window. The **+ HOME** action remains available so the device instructions can always be reopened. Browser wording can vary slightly by phone and operating-system version.

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
```

- Blank values keep the app in demo mode.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` connect authentication.
- `VITE_STRIPE_PRICE_ID` identifies the $14.99 annual plan.
- `VITE_STRIPE_CHECKOUT_URL` can temporarily point to a Stripe Payment Link.

For the current tester build, set:

```text
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/aFa8wP84abhXgfdawY48000
```

The Stripe Payment Link must have promotion codes enabled for `100Ducks` to work.

For production, membership entitlement must be confirmed server-side with Stripe webhooks. A browser environment variable alone must never be trusted to decide whether a customer has active access.

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

## Apply the default-state and agreement database update

Before deploying this version, open **Supabase → SQL Editor → New query**. Copy the complete contents of:

```text
supabase/migrations/202608040001_default_state_and_terms.sql
```

Paste it into the query editor and click **Run** once. This adds the default state and agreement-acceptance fields to user profiles. Do this before asking testers to create new accounts with this version.

The included agreement is a product-specific working draft, not a substitute for legal advice. Have a qualified attorney review the agreement, business name/entity, governing-law provision, privacy practices, and subscription terms before broad commercial launch.

## Project structure

```text
src/
├── App.tsx       Screens, navigation, and interactive hunt flow
├── data.ts       Season-versioned state regulations and bird rules
├── legal.ts      Versioned Terms of Use and User Agreement
├── location.ts   Browser location and National Weather Service forecast service
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

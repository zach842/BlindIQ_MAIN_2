# BlindIQ

**HUNT WITH CONFIDENCE**

BlindIQ is a mobile-first waterfowl hunting companion. This React + Vite foundation includes authentication, 12 state dashboards, duck and goose regulation cards, a live hunt logger, remaining-harvest guidance, hunt summaries and history, and a $14.99/year membership.

> Important: The included dates and limits are realistic demo data for product testing. They are not production-ready legal guidance. Every state package must be reviewed against current official wildlife-agency regulations before public launch.

## What works now

- Welcome, login, and account-creation screens
- Supabase email/password authentication when environment settings are present
- Automatic Stripe Checkout after signup or login for inactive members
- Demo-mode fallback when Supabase settings are absent
- Twelve selectable states: Maryland, Delaware, Virginia, North Carolina, Pennsylvania, New York, West Virginia, South Carolina, Louisiana, Texas, Arkansas, and North Dakota
- Required click-to-accept Terms of Use and User Agreement during account creation
- Agreement version and acceptance time recorded with new Supabase accounts
- User-selectable default hunting state saved to the Supabase profile
- Improved compact BlindIQ wordmark contrast in the app header
- Permission-based weather at the hunter’s current location
- Current temperature, conditions, wind, humidity, and GPS accuracy
- Active National Weather Service alerts
- Twelve-hour and seven-day National Weather Service forecasts
- Location is used for the forecast and is not stored by BlindIQ
- Closed-today banner and loaded season dates
- Duck and goose seasons, zones, shooting hours, bag rules, and official links
- Start Hunt flow with zone selection
- Add and remove harvested birds
- Aggregate six-duck limit, four-mallard limit, and two-hen limit logic
- Live list of birds that remain available under loaded demo rules
- Hunt summary and history
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
├── data.ts       Demo state regulations and bird rules
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

# BlindIQ v1.61.1 visual refresh

November 11, 2026. This is a presentation update to the audited v1.61 application. All 29-state regulation data, harvest calculations, tests, account services, backend code, and saved-hunt formats are unchanged from the v1.61 ZIP.

## Reference review

Reviewed public product screens and the published examples from [DeerCast](https://www.deercast.com/), [BlindBook](https://blindbook.com/), [BlindBook walkthroughs](https://blindbook.com/walkthroughs), and [onX Hunt](https://www.onxmaps.com/hunt/app/features). This was a visual benchmark of publicly available material, not an authenticated evaluation of every competitor feature.

The useful shared patterns were strong foreground/background contrast, a clear main action, purposeful outdoor photography, restrained accent colors, and recognizable navigation. BlindIQ retains its own forest-and-gold branding and existing photography; competitor assets and interface designs were not copied into the app.

## Changes

- A compact photo-backed dashboard header gives the app a more finished outdoor identity.
- Neutral white cards, consistent borders and spacing, and clearer type distinguish actions, statistics, status and regulations.
- Season statistics use large, aligned numerals with more legible labels.
- Color-coded season-status cards keep their existing meaning, with readable light backgrounds.
- The primary hunt action remains prominent; practice and development controls have quieter emphasis.
- Active bottom navigation has a visible selected background and indicator, with safe-area spacing.
- Logger count buttons are larger; inputs, cards, summaries and supporting screens share the same visual treatment.
- Keyboard focus stays visible. Decorative button transitions respect reduced-motion preferences.

Changes are isolated in `src/refresh.css`, imported after the original stylesheet. The original stylesheet is preserved. Other source edits are limited to version/cache markers; the package version is 1.61.1.

## Validation

- All 19 regulation/harvest regression tests passed.
- TypeScript checks and existing production compilation passed. The existing large-bundle advisory remains.
- Dashboard checked at 320, 390, 768 and 1440 pixels without horizontal overflow; phone and desktop screenshots inspected.
- Mobile demo flow verified: login, state selection, six-duck bag plus independent merganser and coot, correct total of eight, summary, save, logbook and remembered-login reload. No uncaught browser errors.
- Browser layout tests isolated service workers to avoid a fresh-install cache reload interrupting setup; real offline upgrade behavior was not revalidated. Cache and registration markers were advanced to v1.61.1.
- Packaging compares the regulation, calculation, service and backend files byte-for-byte with the delivered v1.61 ZIP. Production integrations were not retested.

The previous v1.61 and v1.60 ZIPs remain available for rollback. Deploy the new repository root through the existing deployment process; no database migration or new dependency is needed. The regulation report and its stated scope remain applicable.

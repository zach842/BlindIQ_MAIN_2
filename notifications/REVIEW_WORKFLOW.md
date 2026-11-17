# Source-backed notification publishing

All 50 states are selectable. That is NOT a claim of complete calendar coverage. See coverage-readiness.json: no legacy dates were promoted to verified by this update.

For each state, species/category, management zone, hunting method and eligibility group:

1. Read the current official agency regulation/document, including amendments, exclusions, legal hours and zone definitions. Record the exact source URL. Agency URL candidates in the readiness file are inherited from the app and have not been freshly audited here.
2. Add one row per distinct season segment, with start/end dates, correct hunting-zone IANA time zone and a descriptive zone/season name. Keep the row unverified until reviewed. A state may need multiple time zones. A statewide row must not conceal zone or species restrictions.
3. Capture eligibility/method exceptions in conditions; split incompatible dates into separate rows. Never infer dates by adding a year to a prior season or parse free-text approximate dates as exact.
4. After review, set data_status='current', verification_status='verified', verified_at=current review time, time_zone=reviewed zone and active=true. The processor rejects reviews older than 90 days. Future reviews, tentative dates and missing/insecure source URLs are rejected. Retain reviewer/source evidence outside the date row as an administrative record.
5. Review source changes promptly. First withdraw/deactivate an affected date row; correct and re-review it. The processor rechecks queued season events against the current row before delivery. Deterministic event keys prevent duplicate scheduling of the same boundary; changing dates yields a new boundary key.
6. Regulation change notices are explicitly reviewed releases in regulation_releases. Publish only a material, sourced change with a distinct version, summary, official HTTPS link and published_at. The processor considers published releases from the past seven days and rechecks withdrawal/version before delivery. There is no automatic agency-site crawler or automatic legal interpretation in this package.

All notifications say dates are calendar dates and direct hunters to legal hours/eligibility; they do not declare a person legally entitled to hunt. The frontend shows how many states have current/future reviewed rows, not a percentage of full species/zone coverage.

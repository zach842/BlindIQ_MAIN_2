# v1.66.2 — browser logout

Logout previously waited on navigator.serviceWorker.ready before signing out. Ordinary tabs with no active/available worker could wait indefinitely while the installed Home Screen app worked. Push cleanup errors also prevented the remaining handler from running.

Use an existing worker registration instead of waiting for one. Bound optional cleanup to 1.5 seconds and authentication cleanup to four seconds, show progress, and always clear the signed-in UI. Explicit logout intent prevents a stale SDK session restoring after reload; it is cleared on the next successful login. If the SDK fails or hangs, remove this project's persisted auth keys and reload to terminate the old SDK operation. Device unsubscription is attempted independently of server subscription removal. Map pins remain stored.

Validation: reproduced the old stall with service workers blocked. 63 automated tests pass, including rejected/stalled cleanup and authentication timeout handling. Production-build browser tests pass for no worker, denied/stalled worker APIs and an active worker, plus signed-out reload and login again. Existing installed-app cache upgrade/offline test passes from v1.62.1 to v1.66.2. Physical Safari has not been tested. No hosted database or notification backend changes are required.

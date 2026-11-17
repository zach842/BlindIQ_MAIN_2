# Deploy BlindIQ from GitHub

The active application is at the repository root. Vercel uses the checked-in `vercel.json`:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm run build`
- Output: `dist`

`dist/`, dependency folders, compiler caches and release ZIPs are generated/local files and are not committed. Vercel recreates the production bundle from source on every deployment. Do not point the project at an extracted release folder or upload compiled assets separately.

## Release checks

1. Run `pnpm test` and `pnpm run build`.
2. Push a complete commit to a review branch and open a pull request.
3. Wait for Vercel READY, confirming its commit SHA matches the intended branch head.
4. Review the preview on phone and desktop. Returning users may go directly to the hub; the public landing page is the signed-out entry screen.
5. Merge the reviewed change into `main`; confirm the production deployment is READY and matches the merge commit.
6. Open the installed app online to allow its service worker to update. Check the displayed version. Do not clear local browser data as a routine upgrade step: unsynced hunts and device-local map pins can be lost.

Frontend deployment does not apply SQL migrations, deploy Supabase functions, configure private secrets or enable cron schedules. Follow the specific membership, migration, notification and hunt-deletion setup instructions before relying on those hosted features. No private credential belongs in GitHub or a `VITE_` variable.

Older release snapshots and implementation history are available through Git history. Current source and the current release notes are the reference for the app's behavior.

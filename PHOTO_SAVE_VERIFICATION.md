# BlindIQ v1.60 Photo-Save Verification

Verified on September 11, 2026.

## Automated checks completed

- Created a live, waterfowl-category hunt record with one Mallard — Drake.
- Attached a JPEG harvest photo to the record.
- Saved the hunt with a blind name, firearm, and field notes.
- Reloaded the logbook from its persistent demo-mode store.
- Confirmed the same hunt, bird count, waterfowl category, and photo were restored.
- Confirmed the production TypeScript and Vite build completes successfully.

## Production Supabase path reviewed

For a signed-in production user, the app prepares the selected image as a JPEG no larger than 5 MB, uploads it to the private `hunt-photos` bucket under that user's ID, stores the private path on the hunt record, and requests a one-hour signed URL when the Waterfowl Logbook loads.

Before deploying this release, run `supabase/HUNT_LOGBOOK_SETUP.sql` once in the Supabase SQL Editor. It creates or repairs the required hunt columns, private photo bucket, and account-only access policies. The script is safe to run more than once and preserves existing hunts.

The automated test did not write to the live BlindIQ Supabase project or create a real member record.

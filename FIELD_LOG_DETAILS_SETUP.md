# BlindIQ v1.53 — Field Log Details Setup

Run this database update **before** uploading the v1.53 app files to GitHub.

1. Open Supabase and select the BlindIQ project.
2. Open **SQL Editor** and choose **New query**.
3. Open `supabase/migrations/202608290001_hunt_field_details.sql` from this package.
4. Copy the entire file into the Supabase query editor.
5. Select **Run**.

The successful result may say `Success. No rows returned.` That is expected.

Then verify the columns with:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'hunts'
  and column_name in ('blind_name', 'firearm_used', 'notes')
order by column_name;
```

The result must contain all three columns:

- `blind_name`
- `firearm_used`
- `notes`

After verification, replace the GitHub repository files with the v1.53 package. Vercel will deploy the updated app automatically.

Existing hunt records remain intact. Their new fields will simply be blank.

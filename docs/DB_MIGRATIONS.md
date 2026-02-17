# Database Migrations

Run these in the **Supabase SQL editor** (Dashboard → SQL Editor → New query).

## Add `no_rain` column to `kite_settings`

If the column is missing (e.g. the table was created before this field was added):

```sql
alter table public.kite_settings
  add column if not exists no_rain boolean not null default true;
```

This is safe to run even if the column already exists — `add column if not exists` is a no-op in that case.

## Expected schema

After migrations, `kite_settings` should have these columns:

| Column           | Type    | Notes                          |
|------------------|---------|-------------------------------|
| `user_id`        | uuid    | Primary key, references auth.users |
| `email`          | text    |                               |
| `location_label` | text    |                               |
| `lat`            | float8  |                               |
| `lon`            | float8  |                               |
| `no_rain`        | boolean | default true                  |

## Confirm in Supabase

After saving settings from the app, run this query to verify:

```sql
select user_id, email, location_label, lat, lon, no_rain
from public.kite_settings;
```

You should see one row per user with all fields populated, including `no_rain`.

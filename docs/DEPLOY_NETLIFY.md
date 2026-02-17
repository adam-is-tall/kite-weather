# Deploying Kite Weather to Netlify

## Required Environment Variables

Set all of these in the Netlify dashboard under **Site > Environment variables**.

| Variable          | Description                                         | Example                        |
|-------------------|-----------------------------------------------------|--------------------------------|
| `RESEND_API_KEY`  | Your Resend API key                                 | `re_3rujMpGy_3ZR2NPkZfch33tbBshLs7g2v`                 |
| `ALERT_EMAIL_TO`  | Address that receives kite alerts                   | `howard.adamp@gmail.com`              |
| `ALERT_EMAIL_FROM`| Verified sender address (must be verified in Resend)| `onboarding@resend.dev`          |
| `KITE_LAT`        | Latitude of your kite spot                          | `36.1725564`                      |
| `KITE_LON`        | Longitude of your kite spot                         | `-86.7597205`                     |

> **Tip:** The settings page displays your saved location's lat/lon with a "Copy lat/lon" button — use that to grab the exact values for `KITE_LAT` and `KITE_LON`.

## Where to Set Env Vars in Netlify

1. Open your site in the [Netlify dashboard](https://app.netlify.com).
2. Go to **Site configuration → Environment variables**.
3. Add each variable above. Changes take effect on the next deploy or function invocation.

## Schedule

The function runs at **13:00 UTC daily** (`0 13 * * *`).

> **Important:** Netlify schedules run in UTC. 13:00 UTC is approximately:
> - 8:00 AM US Central (CST, UTC-6)
> - 7:00 AM US Central (CDT, UTC-5, during daylight saving)

To change the time, edit the `schedule` in `netlify/functions/daily-kite-alert.ts`.

## Alert Rules (fixed — not user-configurable)

| Rule                  | Value          |
|-----------------------|----------------|
| Wind speed            | 10–20 mph       |
| Max gusts             | < 30 mph       |
| Rain chance threshold | < 30%          |

An email is sent only if **at least one hour tomorrow** (UTC) passes all three checks.

## Testing the Function

### Locally (with Netlify CLI)

```bash
npm install -g netlify-cli
netlify dev
```

Then in another terminal trigger the function directly:

```bash
curl -X POST http://localhost:8888/.netlify/functions/daily-kite-alert
```

> Note: Scheduled functions can also be invoked via HTTP POST for testing. Set your env vars in a `.env` file or via `netlify env:import`.

### After Deploy

Trigger a manual run from the Netlify dashboard:

1. Go to **Functions** in the site dashboard.
2. Find `daily-kite-alert`.
3. Use the **Test function** button, or hit the function endpoint:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/daily-kite-alert
```

Check **Function logs** in the dashboard to see output and confirm email delivery.

## Notes

- The function uses the [Open-Meteo API](https://open-meteo.com/) (free, no key required).
- Email is sent via [Resend](https://resend.com/). The sender domain must be verified in your Resend account.
- No database or localStorage is used — all configuration is via env vars.

// Netlify Scheduled Function — runs daily at 13:00 UTC (~8 AM US Central)
// Checks tomorrow's hourly forecast and emails if good kite hours are found.

export const config = {
  schedule: "0 13 * * *",
};

// ── Rules (fixed — not user-configurable) ───────────────────────────────────
const RULES = {
  minWindMph:   8,
  maxWindMph:  18,
  maxGustMph:  25,
  maxPrecipPct: 30,   // precipitation_probability threshold
} as const;

// ── Types ────────────────────────────────────────────────────────────────────
type HourlyData = {
  time:                      string[];
  windspeed_10m:             number[];
  windgusts_10m:             number[];
  precipitation_probability: number[];
};

type GoodHour = {
  time:      string;
  windMph:   number;
  gustMph:   number;
  precipPct: number;
};

// ── Pure helper: find good kite hours in tomorrow's block (indices 24–47) ───
function findGoodHours(hourly: HourlyData): GoodHour[] {
  const good: GoodHour[] = [];

  for (let i = 24; i < 48 && i < hourly.time.length; i++) {
    const wind   = hourly.windspeed_10m[i];
    const gust   = hourly.windgusts_10m[i];
    const precip = hourly.precipitation_probability[i];

    if (
      wind   >= RULES.minWindMph &&
      wind   <= RULES.maxWindMph &&
      gust   <= RULES.maxGustMph &&
      precip <  RULES.maxPrecipPct
    ) {
      good.push({ time: hourly.time[i], windMph: wind, gustMph: gust, precipPct: precip });
    }
  }

  return good;
}

// ── Email HTML builder ────────────────────────────────────────────────────────
function buildEmailHtml(goodHours: GoodHour[]): string {
  const rows = goodHours.map((h) => `
    <tr>
      <td style="padding:4px 16px 4px 0">${h.time.split('T')[1]} UTC</td>
      <td style="padding:4px 16px 4px 0">${Math.round(h.windMph)} mph</td>
      <td style="padding:4px 16px 4px 0">${Math.round(h.gustMph)} mph gusts</td>
      <td style="padding:4px 16px 4px 0">${h.precipPct}% rain chance</td>
    </tr>`).join('');

  return `
    <h2 style="margin-bottom:8px">🪁 Kite Weather Alert — Great conditions tomorrow!</h2>
    <p>${goodHours.length} hour(s) with good kite conditions tomorrow (times in UTC):</p>
    <table style="border-collapse:collapse;font-family:monospace;font-size:14px">
      <thead>
        <tr style="text-align:left;color:#666;border-bottom:1px solid #ddd">
          <th style="padding:4px 16px 4px 0">Hour</th>
          <th style="padding:4px 16px 4px 0">Wind</th>
          <th style="padding:4px 16px 4px 0">Gusts</th>
          <th style="padding:4px 16px 4px 0">Rain %</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;color:#888;font-size:12px">
      Rules: wind ${RULES.minWindMph}–${RULES.maxWindMph} mph &middot;
      gusts &lt;${RULES.maxGustMph} mph &middot;
      rain chance &lt;${RULES.maxPrecipPct}%
    </p>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(): Promise<Response> {
  const apiKey = process.env.RESEND_API_KEY;
  const to     = process.env.ALERT_EMAIL_TO;
  const from   = process.env.ALERT_EMAIL_FROM;
  const lat    = process.env.KITE_LAT;
  const lon    = process.env.KITE_LON;

  // Validate env vars up front
  const missing = (['RESEND_API_KEY', 'ALERT_EMAIL_TO', 'ALERT_EMAIL_FROM', 'KITE_LAT', 'KITE_LON'] as const)
    .filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('[kite-alert] Missing env vars:', missing);
    return new Response(JSON.stringify({ error: 'Missing env vars', missing }), { status: 500 });
  }

  // Fetch hourly forecast for the next 2 days (UTC)
  // Index 0–23 = today, 24–47 = tomorrow
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=windspeed_10m,windgusts_10m,precipitation_probability` +
    `&wind_speed_unit=mph` +
    `&timezone=UTC&forecast_days=2`;

  let hourly: HourlyData;
  try {
    const res = await fetch(forecastUrl);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = await res.json() as { hourly: HourlyData };
    hourly = data.hourly;
    console.log(`[kite-alert] Fetched ${hourly.time.length} hourly entries for ${lat},${lon}`);
  } catch (err) {
    console.error('[kite-alert] Forecast fetch failed:', err);
    return new Response(JSON.stringify({ error: 'Forecast fetch failed' }), { status: 500 });
  }

  const goodHours = findGoodHours(hourly);
  console.log(`[kite-alert] Good kite hours tomorrow: ${goodHours.length}`);
  if (goodHours.length > 0) {
    goodHours.forEach((h) =>
      console.log(`  ${h.time} — wind ${Math.round(h.windMph)} mph, gusts ${Math.round(h.gustMph)} mph, rain ${h.precipPct}%`)
    );
  }

  if (goodHours.length === 0) {
    console.log('[kite-alert] No good kite hours tomorrow — skipping email.');
    return new Response(
      JSON.stringify({ sent: false, reason: 'No hours tomorrow meet kite conditions' }),
      { status: 200 }
    );
  }

  // Send email via Resend REST API (no SDK import needed)
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `🪁 Kite Weather — ${goodHours.length} good hour(s) tomorrow!`,
      html: buildEmailHtml(goodHours),
    }),
  });

  if (!emailRes.ok) {
    const errBody = await emailRes.text();
    console.error('[kite-alert] Resend error:', errBody);
    return new Response(JSON.stringify({ error: 'Email send failed', detail: errBody }), { status: 500 });
  }

  console.log('[kite-alert] Alert email sent successfully.');
  return new Response(
    JSON.stringify({ sent: true, goodHours: goodHours.length }),
    { status: 200 }
  );
}

export type Forecast = {
  windspeed: number;    // mph daily max
  windgusts: number;    // mph daily max
  precipitation: number; // mm total
};

export const KITE_RULES = {
  minWindMph: 10,
  maxWindMph: 20,
  maxGustMph: 30,
} as const;

export function evaluateKiteConditions(
  forecast: Forecast,
  noRain: boolean
): { shouldSend: boolean; message: string } {
  const { minWindMph, maxWindMph, maxGustMph } = KITE_RULES;

  if (noRain && forecast.precipitation > 1) {
    return { shouldSend: false, message: `Not ideal — Rain expected (${forecast.precipitation.toFixed(1)} mm)` };
  }

  if (forecast.windspeed < minWindMph) {
    return { shouldSend: false, message: `Not ideal — Wind too light (${Math.round(forecast.windspeed)} mph, need ${minWindMph}+)` };
  }

  if (forecast.windspeed > maxWindMph) {
    return { shouldSend: false, message: `Not ideal — Wind too strong (${Math.round(forecast.windspeed)} mph, max ${maxWindMph})` };
  }

  if (forecast.windgusts > maxGustMph) {
    return { shouldSend: false, message: `Not ideal — Gusts too strong (${Math.round(forecast.windgusts)} mph, max ${maxGustMph})` };
  }

  return {
    shouldSend: true,
    message: `Good conditions — Wind ${Math.round(forecast.windspeed)} mph, gusts ${Math.round(forecast.windgusts)} mph`,
  };
}

export async function fetchTomorrowForecast(lat: number, lon: number): Promise<Forecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=windspeed_10m_max,windgusts_10m_max,precipitation_sum` +
    `&wind_speed_unit=mph` +
    `&timezone=auto&forecast_days=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast request failed');

  const data = await res.json();
  const d = data.daily;

  return {
    windspeed: d.windspeed_10m_max[1],
    windgusts: d.windgusts_10m_max[1],
    precipitation: d.precipitation_sum[1],
  };
}

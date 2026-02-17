'use client'

import { useState, useEffect } from 'react';
import { Settings as KiteSettings, Send } from 'lucide-react';
import { KiteSvg } from './KiteSvg';
import { LocationAutocomplete } from './LocationAutoComplete';
import { fetchTomorrowForecast, evaluateKiteConditions, KITE_RULES } from './forecast';
import type { SelectedLocation, Settings } from './types';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { getSettings, upsertSettings } from '@/lib/settingsRepo';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type KiteCheck =
  | { status: 'loading' }
  | { status: 'done'; shouldSend: boolean; message: string }
  | { status: 'error' };

type AlertState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'sent';    message: string }
  | { status: 'skipped'; message: string }
  | { status: 'error';   message: string };

export default function Page() {
  const router = useRouter();

  // ── Auth + settings load ─────────────────────────────────────────────────
  const [userId, setUserId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  async function loadSettings(uid: string) {
    try {
      setLoadError(null);
      const row = await getSettings(uid);
      if (row) {
        setSettings({
          email: row.email,
          location: { label: row.location_label, lat: row.lat, lon: row.lon },
          noRain: row.no_rain,
        });
        setIsEditing(false);
      } else {
        setSettings(null);
        setIsEditing(true); // new user — open the form
      }
    } catch {
      setLoadError('Failed to load settings. Try refreshing.');
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      const uid = data.session.user.id;
      setUserId(uid);
      loadSettings(uid);
    });
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [kiteCheck, setKiteCheck] = useState<KiteCheck>({ status: 'loading' });
  const [alertState, setAlertState] = useState<AlertState>({ status: 'idle' });

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [noRain, setNoRain] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Forecast check whenever settings change ──────────────────────────────
  useEffect(() => {
    if (!settings) return;
    setKiteCheck({ status: 'loading' });
    fetchTomorrowForecast(settings.location.lat, settings.location.lon)
      .then(f => {
        const { shouldSend, message } = evaluateKiteConditions(f, settings.noRain);
        setKiteCheck({ status: 'done', shouldSend, message });
      })
      .catch(() => setKiteCheck({ status: 'error' }));
  }, [settings]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const isEmailValid = validateEmail(email);
  const isFormValid = isEmailValid && !!location;

  const handleEdit = () => {
    if (!settings) return;
    setEmail(settings.email);
    setLocation(settings.location);
    setNoRain(settings.noRain);
    setEmailError(null);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(
      e.target.value === '' || validateEmail(e.target.value)
        ? null
        : 'Please enter a valid email address.'
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (!isEmailValid) setEmailError('Please enter a valid email address.');
      return;
    }
    if (!location) return;

    try {
      setSaving(true);
      setSaveError(null);

      await upsertSettings({
        user_id: userId,
        email,
        location_label: location.label,
        lat: location.lat,
        lon: location.lon,
        no_rain: noRain,
      });

      setSettings({ email, location, noRain });
      setIsEditing(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save settings.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLatLon = () => {
    if (!settings) return;
    navigator.clipboard.writeText(`${settings.location.lat},${settings.location.lon}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAlert = async () => {
    if (!settings) return;
    setAlertState({ status: 'checking' });
    try {
      const forecast = await fetchTomorrowForecast(settings.location.lat, settings.location.lon);
      const { shouldSend, message } = evaluateKiteConditions(forecast, settings.noRain);

      if (!shouldSend) {
        setAlertState({ status: 'skipped', message });
        return;
      }

      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Kite Weather Alert — Great day tomorrow!',
          html: `<p>${message}</p>`,
        }),
      });
      if (!res.ok) throw new Error();
      setAlertState({ status: 'sent', message });
    } catch {
      setAlertState({ status: 'error', message: 'Something went wrong. Try again.' });
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (!loaded) return null;

  if (loadError) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 mb-3">{loadError}</p>
        <button
          onClick={() => { setLoaded(false); loadSettings(userId); }}
          className="text-blue-600 underline text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-200">

        <div className="flex justify-center mb-4">
          <KiteSvg className="w-28 h-auto" />
        </div>

        {settings && !isEditing ? (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Be on the lookout for kite weather updates.</h1>

            <p className="mb-1 text-gray-700">
              Email: <span className="font-mono">{settings.email}</span>
            </p>

            <p className="mb-1 text-gray-700">
              Location: <span className="font-mono">{settings.location.label}</span>
            </p>

            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-gray-500 font-mono">
                {settings.location.lat}, {settings.location.lon}
              </span>
              <button
                onClick={handleCopyLatLon}
                className="text-xs border border-gray-300 text-gray-600 rounded px-2 py-0.5 hover:bg-gray-100 transition"
              >
                {copied ? 'Copied!' : 'Copy lat/lon'}
              </button>
            </div>

            <div className="mb-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Alert Rules</p>
              <p className="text-sm text-gray-600">Wind: {KITE_RULES.minWindMph}–{KITE_RULES.maxWindMph} mph</p>
              <p className="text-sm text-gray-600">Gusts: up to {KITE_RULES.maxGustMph} mph</p>
              <p className="text-sm text-gray-600">Rain: {settings.noRain ? 'must be dry' : 'OK if raining'}</p>
            </div>

            <div className="mb-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tomorrow's Conditions</p>
              {kiteCheck.status === 'loading' && (
                <p className="text-sm text-gray-500">Checking forecast…</p>
              )}
              {kiteCheck.status === 'error' && (
                <p className="text-sm text-red-500">Could not load forecast.</p>
              )}
              {kiteCheck.status === 'done' && (
                <div className={`rounded-md px-3 py-2 text-sm font-medium ${
                  kiteCheck.shouldSend
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {kiteCheck.message}
                </div>
              )}
            </div>

            <button
              onClick={handleTestAlert}
              disabled={alertState.status === 'checking'}
              className="w-full flex items-center justify-center gap-2 mb-1 bg-blue-600 text-white font-semibold rounded px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {alertState.status === 'checking' ? 'Checking conditions…'
                : alertState.status === 'sent'    ? 'Alert sent!'
                : alertState.status === 'skipped' ? 'Check again'
                : alertState.status === 'error'   ? 'Error — retry?'
                : 'Test Alert Email'}
            </button>
            {'message' in alertState && (
              <p className={`text-xs mb-3 ${
                alertState.status === 'sent'      ? 'text-green-700'
                : alertState.status === 'skipped' ? 'text-amber-700'
                : 'text-red-600'
              }`}>
                {alertState.message}
              </p>
            )}

            <button
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold rounded px-4 py-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <KiteSettings className="w-4 h-4" />
              Change Your Settings
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">Ready to fly a kite? We'll let you know when it's windy enough.</h1>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full p-2 border rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <LocationAutocomplete value={location} onSelect={setLocation} />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noRain}
                onChange={(e) => setNoRain(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-gray-700 font-medium">Only alert me if no rain is expected</span>
            </label>

            <div>
              <button
                type="submit"
                disabled={!isFormValid || saving}
                className="w-full bg-blue-600 text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Set up Alerts'}
              </button>
              {saveError && (
                <p className="text-red-600 text-sm mt-2">{saveError}</p>
              )}
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="text-sm text-gray-500 underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

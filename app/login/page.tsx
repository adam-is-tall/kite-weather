"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const COOLDOWN_MS = 60_000;
const LS_KEY = "kite_magic_link_sent_at";

function secondsRemaining(): number {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return 0;
  const elapsed = Date.now() - parseInt(raw, 10);
  return Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Restore cooldown if page is refreshed during the window
  useEffect(() => {
    const secs = secondsRemaining();
    if (secs > 0) setCooldown(secs);
  }, []);

  // Tick down every second while cooldown is active
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setError(error.message);
    } else {
      localStorage.setItem(LS_KEY, String(Date.now()));
      setSent(true);
      setCooldown(Math.ceil(COOLDOWN_MS / 1000));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kite2.png" alt="Kite" className="w-40 h-auto" />
        </div>

        <h1 className="text-2xl font-bold">Missing out on good kite weather?</h1>

        {sent ? (
          <p className="text-gray-700">A login link is on its way</p>
        ) : <p className="text-gray-700">Enter your email and be alerted when conditions are right!</p>}

        <form onSubmit={sendLink} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            disabled={cooldown > 0}
            className="w-full bg-blue-600 text-white font-semibold rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? `Check your inbox`
              : sent
              ? "Resend magic link"
              : "Send magic link"}
          </button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react';
import type { Settings } from './types';

const STORAGE_KEY = 'kite_settings_v1';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettings(JSON.parse(raw));
      } catch {}
    }
    setMounted(true);
  }, []);

  function save(next: Settings) {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clear() {
    setSettings(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { settings, save, clear, mounted };
}

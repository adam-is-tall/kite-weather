'use client'

import { useEffect, useRef, useState } from 'react'
import type { SelectedLocation } from './types'

export type { SelectedLocation }

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    suburb?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

function buildLabel(r: NominatimResult): string {
  const a = r.address ?? {}
  const city = a.city ?? a.town ?? a.village ?? a.suburb
  const parts = [city, a.state, a.postcode].filter(Boolean)
  if (parts.length >= 2) return parts.join(', ')
  // fallback: first 3 comma-parts of display_name
  return r.display_name.split(',').slice(0, 3).join(',').trim()
}

const ZIP_RE = /^\d{5}(-\d{4})?$/

export function LocationAutocomplete({
  value,
  onSelect,
  placeholder = 'City, address, or zip code…',
}: {
  value: SelectedLocation | null
  onSelect: (loc: SelectedLocation) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SelectedLocation[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // Keep input text in sync when parent value changes
  useEffect(() => {
    if (value?.label) setQuery(value.label)
  }, [value?.label])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3 || q === (value?.label ?? '').trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setOpen(true)

    const t = setTimeout(async () => {
      try {
        abortRef.current?.abort()
        const ac = new AbortController()
        abortRef.current = ac

        const params = new URLSearchParams({
          q,
          format: 'json',
          limit: '6',
          addressdetails: '1',
        })
        // Bias toward US results when input looks like a zip code
        if (ZIP_RE.test(q)) params.set('countrycodes', 'us')

        const url = `https://nominatim.openstreetmap.org/search?${params}`
        const res = await fetch(url, {
          signal: ac.signal,
          headers: { 'Accept-Language': 'en' },
        })
        const data: NominatimResult[] = await res.json()

        const locs: SelectedLocation[] = data.map((r) => ({
          label: buildLabel(r),
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        }))

        setResults(locs.filter((l) => l.label))
      } catch {
        // ignore abort errors
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(t)
  }, [query, value?.label])

  const hasResults = results.length > 0

  return (
    <div className="relative">
      <label className="block mb-2 font-medium text-gray-700">Location:</label>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => { if (!value || query !== value.label) setOpen(true) }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120)
        }}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && (loading || hasResults) && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}

          {!loading && hasResults && (
            <ul className="max-h-64 overflow-auto">
              {results.map((r, idx) => (
                <li key={`${r.lat}-${r.lon}-${idx}`}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelect(r)
                      setQuery(r.label)
                      setOpen(false)
                    }}
                  >
                    <div className="text-sm text-gray-800">{r.label}</div>
                    <div className="text-xs text-gray-500">
                      {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {value && (
        <p className="mt-2 text-xs text-gray-500">
          Selected: <span className="font-mono">{value.lat.toFixed(4)}, {value.lon.toFixed(4)}</span>
        </p>
      )}
    </div>
  )
}

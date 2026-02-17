export function KiteSvg({ className = 'w-28 h-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Kite body — four coloured quadrants */}
      <polygon points="60,8 105,62 60,62"  fill="#fcd34d" />
      <polygon points="60,8 15,62 60,62"   fill="#f97316" />
      <polygon points="15,62 60,116 60,62" fill="#4ade80" />
      <polygon points="105,62 60,116 60,62" fill="#38bdf8" />

      {/* Kite outline */}
      <polygon
        points="60,8 105,62 60,116 15,62"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cross bars */}
      <line x1="15" y1="62" x2="105" y2="62" stroke="#1f2937" strokeWidth="1.5" />
      <line x1="60" y1="8"  x2="60"  y2="116" stroke="#1f2937" strokeWidth="1.5" />

      {/* Left eye */}
      <circle cx="45" cy="50" r="7"   fill="white"   stroke="#1f2937" strokeWidth="1" />
      <circle cx="46" cy="49" r="4"   fill="#2563eb" />
      <circle cx="47" cy="48" r="1.5" fill="white"   />

      {/* Right eye */}
      <circle cx="75" cy="50" r="7"   fill="white"   stroke="#1f2937" strokeWidth="1" />
      <circle cx="76" cy="49" r="4"   fill="#2563eb" />
      <circle cx="77" cy="48" r="1.5" fill="white"   />

      {/* Eyebrows — raised & quirky */}
      <path d="M 38 41 Q 45 35 52 40" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 68 40 Q 75 34 82 40" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* Mouth — big goofy open grin */}
      <path d="M 44,76 Q 60,94 76,76 Z" fill="#7f1d1d" />
      <path d="M 44,76 Q 60,79 76,76 Z" fill="white" />
      <line x1="53" y1="76" x2="53" y2="79" stroke="#d1d5db" strokeWidth="0.8" />
      <line x1="60" y1="77" x2="60" y2="80" stroke="#d1d5db" strokeWidth="0.8" />
      <line x1="67" y1="76" x2="67" y2="79" stroke="#d1d5db" strokeWidth="0.8" />
      <path d="M 44,76 Q 60,94 76,76" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />

      {/* Rosy cheeks */}
      <ellipse cx="34" cy="67" rx="7" ry="5" fill="#fca5a5" opacity="0.65" />
      <ellipse cx="86" cy="67" rx="7" ry="5" fill="#fca5a5" opacity="0.65" />

      {/* Tail string — wavy */}
      <path
        d="M 60,116 C 65,128 55,138 60,150 C 65,162 55,172 60,184 C 63,192 60,198 60,198"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bow 1 — purple (~y 139) */}
      <path d="M 60,139 C 55,133 47,133 47,139 C 47,145 55,145 60,139" fill="#a855f7" />
      <path d="M 60,139 C 65,133 73,133 73,139 C 73,145 65,145 60,139" fill="#a855f7" />
      <circle cx="60" cy="139" r="2.5" fill="#6b21a8" />

      {/* Bow 2 — pink (~y 162) */}
      <path d="M 60,162 C 55,156 47,156 47,162 C 47,168 55,168 60,162" fill="#ec4899" />
      <path d="M 60,162 C 65,156 73,156 73,162 C 73,168 65,168 60,162" fill="#ec4899" />
      <circle cx="60" cy="162" r="2.5" fill="#9d174d" />

      {/* Bow 3 — amber (~y 184) */}
      <path d="M 60,184 C 55,178 47,178 47,184 C 47,190 55,190 60,184" fill="#fbbf24" />
      <path d="M 60,184 C 65,178 73,178 73,184 C 73,190 65,190 60,184" fill="#fbbf24" />
      <circle cx="60" cy="184" r="2.5" fill="#92400e" />
    </svg>
  );
}

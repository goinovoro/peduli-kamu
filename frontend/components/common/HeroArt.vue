<template>
  <!-- Ilustrasi hero: perawat + pasien + rumah (inline SVG, tanpa aset eksternal) -->
  <div class="relative mx-auto w-full max-w-md" role="img" aria-label="Ilustrasi perawat merawat lansia di rumah">
    <div class="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
    <div class="absolute -bottom-8 -right-4 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
    <svg viewBox="0 0 420 340" class="relative w-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Rumah -->
      <rect x="40" y="120" width="340" height="180" rx="20" fill="#F0F9FF" />
      <path d="M30 130 210 40l180 90v10H30v-10Z" fill="#0284C7" />
      <rect x="185" y="220" width="50" height="80" rx="8" fill="#BAE6FD" />
      <rect x="80" y="170" width="60" height="50" rx="8" fill="#BAE6FD" />
      <rect x="280" y="170" width="60" height="50" rx="8" fill="#BAE6FD" />
      <!-- Palang medis di atap -->
      <rect x="198" y="66" width="24" height="8" rx="4" fill="#fff" />
      <rect x="206" y="58" width="8" height="24" rx="4" fill="#fff" />
      <!-- Lansia (kursi) -->
      <circle cx="140" cy="200" r="22" fill="#FCD9B8" />
      <path d="M122 196q6-12 18-12t18 12q-9-4-18-4t-18 4Z" fill="#94A3B8" />
      <rect x="112" y="222" width="56" height="60" rx="14" fill="#C4B5FD" />
      <rect x="100" y="250" width="90" height="12" rx="6" fill="#8B7CF6" />
      <rect x="150" y="282" width="10" height="18" fill="#64748B" />
      <rect x="118" y="282" width="10" height="18" fill="#64748B" />
      <!-- Perawat -->
      <circle cx="280" cy="185" r="24" fill="#FCD9B8" />
      <path d="M258 178q8-16 22-16t22 16l-4 2q-18-8-36 0l-4-2Z" fill="#1E293B" />
      <rect x="276" y="158" width="20" height="7" rx="3.5" fill="#fff" />
      <rect x="282.5" y="151.5" width="7" height="20" rx="3.5" fill="#fff" />
      <rect x="250" y="209" width="60" height="66" rx="16" fill="#0284C7" />
      <rect x="250" y="209" width="60" height="14" rx="7" fill="#0369A1" />
      <circle cx="280" cy="245" r="9" fill="#fff" />
      <path d="M276 245h8M280 241v8" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" />
      <!-- Tangan menjangkau + hati -->
      <rect x="196" y="236" width="60" height="14" rx="7" fill="#FCD9B8" />
      <path d="M232 214c-4-8-16-10-21-3-4 6-1 14 5 18l16 12 16-12c6-4 9-12 5-18-5-7-17-5-21 3Z" fill="#F472B6" transform="translate(8,-6) scale(0.9)" />
      <!-- Stetoskop -->
      <path d="M310 220q22 4 18 26t-24 20" stroke="#0F172A" stroke-width="4" stroke-linecap="round" />
      <circle cx="304" cy="266" r="7" fill="#0F172A" />
      <!-- Denyut hati -->
      <path d="M60 318h30l8-10 8 18 8-14 6 6h40" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Badge STR -->
      <g>
        <rect x="296" y="96" width="92" height="34" rx="17" fill="#ECFDF5" stroke="#10B981" stroke-width="2" />
        <path d="M312 113l4 4 8-8" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <text x="326" y="117" font-size="12" font-weight="700" fill="#047857" font-family="system-ui">STR Aktif</text>
      </g>
      <!-- Badge rating -->
      <g>
        <rect x="32" y="96" width="86" height="34" rx="17" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2" />
        <text x="46" y="117" font-size="12" font-weight="700" fill="#B45309" font-family="system-ui">★ 4.9/5</text>
      </g>
    </svg>
  </div>
</template>

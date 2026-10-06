/**
 * Ilustraciones decorativas de productos de ejemplo (SVG en línea, sin peticiones).
 * Siempre aria-hidden: el texto vecino ya dice qué producto es.
 */

export function CakeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true" focusable="false" className={className}>
      {/* plato */}
      <ellipse cx="60" cy="78" rx="46" ry="8" fill="#e9b8c8" />
      <ellipse cx="60" cy="75" rx="44" ry="7" fill="#ffffff" />
      {/* torta: dos capas de chocolate con crema */}
      <rect x="28" y="36" width="64" height="38" rx="5" fill="#5a3324" />
      <rect x="28" y="36" width="64" height="12" rx="5" fill="#3f2219" />
      <rect x="28" y="52" width="64" height="5" fill="#f6e3cf" />
      <rect x="28" y="64" width="64" height="4" fill="#4a2a1e" opacity="0.6" />
      {/* cobertura que chorrea */}
      <path
        d="M28 41c0-3 2-5 5-5h54c3 0 5 2 5 5v3c-3 0-3 5-6 5s-3-4-6-4-3 6-6 6-3-5-6-5-3 4-6 4-3-6-6-6-3 5-6 5-3-4-6-4-3 5-6 5-3-5-6-5z"
        fill="#2c1610"
      />
      {/* cerezas */}
      {[42, 60, 78].map((x) => (
        <g key={x}>
          <path d={`M${x} 30c1-6 4-10 8-12`} stroke="#3b5d2a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx={x} cy={31} r="6" fill="#c2185b" />
          <circle cx={x - 2} cy={29} r="1.8" fill="#ff8fb8" />
        </g>
      ))}
    </svg>
  );
}

export function CupcakesIllustration({ className }: { className?: string }) {
  const cups = [
    { x: 28, cup: "#f2b705", stripe: "#d39e00" },
    { x: 60, cup: "#e2407f", stripe: "#c2185b" },
    { x: 92, cup: "#2f6be6", stripe: "#1959d1" },
  ];
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true" focusable="false" className={className}>
      <ellipse cx="60" cy="80" rx="54" ry="7" fill="#b9cdf3" />
      <ellipse cx="60" cy="77" rx="52" ry="6" fill="#ffffff" />
      {cups.map(({ x, cup, stripe }) => (
        <g key={x}>
          {/* capacillo */}
          <path d={`M${x - 13} 48h26l-4 28h-18z`} fill={cup} />
          {[-7, 0, 7].map((dx) => (
            <path key={dx} d={`M${x + dx} 49l-0.8 26`} stroke={stripe} strokeWidth="2" />
          ))}
          {/* crema */}
          <path
            d={`M${x - 15} 49c-2-8 5-12 9-11 0-7 6-11 6-11s6 4 6 11c4-1 11 3 9 11z`}
            fill="#fff6ee"
            stroke="#f1dccb"
            strokeWidth="1.2"
          />
          {/* cereza */}
          <circle cx={x} cy={25} r="4.5" fill="#c2185b" />
          <circle cx={x - 1.5} cy={23.5} r="1.3" fill="#ff8fb8" />
        </g>
      ))}
    </svg>
  );
}

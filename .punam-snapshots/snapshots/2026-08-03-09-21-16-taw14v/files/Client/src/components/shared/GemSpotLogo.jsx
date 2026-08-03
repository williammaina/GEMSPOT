/**
 * GemSpot KE brand mark
 * Location pin silhouette with a cut gem inside — discovery + rarity.
 * Unique gradient ids so multiple instances on one page don't clash.
 */
let logoSeq = 0;

export function GemSpotLogo({ size = 32, className, variant = 'default' }) {
  logoSeq += 1;
  const uid = `gs${logoSeq}`;
  const gId = `${uid}-grad`;
  const shineId = `${uid}-shine`;
  const glowId = `${uid}-glow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gId} x1="10" y1="2" x2="38" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="0.45" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id={shineId} x1="18" y1="6" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={glowId} cx="24" cy="18" r="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#99f6e4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#0d9f6e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft outer glow */}
      <circle cx="24" cy="20" r="15" fill={`url(#${glowId})`} />

      {/* pin body */}
      <path
        d="M24 3.5C15.44 3.5 8.5 10.2 8.5 18.5c0 10.4 12.8 22.8 14.5 24.3a1.4 1.4 0 0 0 2 0C26.7 41.3 39.5 28.9 39.5 18.5 39.5 10.2 32.56 3.5 24 3.5z"
        fill={`url(#${gId})`}
      />

      {/* pin highlight rim */}
      <path
        d="M24 5.2c7.4 0 13.4 5.7 13.4 13.3 0 8.6-10.2 19.6-13.4 22.5-3.2-2.9-13.4-13.9-13.4-22.5C10.6 10.9 16.6 5.2 24 5.2z"
        stroke="#fff"
        strokeOpacity="0.22"
        strokeWidth="1.2"
        fill="none"
      />

      {/* gem — octagon-ish cut */}
      <path
        d="M24 12.2l6.4 4.6-2.4 7.4H20l-2.4-7.4L24 12.2z"
        fill="#ecfdf5"
        fillOpacity="0.96"
      />
      {/* top facet */}
      <path d="M24 12.2l6.4 4.6H17.6L24 12.2z" fill={`url(#${shineId})`} />
      {/* left shadow facet */}
      <path d="M17.6 16.8l2.4 7.4 4-7.4H17.6z" fill="#0f766e" fillOpacity="0.22" />
      {/* right facet */}
      <path d="M30.4 16.8H24l4 7.4 2.4-7.4z" fill="#14b8a6" fillOpacity="0.28" />
      {/* center spark */}
      <circle cx="24" cy="18.6" r="1.65" fill="#0d9f6e" fillOpacity="0.85" />
      <circle cx="23.4" cy="17.9" r="0.55" fill="#fff" fillOpacity="0.9" />

      {variant === 'mono' ? null : null}
    </svg>
  );
}

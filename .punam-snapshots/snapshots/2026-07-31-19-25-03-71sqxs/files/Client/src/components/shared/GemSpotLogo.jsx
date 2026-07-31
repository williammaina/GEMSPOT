/** GemSpot KE mark — geometric pin + gem facets */
export function GemSpotLogo({ size = 28, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gs-g" x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#0d9f6e" />
        </linearGradient>
      </defs>
      {/* pin body */}
      <path
        d="M20 3.5c-7.3 0-13.2 5.7-13.2 12.7 0 8.6 10.4 18.6 12.4 20.4a1.2 1.2 0 0 0 1.6 0c2-1.8 12.4-11.8 12.4-20.4C33.2 9.2 27.3 3.5 20 3.5z"
        fill="url(#gs-g)"
      />
      {/* inner gem */}
      <path
        d="M20 10.2l5.6 4.2-2.1 6.4h-7l-2.1-6.4L20 10.2z"
        fill="#ecfdf5"
        opacity="0.95"
      />
      <path d="M20 10.2l5.6 4.2h-11.2L20 10.2z" fill="#fff" opacity="0.55" />
      <path d="M14.4 14.4l2.1 6.4 3.5-6.4h-5.6z" fill="#0d9f6e" opacity="0.25" />
      <circle cx="20" cy="16.2" r="1.4" fill="#0d9f6e" opacity="0.7" />
    </svg>
  );
}

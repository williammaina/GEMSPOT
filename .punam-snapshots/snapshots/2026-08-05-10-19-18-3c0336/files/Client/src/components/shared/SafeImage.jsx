import { useState } from 'react';

const FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect fill="%23e2e8f0" width="800" height="500"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="system-ui" font-size="20">GemSpot KE</text>
    </svg>`
  );

export function SafeImage({ src, alt = '', className, ...rest }) {
  const [failed, setFailed] = useState(false);
  const finalSrc = !src || failed ? FALLBACK : src;
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

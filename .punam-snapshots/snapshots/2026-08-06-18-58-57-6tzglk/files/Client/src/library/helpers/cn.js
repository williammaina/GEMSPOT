/**
 * Tiny className joiner — no external dependency required.
 */
export function cn(...parts) {
  return parts
    .flatMap((p) => {
      if (!p) return [];
      if (typeof p === 'string') return [p];
      if (typeof p === 'object') {
        return Object.entries(p)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .join(' ');
}

export function useMapbox() {
  return { token: import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN || '', ready: false };
}

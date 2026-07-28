import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const DEFAULT_CENTER = [36.8219, -1.2921];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() || '';

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function useMapbox({ center = DEFAULT_CENTER, zoom = 11, places = [] } = {}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapboxReady, setIsMapboxReady] = useState(false);
  const supportsMapbox = Boolean(MAPBOX_TOKEN);

  const normalizedPlaces = useMemo(() => Array.isArray(places) ? places : [], [places]);

  useEffect(() => {
    if (!supportsMapbox || !mapContainerRef.current) {
      setIsMapboxReady(false);
      return undefined;
    }

    if (mapRef.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current.remove();
      mapRef.current = null;
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
      cooperativeGestures: true,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapInstance.on('load', () => {
      markersRef.current = normalizedPlaces
        .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
        .map((place) => {
          const marker = new mapboxgl.Marker({ color: '#2dd4bf' })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 18 }).setHTML(
                `<div style="font-family: Inter, system-ui, sans-serif; max-width: 220px;">
                  <strong>${escapeHtml(place.title || place.name || 'GemSpot listing')}</strong>
                  <div style="margin-top: 4px; opacity: 0.85;">${escapeHtml(place.location || '')}</div>
                </div>`
              )
            )
            .addTo(mapInstance);

          return marker;
        });

      setIsMapboxReady(true);
    });

    mapRef.current = mapInstance;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapInstance.remove();
      mapRef.current = null;
      setIsMapboxReady(false);
    };
  }, [supportsMapbox, center, zoom, normalizedPlaces]);

  return { mapContainerRef, isMapboxReady, supportsMapbox };
}

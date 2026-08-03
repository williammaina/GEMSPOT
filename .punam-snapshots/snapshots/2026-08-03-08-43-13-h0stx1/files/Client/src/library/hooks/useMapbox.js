import { useEffect, useRef, useState } from 'react';
import { getMapboxToken } from '../helpers/geocode.js';

const NAIROBI = [36.8219, -1.2921];

export function useMapbox({
  center = NAIROBI,
  zoom = 11.2,
  places = [],
  focus = null,
} = {}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const focusMarkerRef = useRef(null);
  const [isMapboxReady, setIsMapboxReady] = useState(false);
  const token = getMapboxToken();
  const supportsMapbox = Boolean(token);

  useEffect(() => {
    if (!supportsMapbox || !mapContainerRef.current) return undefined;
    let cancelled = false;
    let map;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        if (cancelled || !mapContainerRef.current) return;
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: Array.isArray(center) && center.length === 2 ? center : NAIROBI,
          zoom,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = map;
        map.on('load', () => {
          if (!cancelled) setIsMapboxReady(true);
        });
      } catch (err) {
        if (import.meta.env?.DEV) console.warn('[GemSpot] Mapbox load failed', err);
        setIsMapboxReady(false);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      focusMarkerRef.current?.remove();
      focusMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
      setIsMapboxReady(false);
    };
  }, [supportsMapbox, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapboxReady) return undefined;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const withCoords = (places || []).filter(
        (p) =>
          Number.isFinite(Number(p.longitude ?? p.lng)) &&
          Number.isFinite(Number(p.latitude ?? p.lat))
      );

      withCoords.forEach((place) => {
        const lng = Number(place.longitude ?? place.lng);
        const lat = Number(place.latitude ?? place.lat);
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', place.title || place.name || 'Place');
        el.style.cssText =
          'width:28px;height:28px;border-radius:999px;border:2px solid #fff;background:#0d9f6e;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer;padding:0';
        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
          `<div style="font:700 13px system-ui;max-width:160px">${escapeHtml(
            place.title || place.name || 'Spot'
          )}${
            place.location
              ? `<div style="font-weight:500;color:#64748b;margin-top:2px">${escapeHtml(
                  place.location
                )}</div>`
              : ''
          }</div>`
        );
        markersRef.current.push(
          new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map)
        );
      });

      if (!focus && withCoords.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        withCoords.forEach((p) =>
          bounds.extend([Number(p.longitude ?? p.lng), Number(p.latitude ?? p.lat)])
        );
        map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 800 });
      } else if (!focus && withCoords.length === 1) {
        map.flyTo({
          center: [
            Number(withCoords[0].longitude ?? withCoords[0].lng),
            Number(withCoords[0].latitude ?? withCoords[0].lat),
          ],
          zoom: 13,
          duration: 800,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [places, isMapboxReady, focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapboxReady || !focus) return undefined;
    const lng = Number(focus.lng);
    const lat = Number(focus.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;
      map.flyTo({
        center: [lng, lat],
        zoom: focus.zoom || 13.5,
        essential: true,
        duration: 1200,
      });
      focusMarkerRef.current?.remove();
      const el = document.createElement('div');
      el.style.cssText =
        'width:18px;height:18px;border-radius:999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 4px 14px rgba(0,0,0,.3)';
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]);
      if (focus.label) {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 14, closeButton: false }).setText(focus.label)
        );
      }
      marker.addTo(map);
      if (focus.label) marker.togglePopup();
      focusMarkerRef.current = marker;
    })();

    return () => {
      cancelled = true;
    };
  }, [focus, isMapboxReady]);

  return { mapContainerRef, isMapboxReady, supportsMapbox, token };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';
import { useMemo } from 'react';
import { useMapbox } from '@library';
import { MapboxCanvasStyles as styles } from '@styles';

const DEFAULT_CENTER = [36.8219, -1.2921];

export function MapboxCanvas({ places = [], focus = null, focusLabel = '' }) {
  const center = useMemo(() => {
    if (focus && Number.isFinite(focus.lng) && Number.isFinite(focus.lat)) return [focus.lng, focus.lat];
    const first = (places || []).find(
      (p) => Number.isFinite(Number(p.longitude ?? p.lng)) && Number.isFinite(Number(p.latitude ?? p.lat))
    );
    if (first) return [Number(first.longitude ?? first.lng), Number(first.latitude ?? first.lat)];
    return DEFAULT_CENTER;
  }, [places, focus]);

  const resolvedFocus = useMemo(() => {
    if (!focus || !Number.isFinite(focus.lng) || !Number.isFinite(focus.lat)) return null;
    return { lng: focus.lng, lat: focus.lat, label: focus.label || focusLabel || '', zoom: focus.zoom || 13.5 };
  }, [focus, focusLabel]);

  const { mapContainerRef, isMapboxReady, supportsMapbox } = useMapbox({
    center,
    zoom: resolvedFocus ? 13.5 : 11.2,
    places,
    focus: resolvedFocus,
  });

  if (!supportsMapbox) {
    const target =
      resolvedFocus ||
      (() => {
        const p = (places || []).find(
          (place) =>
            Number.isFinite(Number(place.longitude ?? place.lng)) &&
            Number.isFinite(Number(place.latitude ?? place.lat))
        );
        if (!p) return null;
        return {
          lng: Number(p.longitude ?? p.lng),
          lat: Number(p.latitude ?? p.lat),
          label: p.title || p.name || p.location,
        };
      })();

    if (target) {
      const d = 0.045;
      const bbox = [target.lng - d, target.lat - d, target.lng + d, target.lat + d].join('%2C');
      const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${target.lat}%2C${target.lng}`;
      return (
        <div className={styles.MapContainer}>
          <iframe title={target.label || 'Map'} src={osm} className={styles.EmbedFrame} loading="lazy" />
          {target.label && (
            <div className={styles.FocusBanner}>
              <Navigation size={14} />
              <span>{target.label}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.MapContainer}>
        <div className={styles.FallbackPanel}>
          <span className={styles.FallbackEyebrow}>Map</span>
          <h3 className={styles.FallbackTitle}>Search an area to pin the map</h3>
          <p className={styles.FallbackText}>Try “Kilimani”, “Westlands”, or “Karura”.</p>
          <div className={styles.FallbackList}>
            {(places || []).slice(0, 3).map((place) => (
              <div key={place.id || place.title} className={styles.FallbackItem}>
                <MapPin size={12} />
                <span>{place.title || place.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.MapContainer}>
      <div ref={mapContainerRef} className={styles.CanvasViewport} />
      {!isMapboxReady && <div className={styles.LoadingOverlay}>Loading map…</div>}
      {resolvedFocus?.label && isMapboxReady && (
        <div className={styles.FocusBanner}>
          <Navigation size={14} />
          <span>{resolvedFocus.label}</span>
        </div>
      )}
    </div>
  );
}

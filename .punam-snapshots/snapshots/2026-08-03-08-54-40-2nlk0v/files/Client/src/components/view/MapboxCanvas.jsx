import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { useMapbox } from '@library';
import { MapboxCanvasStyles as styles } from '@styles';

const DEFAULT_CENTER = [36.8219, -1.2921];

export function MapboxCanvas({ places = [] }) {
  const center = useMemo(() => {
    const first = Array.isArray(places) ? places.find((place) => Number.isFinite(place.longitude) && Number.isFinite(place.latitude)) : null;
    return first ? [first.longitude, first.latitude] : DEFAULT_CENTER;
  }, [places]);

  const { mapContainerRef, isMapboxReady, supportsMapbox } = useMapbox({
    center,
    zoom: 11.2,
    places,
  });

  if (!supportsMapbox) {
    return (
      <div className={styles.MapContainer}>
        <div className={styles.FallbackPanel}>
          <div className={styles.FallbackHeader}>
            <span className={styles.FallbackEyebrow}>Geospatial hub</span>
            <h3 className={styles.FallbackTitle}>Map preview requires a Mapbox token</h3>
            <p className={styles.FallbackText}>
              The rest of the frontend remains fully usable while the token is configured.
              Featured places still appear below as a structured preview.
            </p>
          </div>

          <div className={styles.FallbackList} role="list" aria-label="Place preview">
            {(places || []).slice(0, 4).map((place) => (
              <div key={place.id || place.slug || place.title} className={styles.FallbackItem} role="listitem">
                <div className={styles.FallbackDot} aria-hidden="true" />
                <div>
                  <strong className={styles.FallbackItemTitle}>{place.title || place.name}</strong>
                  <div className={styles.FallbackItemMeta}>
                    <MapPin size={12} />
                    <span>{place.location}</span>
                  </div>
                </div>
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
    </div>
  );
}

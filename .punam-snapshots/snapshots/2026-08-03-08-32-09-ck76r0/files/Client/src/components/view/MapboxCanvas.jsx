import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';
import { useMemo } from 'react';
import { useMapbox } from '@library';
import { MapboxCanvasStyles as styles } from '@styles';

const DEFAULT_CENTER = [36.8219, -1.2921];

/**
 * @param {object} props
 * @param {Array} [props.places]
 * @param {{ lng: number, lat: number, label?: string } | null} [props.focus] - geocoded search target
 * @param {string} [props.focusLabel]
 */
export function MapboxCanvas({ places = [], focus = null, focusLabel = '' }) {
  const center = useMemo(() => {
    if (focus && Number.isFinite(focus.lng) && Number.isFinite(focus.lat)) {
      return [focus.lng, focus.lat];
    }
    const first = Array.isArray(places)
      ? places.find(
          (place) =>
            Number.isFinite(Number(place.longitude ?? place.lng)) &&
            Number.isFinite(Number(place.latitude ?? place.lat))
        )
      : null;
    if (first) {
      return [
        Number(first.longitude ?? first.lng),
        Number(first.latitude ?? first.lat),
      ];
    }
    return DEFAULT_CENTER;
  }, [places, focus]);

  const resolvedFocus = useMemo(() => {
    if (!focus || !Number.isFinite(focus.lng) || !Number.isFinite(focus.lat)) return null;
    return {
      lng: focus.lng,
      lat: focus.lat,
      label: focus.label || focusLabel || '',
      zoom: focus.zoom || 13.5,
    };
  }, [focus, focusLabel]);

  const { mapContainerRef, isMapboxReady, supportsMapbox } = useMapbox({
    center,
    zoom: resolvedFocus ? 13.5 : 11.2,
    places,
    focus: resolvedFocus,
  });

  if (!supportsMapbox) {
    // Static fallback: OpenStreetMap embed when we have focus or place coords
    const embedTarget =
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

    if (embedTarget) {
      const delta = 0.04;
      const bbox = [
        embedTarget.lng - delta,
        embedTarget.lat - delta,
        embedTarget.lng + delta,
        embedTarget.lat + delta,
      ].join('%2C');
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${embedTarget.lat}%2C${embedTarget.lng}`;

      return (
        <div className={styles.MapContainer}>
          <iframe
            title={embedTarget.label || 'Map'}
            src={osmUrl}
            className={styles.EmbedFrame}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {embedTarget.label && (
            <div className={styles.FocusBanner}>
              <Navigation size={14} />
              <span>{embedTarget.label}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.MapContainer}>
        <div className={styles.FallbackPanel}>
          <div className={styles.FallbackHeader}>
            <span className={styles.FallbackEyebrow}>Geospatial hub</span>
            <h3 className={styles.FallbackTitle}>Map preview</h3>
            <p className={styles.FallbackText}>
              Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> for the full interactive map, or search an
              area (e.g. Kilimani) to pin a location via free geocoding.
            </p>
          </div>
          <div className={styles.FallbackList} role="list" aria-label="Place preview">
            {(places || []).slice(0, 4).map((place) => (
              <div
                key={place.id || place.slug || place.title}
                className={styles.FallbackItem}
                role="listitem"
              >
                <div className={styles.FallbackDot} aria-hidden="true" />
                <div>
                  <strong className={styles.FallbackItemTitle}>
                    {place.title || place.name}
                  </strong>
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
      {resolvedFocus?.label && isMapboxReady && (
        <div className={styles.FocusBanner}>
          <Navigation size={14} />
          <span>{resolvedFocus.label}</span>
        </div>
      )}
    </div>
  );
}

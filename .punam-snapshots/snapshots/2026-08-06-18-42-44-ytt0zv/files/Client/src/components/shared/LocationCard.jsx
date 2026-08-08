import { Bus, ExternalLink, MapPin } from 'lucide-react';
import { LocationCardStyles as styles } from '@styles';

export function LocationCard({
  name,
  address,
  directions,
  matatu,
  town,
  county,
  latitude,
  longitude,
  image,
  compact = false,
}) {
  const title = name || 'Location';
  const subtitle = [address || town, county].filter(Boolean).join(', ') || 'Kenya';
  const queryParts = [name, address, town, county, 'Kenya'].filter(Boolean);
  const mapsQuery = encodeURIComponent(queryParts.join(', '));
  const hasCoords =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude));
  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${Number(latitude)},${Number(longitude)}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`;
  const openUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`
    : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section
      className={compact ? styles.ShellCompact : styles.Shell}
      aria-label={`Location — ${title}`}
    >
      <div className={styles.MapStage}>
        <iframe
          title={`Map of ${title}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={styles.MapFrame}
        />
        <div className={styles.MapScrim} aria-hidden="true" />
        <div className={styles.MapBadge}>
          <MapPin size={14} />
          <span>Live map</span>
        </div>
      </div>

      <div className={styles.Body}>
        <div className={styles.Identity}>
          {image ? (
            <img src={image} alt="" className={styles.Thumb} loading="lazy" />
          ) : (
            <span className={styles.ThumbFallback} aria-hidden="true">
              <MapPin size={18} />
            </span>
          )}
          <div className={styles.IdentityText}>
            <h3 className={styles.Name}>{title}</h3>
            <p className={styles.Sub}>{subtitle}</p>
          </div>
        </div>

        {(matatu || directions) && (
          <div className={styles.Transit}>
            <Bus size={15} aria-hidden="true" />
            <p>{directions || matatu}</p>
          </div>
        )}

        <a className={styles.MapsCta} href={openUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
          <ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}

import { useMapbox } from '@library';
import { MapboxCanvasStyles as styles } from '@styles';

export function MapboxCanvas() {
  const { mapContainerRef } = useMapbox();

  return (
    <div className={styles.MapContainer}>
      <div ref={mapContainerRef} className={styles.CanvasViewport} />
    </div>
  );
}
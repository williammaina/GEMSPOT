import { useMapbox } from '@library';
import { MapboxCanvasStyles as styles } from '@styles';

export function MapboxCanvas() {
  const { mapContainerRef } = useMapbox();

  return (
    <div className={styles.MapContainer}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
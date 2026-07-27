import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Note: You will need to replace this with your actual Mapbox access token later
mapboxgl.accessToken = 'pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xhY2Vob2xkZXIifQ.placeholder'; 

export function useMapbox(center = [36.8219, -1.2921], zoom = 11) { // Default to Nairobi
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Matches the dark premium theme
      center: center,
      zoom: zoom,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => mapInstance.remove();
  }, [center, zoom]);

  return { mapContainerRef, map };
}
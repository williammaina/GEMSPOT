import { useState, useEffect } from 'react';

export function useWeather(location) {
  const [weather, setWeather] = useState({ condition: null, loading: true });

  useEffect(() => {
    // Mocking an API call to a weather service
    const timer = setTimeout(() => {
      setWeather({ 
        condition: 'Light rain', 
        temp: 18,
        loading: false 
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  return weather;
}
import { Cloud, CloudRain, Droplets, Thermometer, Wind, Loader2 } from 'lucide-react';
import styles from '../../styles/components/shared/WeatherBanner.module.css';
import { useWeather } from '../../library/hooks/useWeather.js';

export function WeatherBanner({ location, lat, lng, title = "Today's weather" }) {
  const coords =
    lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : null;
  const wx = useWeather(coords || location || 'Nairobi');

  if (wx.loading) {
    return (
      <div className={styles.Banner} aria-busy="true">
        <Loader2 size={16} className={styles.Spin} />
        <span>Checking weather…</span>
      </div>
    );
  }

  if (wx.error && wx.temp == null) {
    return (
      <div className={styles.BannerMuted}>
        <Cloud size={16} />
        <span>Weather unavailable right now</span>
      </div>
    );
  }

  const wet = (wx.precipProb || 0) >= 40;
  const Icon = wet ? CloudRain : Cloud;

  return (
    <section className={styles.Banner} aria-label={title}>
      <div className={styles.IconWrap}>
        <Icon size={20} />
      </div>
      <div className={styles.Body}>
        <strong className={styles.Title}>{title}</strong>
        <p className={styles.Line}>
          {wx.condition || '—'}
          {wx.label ? ` · ${wx.label}` : ''}
        </p>
        <div className={styles.Stats}>
          {wx.temp != null && (
            <span>
              <Thermometer size={13} /> {Math.round(wx.temp)}°C
            </span>
          )}
          {wx.high != null && wx.low != null && (
            <span>
              H {Math.round(wx.high)}° / L {Math.round(wx.low)}°
            </span>
          )}
          {wx.precipProb != null && (
            <span>
              <Droplets size={13} /> {wx.precipProb}% rain
            </span>
          )}
          {wx.wind != null && (
            <span>
              <Wind size={13} /> {Math.round(wx.wind)} km/h
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

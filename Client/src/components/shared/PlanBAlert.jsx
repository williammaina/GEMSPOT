import { AlertTriangle } from 'lucide-react';
import { PlanBAlertStyles as styles } from '@styles';

export function PlanBAlert({ 
  location = 'your area', 
  condition = 'Unfavorable weather', 
  altSuggestions = [] 
}) {
  const suggestions = Array.isArray(altSuggestions) ? altSuggestions : [];

  return (
    <aside 
      className={styles.AlertContainer} 
      role="region" 
      aria-label="Plan B Weather Alert"
      tabIndex={0}
    >
      <div className={styles.AlertHeader}>
        <AlertTriangle size={18} aria-hidden="true" />
        <span>Plan B</span>
      </div>

      <p className={styles.AlertText}>
        <span className={styles.HighlightText}>{condition}</span> expected in{' '}
        <span className={styles.HighlightText}>{location}</span>. Need an indoor spot? Check out these nearby indoor alternatives:
      </p>

      {suggestions.length > 0 && (
        <div className={styles.AlternativeImages} aria-label="Alternative spot previews">
          {suggestions.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`Alternative spot preview ${idx + 1} in ${location}`} 
              className={styles.AltImage} 
              loading="lazy"
            />
          ))}
        </div>
      )}
    </aside>
  );
}
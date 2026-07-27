import { AlertTriangle } from 'lucide-react';
import { PlanBAlertStyles as styles } from '@styles';

export function PlanBAlert({ location, condition, altSuggestions }) {
  return (
    <div className={styles.AlertContainer}>
      <div className={styles.AlertHeader}>
        <AlertTriangle size={18} />
        <span>Plan B</span>
      </div>
      <p className={styles.AlertText}>
        {condition} expected in {location}. Need an indoor spot? Check out these nearby cafes.
      </p>
      {altSuggestions && (
        <div className={styles.AlternativeImages}>
          {altSuggestions.map((img, idx) => (
            <img key={idx} src={img} alt="Alternative spot" className={styles.AltImage} />
          ))}
        </div>
      )}
    </div>
  );
}
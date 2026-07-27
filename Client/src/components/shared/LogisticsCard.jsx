import { Wallet, Smartphone, ShieldCheck, Wifi, Ticket, Shirt } from 'lucide-react';
import { clsx } from 'clsx';
import { LogisticsCardStyles as styles } from '@styles';
import { formatKES } from '@library';

export function LogisticsCard({ title, type, details = {} }) {
  const isNoSurprises = type === 'no-surprises';

  return (
    <article className={styles.CardWrapper}>
      {title && <h3 className={styles.CardHeader}>{title}</h3>}
      
      <div className={styles.LogisticsList}>
        {!isNoSurprises ? (
          <>
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Wallet size={16} />
              </div>
              <span>
                Average Damage: <strong className={styles.ListItemText}>{details.damage ? formatKES(details.damage) : 'N/A'}</strong> for two
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Smartphone size={16} />
              </div>
              <span>
                M-Pesa Till: <strong className={styles.ListItemText}>{details.mpesaAvailable !== false ? 'Available' : 'Cash Only'}</strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <ShieldCheck size={16} />
              </div>
              <span>
                Parking: <strong className={styles.ListItemText}>{details.parking || 'Secure Parking Available'}</strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Wifi size={16} />
              </div>
              <span>
                Wi-Fi: <strong className={styles.ListItemText}>{details.wifi || 'Reliable'}</strong>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Ticket size={16} />
              </div>
              <span>
                Gate Fee: <strong className={styles.ListItemText}>{details.gateFee || 'None'}</strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Shirt size={16} />
              </div>
              <span>
                Dress Code: <strong className={styles.ListItemText}>{details.dressCode || 'Smart Casual'}</strong>
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
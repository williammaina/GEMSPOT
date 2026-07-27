import { Wallet, Smartphone, ShieldCheck, Wifi, Ticket, Shirt } from 'lucide-react';
import { LogisticsCardStyles as styles } from '@styles';
import { formatKES } from '@library';

export function LogisticsCard({ title, type, details }) {
  // Renders either the general Logistics or the No-Surprises variant based on 'type'
  const isNoSurprises = type === 'no-surprises';

  return (
    <div className={styles.CardWrapper}>
      <h3 className={styles.CardHeader}>{title}</h3>
      <div className={styles.LogisticsList}>
        {!isNoSurprises ? (
          <>
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}><Wallet size={16} /></div>
              <span>Average Damage: {formatKES(details.damage)} for two</span>
            </div>
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}><Smartphone size={16} /></div>
              <span>M-Pesa Till Available</span>
            </div>
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}><ShieldCheck size={16} /></div>
              <span>Secure Parking Available</span>
            </div>
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}><Wifi size={16} /></div>
              <span>Wi-Fi: Reliable</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.ListItem}>
              <div className={`${styles.IconWrapper} ${styles.RubyIcon}`}><Ticket size={16} /></div>
              <span>Gate Fee: {details.gateFee || 'None'}</span>
            </div>
            <div className={styles.ListItem}>
              <div className={`${styles.IconWrapper} ${styles.RubyIcon}`}><Shirt size={16} /></div>
              <span>Dress Code: {details.dressCode || 'Smart Casual'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
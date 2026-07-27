import { Wallet, Smartphone, ShieldCheck, Wifi, Ticket, Shirt } from 'lucide-react';
import clsx from 'clsx';
import { LogisticsCardStyles as styles } from '@styles';
import { formatKES } from '@library';

function renderMoney(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'number' || typeof value === 'string') return formatKES(value);
  return String(value);
}

function renderAvailability(value, availableLabel, unavailableLabel, fallback = 'Not listed') {
  if (typeof value === 'boolean') return value ? availableLabel : unavailableLabel;
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

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
                Average Damage:{' '}
                <strong className={styles.ListItemText}>
                  {renderMoney(details.damage ?? details.damageForTwo)}
                </strong>{' '}
                for two
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Smartphone size={16} />
              </div>
              <span>
                M-Pesa Till:{' '}
                <strong className={styles.ListItemText}>
                  {renderAvailability(details.mpesaAvailable, 'Available', 'Cash Only')}
                </strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <ShieldCheck size={16} />
              </div>
              <span>
                Parking:{' '}
                <strong className={styles.ListItemText}>
                  {renderAvailability(details.parking, 'Secure parking available', 'Parking not listed')}
                </strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Wifi size={16} />
              </div>
              <span>
                Wi-Fi:{' '}
                <strong className={styles.ListItemText}>
                  {renderAvailability(details.wifi, 'Reliable', 'Not available')}
                </strong>
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
                Gate Fee:{' '}
                <strong className={styles.ListItemText}>
                  {details.gateFee || details.gate_fee || 'None'}
                </strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Shirt size={16} />
              </div>
              <span>
                Dress Code:{' '}
                <strong className={styles.ListItemText}>
                  {details.dressCode || details.dress_code || 'Smart Casual'}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

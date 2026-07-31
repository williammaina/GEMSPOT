import { Wallet, Smartphone, ShieldCheck, Wifi, Ticket, Shirt, Bus, Clock } from 'lucide-react';
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

  const matatu =
    details.matatu ||
    details.matatu_route ||
    details.matatuRoute ||
    details.transport ||
    '';

  const till =
    details.till_number ||
    details.tillNumber ||
    details.till ||
    null;

  const hours = details.opening_hours || details.openingHours || details.hours || '';

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
                Average damage:{' '}
                <strong className={styles.ListItemText}>
                  {renderMoney(details.damage ?? details.damage_for_two ?? details.price ?? details.damageForTwo)}
                </strong>{' '}
                for two
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Smartphone size={16} />
              </div>
              <span>
                M-Pesa:{' '}
                <strong className={styles.ListItemText}>
                  {details.mpesaAvailable || details.mpesa_available
                    ? till
                      ? `Till ${till}`
                      : 'Available'
                    : renderAvailability(
                        details.mpesaAvailable ?? details.mpesa_available,
                        'Available',
                        'Cash only'
                      )}
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
                  {renderAvailability(
                    details.parking,
                    'Secure parking available',
                    'Limited / street parking'
                  )}
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
                  {renderAvailability(details.wifi, 'Available', 'Not available')}
                </strong>
              </span>
            </div>

            {/* Matatu routes — always shown when present */}
            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Bus size={16} />
              </div>
              <span>
                Matatu:{' '}
                <strong className={styles.ListItemText}>
                  {matatu || 'Uber / Bolt recommended'}
                </strong>
              </span>
            </div>

            {hours && (
              <div className={styles.ListItem}>
                <div className={styles.IconWrapper}>
                  <Clock size={16} />
                </div>
                <span>
                  Hours:{' '}
                  <strong className={styles.ListItemText}>{hours}</strong>
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Ticket size={16} />
              </div>
              <span>
                Gate fee:{' '}
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
                Dress code:{' '}
                <strong className={styles.ListItemText}>
                  {details.dressCode || details.dress_code || 'Smart Casual'}
                </strong>
              </span>
            </div>

            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Bus size={16} />
              </div>
              <span>
                Getting there:{' '}
                <strong className={styles.ListItemText}>
                  {matatu || 'Check map for directions'}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

import { useMemo, useState } from 'react';
import {
  Wallet,
  Smartphone,
  ShieldCheck,
  Wifi,
  Ticket,
  Shirt,
  Bus,
  Clock,
  Users,
  Shield,
  Sun,
} from 'lucide-react';
import clsx from 'clsx';
import { LogisticsCardStyles as styles } from '@styles';
import { formatKES } from '@library';
import { useCrowdLevel, safetyLevelFromPlace } from '../../library/hooks/useCrowdLevel.js';
import { useApp } from '../../library/contexts/AppContext.js';
import {
  getFreshness,
  safetyNotesForPlace,
  reportOpenStatus,
  aggregateOpenStatus,
} from '../../library/helpers/trustLayer.js';

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
  const placeId = details.place_id ?? details.id;
  const { user, pushToast } = useApp();
  const crowd = useCrowdLevel(placeId, details.category, user?.id || user?.email);
  const safety = safetyLevelFromPlace(details);
  const bestTime =
    details.bestTime || details.best_time || details.peakHours || details.peak_hours || '';

  const freshness = useMemo(() => getFreshness(details), [details]);
  const safetyNotes = useMemo(() => safetyNotesForPlace(details), [details]);
  const [openLive, setOpenLive] = useState(() =>
    aggregateOpenStatus(placeId, details.openNow)
  );

  const matatu =
    details.matatu || details.matatu_route || details.matatuRoute || details.transport || '';

  const till = details.till_number || details.tillNumber || details.till || null;
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
                  {renderMoney(
                    details.damage ?? details.damage_for_two ?? details.price ?? details.damageForTwo
                  )}
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
                  {details.mpesaAvailable || details.mpesa_available || details.mpesa
                    ? till
                      ? `Till ${till}`
                      : 'Available'
                    : renderAvailability(
                        details.mpesaAvailable ?? details.mpesa_available ?? details.mpesa,
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

            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Bus size={16} />
              </div>
              <span>
                Matatu:{' '}
                <strong className={styles.ListItemText}>{matatu || 'Uber / Bolt recommended'}</strong>
              </span>
            </div>

            {hours && (
              <div className={styles.ListItem}>
                <div className={styles.IconWrapper}>
                  <Clock size={16} />
                </div>
                <span>
                  Hours: <strong className={styles.ListItemText}>{hours}</strong>
                </span>
              </div>
            )}

            {/* Live crowd */}
            <div className={styles.LiveBlock}>
              <div className={styles.LiveHead}>
                <Users size={15} />
                <span>Live crowd</span>
                <span className={styles.LivePulse} aria-hidden="true" />
              </div>
              <div className={styles.CrowdMeter} role="meter" aria-valuenow={crowd.score} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={clsx(styles.CrowdFill, styles[`Crowd_${crowd.tone}`])}
                  style={{ width: `${crowd.score}%` }}
                />
              </div>
              <div className={styles.CrowdMeta}>
                <strong className={styles[`Label_${crowd.tone}`]}>{crowd.label}</strong>
                <span>{crowd.score}% · {crowd.reportsLast4h} report{crowd.reportsLast4h === 1 ? '' : 's'} (4h){crowd.hasCommunity ? ' · live' : ' · estimated'}</span>
              </div>
              <div className={styles.CrowdActions} role="group" aria-label="Report crowd level">
                {['quiet', 'moderate', 'busy', 'packed'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={styles.CrowdChip}
                    onClick={() => {
                      crowd.report(k);
                      pushToast?.(`Crowd updated · ${k}`, 'success');
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Safety */}
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Shield size={16} />
              </div>
              <span>
                Safety:{' '}
                <strong className={styles.ListItemText}>{safety.label}</strong>
              </span>
            </div>

            {/* Best time */}
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Sun size={16} />
              </div>
              <span>
                Best time to visit:{' '}
                <strong className={styles.ListItemText}>
                  {bestTime || 'Late afternoon / early evening'}
                </strong>
              </span>
            </div>

            {/* Live open check-ins */}
            <div className={styles.ListItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <span>
                Status:{' '}
                <strong className={styles.ListItemText}>{openLive.label}</strong>
              </span>
              <div className={styles.CrowdActions} role="group" aria-label="Report open status">
                <button
                  type="button"
                  className={styles.CrowdChip}
                  onClick={() => {
                    const next = reportOpenStatus(placeId, true, user?.id || user?.email);
                    setOpenLive(next);
                    pushToast?.('Marked open — thanks', 'success');
                  }}
                >
                  I'm here · open
                </button>
                <button
                  type="button"
                  className={styles.CrowdChip}
                  onClick={() => {
                    const next = reportOpenStatus(placeId, false, user?.id || user?.email);
                    setOpenLive(next);
                    pushToast?.('Marked closed — thanks', 'info');
                  }}
                >
                  Looks closed
                </button>
              </div>
            </div>

            {/* Safety notes */}
            {safetyNotes.length > 0 && (
              <div className={styles.ListItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ fontWeight: 700 }}>Safety notes</span>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {safetyNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Freshness */}
            <div className={styles.ListItem}>
              <div className={styles.IconWrapper}>
                <Clock size={16} />
              </div>
              <span>
                Listing:{' '}
                <strong className={styles.ListItemText}>
                  {freshness.label}
                  {freshness.stale ? ' · may need a refresh' : ''}
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
            <div className={styles.ListItem}>
              <div className={clsx(styles.IconWrapper, styles.RubyIcon)}>
                <Sun size={16} />
              </div>
              <span>
                Best time:{' '}
                <strong className={styles.ListItemText}>
                  {bestTime || 'Check hours above'}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

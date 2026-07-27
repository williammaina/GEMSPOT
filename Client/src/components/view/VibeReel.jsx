import { Play } from 'lucide-react';
import { VibeReelStyles as styles } from '@styles';

export function VibeReel({ 
  user = { 
    name: 'Vibe Check Reel', 
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg' 
  },
  reels = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80',
  ],
  onSelectReel
}) {
  const reelList = Array.isArray(reels) ? reels : [];

  return (
    <section className={styles.ReelContainer} aria-label="Vibe Check Reels">
      <div className={styles.Header}>
        <img 
          src={user.avatar} 
          alt={user.name} 
          className={styles.Avatar} 
          loading="lazy"
        />
        <h4 className={styles.Title}>{user.name}</h4>
      </div>

      <div className={styles.VideoGrid} role="region" aria-label="Video reel gallery">
        {reelList.map((src, idx) => {
          const imageUrl = typeof src === 'string' ? src : src.thumbnail;

          return (
            <button
              key={idx}
              type="button"
              className={styles.VideoThumb}
              onClick={() => onSelectReel && onSelectReel(src, idx)}
              aria-label={`Play vibe reel ${idx + 1}`}
            >
              <img 
                src={imageUrl} 
                alt={`Vibe reel preview ${idx + 1}`} 
                className={styles.Image} 
                loading="lazy"
              />
              <div className={styles.PlayOverlay}>
                <div className={styles.PlayIconWrapper}>
                  <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
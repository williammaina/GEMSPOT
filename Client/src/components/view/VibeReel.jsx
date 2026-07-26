import { Play } from 'lucide-react';
import { VibeReelStyles as styles } from '@styles';

export function VibeReel() {
  const reels = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80',
  ];

  return (
    <div className={styles.ReelContainer}>
      <div className={styles.Header}>
        <img 
          src="https://randomuser.me/api/portraits/women/44.jpg" 
          alt="User" 
          className={styles.Avatar} 
        />
        <span>Vibe Check Reel</span>
      </div>
      <div className={styles.VideoGrid}>
        {reels.map((src, idx) => (
          <div key={idx} className={styles.VideoThumb}>
            <img src={src} alt={`Reel ${idx}`} className={styles.Image} />
            <div className={styles.PlayOverlay}>
              <Play size={24} color="white" fill="white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { CategoryThemeCardStyles as styles } from '@styles';

export function CategoryThemeCard({ title, theme, image, path, badgeLabel }) {
  // Map the theme prop to the specific CSS classes
  const themeClassMap = {
    emerald: styles.ThemeEmerald,
    amber: styles.ThemeAmber,
    sapphire: styles.ThemeSapphire,
    ruby: styles.ThemeRuby,
  };

  const badgeClassMap = {
    emerald: styles.BadgeEmerald,
    amber: styles.BadgeAmber,
    sapphire: styles.BadgeSapphire,
    ruby: styles.BadgeRuby,
  };

  return (
    <Link to={path} className={clsx(styles.ThemeCard, themeClassMap[theme])}>
      <img src={image} alt={title} className={styles.BackgroundImage} />
      <div className={styles.GradientOverlay} />
      
      {badgeLabel && (
        <div className={clsx(styles.Badge, badgeClassMap[theme])}>
          {badgeLabel}
        </div>
      )}
      
      <h3 className={styles.Title}>{title}</h3>
    </Link>
  );
}
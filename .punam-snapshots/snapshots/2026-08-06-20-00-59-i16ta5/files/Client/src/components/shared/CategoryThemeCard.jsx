import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CategoryThemeCardStyles as styles } from '@styles';

export function CategoryThemeCard({
  title,
  theme = 'emerald',
  image,
  path = '#',
  badgeLabel,
}) {
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

  const selectedThemeClass = themeClassMap[theme] || styles.ThemeEmerald;
  const selectedBadgeClass = badgeClassMap[theme] || styles.BadgeEmerald;

  return (
    <Link to={path} className={clsx(styles.ThemeCard, selectedThemeClass)} aria-label={title}>
      <img
        src={image}
        alt={title}
        className={styles.BackgroundImage}
        loading="lazy"
      />
      <div className={styles.GradientOverlay} />

      {badgeLabel && (
        <div className={clsx(styles.Badge, selectedBadgeClass)}>
          {badgeLabel}
        </div>
      )}

      <h3 className={styles.Title}>{title}</h3>
    </Link>
  );
}

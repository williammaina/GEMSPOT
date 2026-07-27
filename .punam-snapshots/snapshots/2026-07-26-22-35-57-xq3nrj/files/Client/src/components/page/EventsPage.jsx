import { EventCard } from '@components';
import { eventsData } from '@library';
import { EventsPageStyles as styles } from '@styles';

export function EventsPage() {
  const featuredEvent = eventsData.find(e => e.featured);
  const trendingEvents = eventsData.filter(e => !e.featured);

  // Duplicating the non-featured event for UI demonstration purposes
  const mockGrid = [...trendingEvents, ...trendingEvents, ...trendingEvents];

  return (
    <div className={styles.PageLayout}>
      <div className={styles.GridContainer}>
        
        {/* Left Column: Trending Grid */}
        <div>
          <h2 className={styles.SectionHeader}>Trending This Weekend</h2>
          <div className={styles.TrendingGrid}>
            {mockGrid.map((event, idx) => (
              <EventCard key={`${event.id}-${idx}`} event={event} />
            ))}
          </div>
        </div>

        {/* Right Column: Featured Event */}
        <div className={styles.FeaturedSidebar}>
          {featuredEvent && <EventCard event={featuredEvent} />}
        </div>

      </div>
    </div>
  );
}
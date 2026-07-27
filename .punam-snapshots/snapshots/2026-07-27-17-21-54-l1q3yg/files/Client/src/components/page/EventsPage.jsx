import { useMemo } from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { CalendarButton, EventCard } from '@components';
import { EventsPageStyles as styles } from '@styles';
import { eventsData, useCalendar } from '@library';

export function EventsPage() {
  const { syncEvent } = useCalendar();

  const featuredEvent = useMemo(
    () => eventsData.find((event) => event.featured) || eventsData[0],
    []
  );

  const upcomingEvents = useMemo(
    () => eventsData.filter((event) => !event.featured),
    []
  );

  return (
    <main className={styles.PageLayout}>
      <h1 className={styles.SectionHeader}>Upcoming Curated Events</h1>

      <div className={styles.GridContainer}>
        <section className={styles.TrendingGrid} aria-label="Event grid">
          {eventsData.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>

        <aside className={styles.FeaturedSidebar} aria-label="Featured event">
          <div className={styles.SidebarCard}>
            <div className={styles.SidebarEyebrow}>
              <Sparkles size={14} /> Featured pick
            </div>
            <h2 className={styles.SidebarTitle}>{featuredEvent.title}</h2>
            <p className={styles.SidebarText}>{featuredEvent.description}</p>

            <div className={styles.SidebarMeta}>
              <span>
                <Calendar size={14} /> {featuredEvent.date}
              </span>
              <span>
                <MapPin size={14} /> {featuredEvent.location}
              </span>
            </div>

            <CalendarButton onClick={() => syncEvent(featuredEvent)} />
          </div>

          <div className={styles.SidebarCardMuted}>
            <h3 className={styles.SidebarTitleSmall}>Why this view works</h3>
            <p className={styles.SidebarText}>
              Browse high-signal weekend picks, then add the ones you like to Google Calendar in one click.
            </p>
            <p className={styles.SidebarText}>
              {upcomingEvents.length} more event{upcomingEvents.length === 1 ? '' : 's'} are queued in the curated feed.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

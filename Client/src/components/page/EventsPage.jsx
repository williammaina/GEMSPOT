import { MapPin, Sparkles, Calendar } from 'lucide-react';
import { EventsPageStyles as styles } from '@styles';

export function EventsPage() {
  const events = [
    {
      id: 101,
      title: 'Blankets & Wine Nairobi',
      date: 'AUG 02',
      location: 'Laikipia Gardens',
      price: 'KES 3,000',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600'
    },
    {
      id: 102,
      title: 'Nairobi Street Food Festival',
      date: 'AUG 09',
      location: 'Westlands Square',
      price: 'Free Entry',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600'
    },
    {
      id: 103,
      title: 'Midnight Jazz & Cocktails',
      date: 'AUG 15',
      location: 'Kitisuru Heights',
      price: 'KES 1,500',
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600'
    }
  ];

  return (
    <div className={styles.PageLayout}>
      <h1 className={styles.SectionHeader}>Upcoming Curated Events</h1>

      <div className={styles.GridContainer}>
        {/* Left Column: Main Events Grid */}
        <div className={styles.TrendingGrid}>
          {events.map((evt) => (
            <div key={evt.id} style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(15, 21, 19, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ position: 'relative', height: '160px' }}>
                <img src={evt.image} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(7, 11, 10, 0.85)', color: '#2dd4bf', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {evt.date}
                </span>
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>{evt.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {evt.location}
                  </span>
                  <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{evt.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Sticky Featured Sidebar */}
        <aside className={styles.FeaturedSidebar}>
          <div style={{ padding: '1.25rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#2dd4bf' }} /> Featured Pick
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Get VIP access to exclusive weekend pop-ups across Nairobi before tickets sell out.
            </p>
            <button style={{ width: '100%', padding: '0.75rem', background: '#2dd4bf', border: 'none', borderRadius: '12px', color: '#070b0a', fontWeight: 700, cursor: 'pointer' }}>
              Explore VIP Passes
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, HomePage, ExplorePage, EventsPage, PlaceDetailPage } from '@components';
import { NavbarStyles as styles } from '@styles';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className={styles.AppContent}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/place/:id" element={<PlaceDetailPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
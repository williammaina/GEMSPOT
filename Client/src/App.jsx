import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, HomePage, ExplorePage, EventsPage, PlaceDetailPage } from '@components';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/place/:id" element={<PlaceDetailPage />} />
      </Routes>
    </Router>
  );
}
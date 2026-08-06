import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Navbar,
  HomePage,
  ExplorePage,
  EventsPage,
  PlaceDetailPage,
  EventDetailPage,
  SavedPage,
  PlanSharePage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  AdminDashboard,
  SiteFooter,
  ToastStack,
  PlanNightBar,
  BottomTabBar,
} from '@components';
import { RouteEffects } from './components/layout/RouteEffects.jsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.jsx';
import { ProtectedRoute } from './app/site/private/authorization/ProtectedRoute.jsx';
import { NavbarStyles as styles } from '@styles';

export default function App() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Navbar />
      <ErrorBoundary>
        <main id="main-content" className={styles.AppContent} tabIndex={-1}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Auth-required */}
            <Route element={<ProtectedRoute />}>
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/place/:id" element={<PlaceDetailPage />} />
              <Route path="/plan" element={<PlanSharePage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route
              path="*"
              element={
                <div style={{ padding: '120px 24px', textAlign: 'center' }}>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    Page not found
                  </h1>
                  <p style={{ color: 'var(--color-text-muted)' }}>
                    That route does not exist in GemSpot KE.
                  </p>
                  <a href="/explore" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    Go explore
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </ErrorBoundary>
      <SiteFooter />
      <PlanNightBar />
      <ToastStack />
      <BottomTabBar />
    </BrowserRouter>
  );
}

export { Navbar } from '../components/layout/Navbar.jsx';

export { CategoryPill } from '../components/shared/CategoryPill.jsx';
export { PlaceCard } from '../components/shared/PlaceCard.jsx';
export { EventCard } from '../components/shared/EventCard.jsx';
export { LogisticsCard } from '../components/shared/LogisticsCard.jsx';
export { PlanBAlert } from '../components/shared/PlanBAlert.jsx';
export { CalendarButton } from '../components/shared/CalendarButton.jsx';

export { MasterSearch } from '../components/view/MasterSearch.jsx';
export { MapboxCanvas } from '../components/view/MapboxCanvas.jsx';
export { VibeReel } from '../components/view/VibeReel.jsx';
export { ReviewSection } from '../components/view/ReviewSection.jsx';

export { HomePage } from '../components/page/HomePage.jsx';
export { ExplorePage } from '../components/page/ExplorePage.jsx';
export { PlaceDetailPage } from '../components/page/PlaceDetailPage.jsx';
export { EventsPage } from '../components/page/EventsPage.jsx';

// ... append to existing exports
export { CategoryThemeCard } from '../components/shared/CategoryThemeCard.jsx';
// HomePage is already exported from the previous step, so no need to duplicate it here.

// ... append to existing exports
export { AppProvider, useApp } from '../components/provider/AppProvider.jsx';
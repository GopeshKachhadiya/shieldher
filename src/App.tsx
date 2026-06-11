import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UserLayout from './components/shared/UserLayout';
import PoliceLayout from './components/shared/PoliceLayout';

// User Auth Pages
import LoginPage from './pages/auth/LoginPage';
import OnboardingPage from './pages/auth/OnboardingPage';

// User Pages
import HomePage from './pages/user/HomePage';
import SOSPage from './pages/user/SOSPage';
import ReportPage from './pages/user/ReportPage';
import MyComplaintsPage from './pages/user/MyComplaintsPage';
import ComplaintDetailPage from './pages/user/ComplaintDetailPage';
import SafetyHubPage from './pages/user/SafetyHubPage';
import ProfilePage from './pages/user/ProfilePage';
import GuardiansPage from './pages/user/GuardiansPage';

// Police Pages
import PoliceLoginPage from './pages/police/PoliceLoginPage';
import PoliceDashboard from './pages/police/PoliceDashboard';
import CaseListPage from './pages/police/CaseListPage';
import CaseDetailPage from './pages/police/CaseDetailPage';
import AnalyticsPage from './pages/police/AnalyticsPage';
import SuspectsPage from './pages/police/SuspectsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* User Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* User Layout Protected Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="sos" element={<SOSPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="complaints" element={<MyComplaintsPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="safety-hub" element={<SafetyHubPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="guardians" element={<GuardiansPage />} />
        </Route>

        {/* Police Auth Routes */}
        <Route path="/police/login" element={<PoliceLoginPage />} />

        {/* Police Layout Protected Routes */}
        <Route path="/police" element={<PoliceLayout />}>
          <Route index element={<PoliceDashboard />} />
          <Route path="cases" element={<CaseListPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="suspects" element={<SuspectsPage />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

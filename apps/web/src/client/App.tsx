import { Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { MonitorsPage } from './pages/MonitorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ScanWaitingRoomPage } from './pages/ScanWaitingRoomPage';
import { ReportPage } from './pages/ReportPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Navbar } from './components/layout/Navbar';
import { BackgroundVideo } from './components/layout/BackgroundVideo';
import { GlassCard } from './components/ui/GlassCard';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <GlassCard className="p-12 max-w-md w-full">
          <h1 className="font-syne text-4xl font-bold text-white mb-3">404</h1>
          <p className="text-frost-300 mb-6">Page not found.</p>
          <Link to="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </GlassCard>
      </main>
    </div>
  );
}

export function App() {
  return (
    <>
      <BackgroundVideo />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/scan/:id" element={<ScanWaitingRoomPage />} />
        <Route path="/report/:id" element={<ReportPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="monitors" element={<MonitorsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuthUser } from '../../lib/auth';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuthUser();
  const [testsToday, setTestsToday] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard/usage', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTestsToday(data.data.testsToday);
          }
        })
        .catch(() => undefined);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar testsToday={testsToday} />
      <main className="md:pl-64 pt-20 min-h-screen">
        <div className="p-6 sm:p-8 max-w-6xl mx-auto">
          {children || <Outlet context={{ testsToday, setTestsToday }} />}
        </div>
      </main>
    </div>
  );
}

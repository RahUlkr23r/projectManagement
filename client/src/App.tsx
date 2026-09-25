import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './features/auth/LoginPage';
import { AdminDashboard } from './features/dashboard/AdminDashboard';
import { PMDashboard } from './features/dashboard/PMDashboard';
import { DeveloperDashboard } from './features/dashboard/DeveloperDashboard';

const DashboardRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <span className="text-xs text-slate-400 font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pb-16">
          {user.role === 'ADMIN' && <AdminDashboard />}
          {user.role === 'PROJECT_MANAGER' && <PMDashboard />}
          {user.role === 'DEVELOPER' && <DeveloperDashboard />}
        </main>
      </div>
    </WebSocketProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}

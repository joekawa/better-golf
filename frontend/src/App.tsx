import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { RoundsList } from './components/rounds/RoundsList';
import { AddRound } from './components/rounds/AddRound';
import { StatsView } from './components/stats/StatsView';
import { ProfileSetup } from './components/profile/ProfileSetup';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, profileIncomplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profileIncomplete && location.pathname !== '/profile/setup') {
    return <Navigate to="/profile/setup" />;
  }

  return <>{children}</>;
};

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
              Dashboard
            </Link>
            <Link to="/rounds" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
              Rounds
            </Link>
            <Link to="/stats" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
              Statistics
            </Link>
          </div>
          <div className="flex items-center">
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rounds"
          element={
            <ProtectedRoute>
              <RoundsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rounds/add"
          element={
            <ProtectedRoute>
              <AddRound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <StatsView />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveCamerasPage from './pages/LiveCamerasPage';
import PeoplePage from './pages/PeoplePage';
import PersonProfilePage from './pages/PersonProfilePage';
import UnknownPersonsPage from './pages/UnknownPersonsPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CamerasPage from './pages/CamerasPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#00f2fe' }}>Loading Surveillance System...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00f2fe',
          colorBgBase: '#0b0f19',
          colorBgContainer: '#162032',
          colorBorder: '#1f2d47',
          colorTextBase: '#f3f4f6',
          borderRadius: 6,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="live-cameras" element={<LiveCamerasPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="people/:id" element={<PersonProfilePage />} />
              <Route path="unknown-persons" element={<UnknownPersonsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailsPage />} />
              <Route path="cameras" element={<CamerasPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;

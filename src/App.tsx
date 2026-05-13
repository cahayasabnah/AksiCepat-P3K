/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Guides from './pages/Guides';
import Facilities from './pages/Facilities';
import AIChat from './pages/AIChat';
import BloodBank from './pages/BloodBank';
import Analytics from './pages/Analytics';
import AppLayout from './components/AppLayout';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('aksi_cepat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('aksi_cepat_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aksi_cepat_user');
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-sans">Memuat AksiCepat...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        
        <Route path="/app" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <Dashboard user={user} />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/app/guides" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <Guides user={user} />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/app/facilities" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <Facilities user={user} />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/app/ai-chat" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <AIChat />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/app/blood-bank" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <BloodBank user={user} />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/app/analytics" element={
          user ? (
            <AppLayout user={user} onLogout={logout}>
              <Analytics user={user} />
            </AppLayout>
          ) : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

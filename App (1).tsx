/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { AnimeDetails } from './pages/AnimeDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

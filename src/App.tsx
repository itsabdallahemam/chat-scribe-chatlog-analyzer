import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ChatlogProvider } from '@/contexts/ChatlogContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import HomePage from '@/pages/HomePage';
import ChatlogEvaluationPage from '@/pages/ChatlogEvaluationPage';
import DashboardPage from '@/pages/DashboardPage';
import SatisfactionPage from '@/pages/SatisfactionPage';
import ResolutionPage from '@/pages/ResolutionPage';
import SettingsPage from '@/pages/SettingsPage';
import ReportPage from '@/pages/ReportPage';
import CPRDetailsPage from '@/pages/CPRDetailsPage';
import Header from '@/components/Header';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ChatlogProvider>
          <div className="min-h-screen bg-app-bg dark:bg-gray-900">
            <Header />
            <main className="container mx-auto">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/evaluate" element={<ChatlogEvaluationPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/satisfaction" element={<SatisfactionPage />} />
                <Route path="/cpr-details" element={<CPRDetailsPage />} />
                <Route path="/resolution" element={<ResolutionPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/report" element={<ReportPage />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </ChatlogProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

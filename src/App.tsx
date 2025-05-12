import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { Profile } from './pages/Profile';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatlogProvider } from './contexts/ChatlogContext';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import ChatlogEvaluationPage from './pages/ChatlogEvaluationPage';
import DashboardPage from './pages/DashboardPage';
import SatisfactionPage from './pages/SatisfactionPage';
import ResolutionPage from './pages/ResolutionPage';
import ReportPage from './pages/ReportPage';
import CPRDetailsPage from './pages/CPRDetailsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ChatlogProvider>
            <div className="min-h-screen bg-app-bg dark:bg-gray-900">
              <Header />
              <main className="container mx-auto">
                <Routes>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<SignupForm />} />
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/evaluate"
                    element={
                      <ProtectedRoute>
                        <ChatlogEvaluationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/satisfaction"
                    element={
                      <ProtectedRoute>
                        <SatisfactionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cpr-details"
                    element={
                      <ProtectedRoute>
                        <CPRDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resolution"
                    element={
                      <ProtectedRoute>
                        <ResolutionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute>
                        <ReportPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Toaster />
            </div>
          </ChatlogProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

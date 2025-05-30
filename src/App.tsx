import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { SelfOrRoleProtectedRoute } from './components/SelfOrRoleProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { Profile } from './pages/Profile';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatlogProvider } from './contexts/ChatlogContext';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import DataPage from './pages/DataPage';
import DashboardPage from './pages/DashboardPage';
import SatisfactionPage from './pages/SatisfactionPage';
import ResolutionPage from './pages/ResolutionPage';
import ReportPage from './pages/ReportPage';
import CPRDetailsPage from './pages/CPRDetailsPage';
import AgentsDashboardPage from './pages/AgentsDashboardPage';
import AgentProfilePage from './pages/AgentProfilePage';
import Index from './pages/Index';
import AgentHomePage from './pages/AgentHomePage';
import TeamLeaderHomePage from './pages/TeamLeaderHomePage';
import TestLoginPage from './pages/TestLoginPage';
import TeamsManagementPage from './pages/TeamsManagementPage';
import CreateTeamPage from './pages/CreateTeamPage';
import ManagerHomePage from './pages/ManagerHomePage';

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
                  {/* Public routes */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<SignupForm />} />
                  <Route path="/" element={<Index />} />
                  
                  {/* Direct routes to homepages for testing */}
                  <Route 
                    path="/homepage/public" 
                    element={<HomePage />} 
                  />
                  <Route 
                    path="/homepage/agent" 
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent"]}>
                          <AgentHomePage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/homepage/team-leader" 
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Team Leader"]}>
                          <TeamLeaderHomePage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/homepage/manager" 
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Manager"]}>
                          <ManagerHomePage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/agents-dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Team Leader"]}>
                          <AgentsDashboardPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <DashboardPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/satisfaction"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <SatisfactionPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cpr-details"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <CPRDetailsPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resolution"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <ResolutionPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <ReportPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/agent/:id"
                    element={
                      <ProtectedRoute>
                        <SelfOrRoleProtectedRoute allowedRoles={["Team Leader"]}>
                          <AgentProfilePage />
                        </SelfOrRoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/test-login"
                    element={
                      <ProtectedRoute>
                        <TestLoginPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/data"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Agent", "Team Leader", "Manager"]}>
                          <DataPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  {/* Manager Teams Management Page */}
                  <Route
                    path="/teams"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Manager", "Agent", "Team Leader"]}>
                          <TeamsManagementPage />
                        </RoleProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teams/create"
                    element={
                      <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={["Manager"]}>
                          <CreateTeamPage />
                        </RoleProtectedRoute>
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

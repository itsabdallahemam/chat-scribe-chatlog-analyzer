// Update this page (the content is just a fallback if you fail to update the page)

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import HomePage from './HomePage';
import AgentHomePage from './AgentHomePage';
import TeamLeaderHomePage from './TeamLeaderHomePage';
import ManagerHomePage from './ManagerHomePage';

const Index: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { user, loading });
    console.log('User role:', user?.role);
  }, [user, loading]);

  // Show a loading state while checking authentication
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If not logged in, show the public homepage
  if (!user) {
    console.log('Rendering public homepage for non-authenticated user');
    return <HomePage />;
  }

  // Otherwise, render homepage based on user role
  console.log(`Rendering homepage for role: ${user.role}`);
  
  switch (user.role) {
    case 'Agent':
      return <AgentHomePage />;
    case 'Team Leader':
      return <TeamLeaderHomePage />;
    case 'Manager':
      return <ManagerHomePage />;
    default:
      console.log('Unknown role, falling back to public homepage');
      return <HomePage />;
  }
};

export default Index;

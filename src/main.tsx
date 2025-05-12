import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserFeatureProvider } from './contexts/UserFeatureContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ChatlogProvider } from './contexts/ChatlogContext'

// Apply theme on initial load
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = savedTheme || (prefersDark ? 'dark' : 'light');
document.documentElement.classList.toggle('dark', theme === 'dark');

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <UserFeatureProvider>
          <ChatlogProvider>
            <App />
          </ChatlogProvider>
        </UserFeatureProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

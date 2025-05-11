import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply theme on initial load
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = savedTheme || (prefersDark ? 'dark' : 'light');
document.documentElement.classList.toggle('dark', theme === 'dark');

createRoot(document.getElementById("root")!).render(<App />);

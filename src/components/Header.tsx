import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart2, Smile, CheckCircle, Settings, FileText, Info, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
    { path: '/satisfaction', label: 'Satisfaction', icon: <Smile className="w-4 h-4" /> },
    { path: '/cpr-details', label: 'CPR Details', icon: <Info className="w-4 h-4" /> },
    { path: '/resolution', label: 'Resolution', icon: <CheckCircle className="w-4 h-4" /> },
    { path: '/report', label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full flex justify-center items-center py-4 bg-transparent">
      <div className="w-full max-w-7xl flex items-center justify-between rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-xl px-8 py-3 border border-border/40">
        {/* Logo Left */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-app-blue dark:text-app-blue-light tracking-tight">ChatScribe</span>
          </Link>
        </div>
        {/* Navigation Center */}
        <nav className="flex-1 flex justify-center items-center space-x-2">
          {navItems.filter(item => item.path !== '/settings').map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-5 py-2 rounded-full transition-colors font-medium text-base shadow-sm border border-transparent hover:bg-app-blue/10 hover:text-app-blue dark:hover:bg-app-blue-light/10 dark:hover:text-app-blue-light focus:outline-none focus:ring-2 focus:ring-app-blue/30 ${
                isActive(item.path)
                  ? 'bg-app-blue dark:bg-app-blue-light text-white shadow-md'
                  : 'bg-white/70 dark:bg-gray-700/70 text-app-text dark:text-gray-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        {/* Settings and Theme Toggle Right */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full border border-border/40 bg-white/70 dark:bg-gray-700/70 hover:bg-app-blue/10 dark:hover:bg-app-blue-light/10 text-app-text dark:text-gray-200 hover:text-app-blue dark:hover:text-app-blue-light transition shadow-sm focus:outline-none focus:ring-2 focus:ring-app-blue/30"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>
          <Link
            to="/settings"
            className={`flex items-center justify-center w-12 h-12 rounded-full border border-border/40 bg-white/70 dark:bg-gray-700/70 hover:bg-app-blue/10 dark:hover:bg-app-blue-light/10 text-app-text dark:text-gray-200 hover:text-app-blue dark:hover:text-app-blue-light transition shadow-sm focus:outline-none focus:ring-2 focus:ring-app-blue/30 ${
              isActive('/settings') ? 'bg-app-blue dark:bg-app-blue-light text-white shadow-md' : ''
            }`}
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 
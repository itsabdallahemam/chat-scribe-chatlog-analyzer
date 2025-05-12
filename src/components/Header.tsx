import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart2, Smile, CheckCircle, Settings, FileText, Info, Moon, Sun, UploadCloud, Menu, X, UserCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const primaryNavItems = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/evaluate', label: 'Evaluate', icon: <UploadCloud className="w-4 h-4" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  const secondaryNavItems = [
    { path: '/satisfaction', label: 'Satisfaction', icon: <Smile className="w-4 h-4" /> },
    { path: '/cpr-details', label: 'CPR Details', icon: <Info className="w-4 h-4" /> },
    { path: '/resolution', label: 'Resolution', icon: <CheckCircle className="w-4 h-4" /> },
    { path: '/report', label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  const NavLink = ({ item }: { item: typeof primaryNavItems[0] }) => (
    <Link
      to={item.path}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
        isActive(item.path)
          ? 'bg-app-blue dark:bg-app-blue-light text-white shadow-md'
          : 'text-app-text dark:text-gray-200 hover:bg-app-blue/10 hover:text-app-blue dark:hover:bg-app-blue-light/10 dark:hover:text-app-blue-light'
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-app-blue dark:text-app-blue-light tracking-tight">ChatScribe</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Primary Navigation */}
            <nav className="flex items-center space-x-2">
              {primaryNavItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>

            {/* Secondary Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-4 py-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {secondaryNavItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 ${
                        isActive(item.path) ? 'bg-app-blue/10 text-app-blue' : ''
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings and Theme Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* User Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
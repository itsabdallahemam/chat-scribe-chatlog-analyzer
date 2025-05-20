import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, BarChart2, Smile, CheckCircle, FileText, Info, Moon, Sun, 
  UploadCloud, Menu, X, UserCircle, Users, Gauge, 
  LayoutDashboard, Settings, LogOut
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: string[];
  description?: string;
}

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isAllowedToView = (requiredRoles: string[] = []) => {
    if (requiredRoles.length === 0) return true;
    
    if (!user) return false;
    
    return requiredRoles.includes(user.role);
  };

  // Get role-based color for user avatar
  const getRoleBorderColor = (role?: string) => {
    switch (role) {
      case 'Team Leader':
        return "border-[#4582ff]"; // Blue for Team Leader
      case 'Agent':
        return "border-[#22c55e]"; // Green for Agent
      case 'Admin':
        return "border-purple-500"; // Purple for Admin
      default:
        return "border-gray-200 dark:border-gray-700"; // Default
    }
  };

  const navItems: NavItem[] = [
    { 
      path: '/', 
      label: 'Home', 
      icon: <Home className="w-4 h-4" />, 
      allowedRoles: [],
      description: "Upload and analyze chatlogs"
    },
    { 
      path: '/data', 
      label: 'Data', 
      icon: <BarChart2 className="w-4 h-4" />, 
      allowedRoles: ['Agent', 'Team Leader'],
      description: "Upload and analyze chat data"
    },
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-4 h-4" />, 
      allowedRoles: ['Agent'],
      description: "View performance metrics"
    },
    { 
      path: '/agents-dashboard', 
      label: 'Agents', 
      icon: <Users className="w-4 h-4" />, 
      allowedRoles: ['Team Leader'],
      description: "Manage team performance"
    },
    { 
      path: '/satisfaction', 
      label: 'Satisfaction', 
      icon: <Smile className="w-4 h-4" />, 
      allowedRoles: ['Agent'],
      description: "Customer satisfaction metrics"
    },
    { 
      path: '/cpr-details', 
      label: 'CPR', 
      icon: <Gauge className="w-4 h-4" />, 
      allowedRoles: ['Agent'],
      description: "Coherence, Politeness, Relevance metrics"
    },
    { 
      path: '/resolution', 
      label: 'Resolution', 
      icon: <CheckCircle className="w-4 h-4" />, 
      allowedRoles: ['Agent'],
      description: "Resolution rate analysis"
    },
    { 
      path: '/report', 
      label: 'Reports', 
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['Agent'],
      description: "Generate and view reports"
    },
    // Manager-specific Teams nav item
    {
      path: '/teams',
      label: 'Teams',
      icon: <Users className="w-4 h-4" />, 
      allowedRoles: ['Manager'],
      description: 'View and manage teams'
    }
  ];

  const NavLink = ({ item, className }: { item: NavItem; className?: string }) => {
    if (!isAllowedToView(item.allowedRoles)) return null;
    
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                isActive(item.path)
                  ? "bg-white dark:bg-gray-800/60 text-[#252A3A] dark:text-white border-b-2 border-[#22c55e]"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-[#252A3A] dark:hover:text-white",
                className
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className={cn(
                "p-1.5 rounded-md",
                isActive(item.path) 
                  ? item.path === '/satisfaction' 
                    ? "bg-white dark:bg-gray-800 text-[#D4A000] dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-900"
                    : item.path === '/cpr-details'
                    ? "bg-white dark:bg-gray-800 text-[#4582ff] dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-900"
                    : item.path === '/resolution'
                    ? "bg-white dark:bg-gray-800 text-[#22c55e] dark:text-green-400 ring-1 ring-green-200 dark:ring-green-900"
                    : "bg-white dark:bg-gray-800 text-[#252A3A] dark:text-white ring-1 ring-gray-200 dark:ring-gray-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              )}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-white dark:bg-gray-800 text-xs">
            {item.description}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-lg border-b",
        scrolled 
          ? "bg-[#f5f7fa]/95 dark:bg-[#161925]/95 border-gray-200/50 dark:border-gray-800/50 shadow-sm" 
          : "bg-[#f5f7fa]/80 dark:bg-[#161925]/80 border-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] p-2 rounded-lg shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="font-bold text-2xl text-[#252A3A] dark:text-white">
              ChatScribe
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Navigation */}
            <nav className="flex items-center gap-2 mr-2 bg-gray-100/80 dark:bg-gray-800/80 px-2 py-1 rounded-lg">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Toggle */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-lg h-9 w-9 flex items-center justify-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-indigo-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 px-3 py-1 h-9 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <Avatar className={`h-6 w-6 border-2 ${getRoleBorderColor(user.role)}`}>
                      <AvatarFallback className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] text-white text-xs">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline-block max-w-[100px] truncate text-[#252A3A] dark:text-white">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="font-medium text-sm text-[#252A3A] dark:text-white">
                      {user.fullName || user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                  <div className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${
                        user.role === 'Team Leader' ? 'bg-[#EEF4FF] dark:bg-blue-900/30' : 
                        user.role === 'Agent' ? 'bg-[#ECFDF3] dark:bg-green-900/30' : 
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <UserCircle className={`h-3 w-3 ${
                          user.role === 'Team Leader' ? 'text-[#4582ff] dark:text-blue-400' : 
                          user.role === 'Agent' ? 'text-[#22c55e] dark:text-green-400' : 
                          'text-purple-500 dark:text-purple-400'
                        }`} />
                      </div>
                      <span className="text-[#252A3A] dark:text-white">Role: {user.role}</span>
                    </div>
                  </div>
                  <DropdownMenuItem asChild className="py-2 px-3">
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 w-full">
                      <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-700">
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 py-2 px-3">
                    <div className="p-1 rounded-md bg-red-50 dark:bg-red-900/20 mr-3">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] hover:opacity-90 text-white text-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden rounded-lg h-9 w-9 flex items-center justify-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 absolute left-0 right-0 top-16 bg-[#f5f7fa]/95 dark:bg-[#161925]/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 flex flex-col gap-2">
              <div className="font-medium text-xs uppercase text-gray-500 dark:text-gray-400 px-3 py-2">Navigation</div>
              {navItems.map((item) => (
                isAllowedToView(item.allowedRoles) && (
                  <NavLink key={item.path} item={item} className="w-full" />
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
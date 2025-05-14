import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart2, Smile, CheckCircle, FileText, Info, Moon, Sun, UploadCloud, Menu, X, UserCircle, ChevronDown, Users } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: string[];
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

  const primaryNavItems: NavItem[] = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" />, allowedRoles: [] },
    { path: '/evaluate', label: 'Evaluate', icon: <UploadCloud className="w-4 h-4" />, allowedRoles: ['Agent'] },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" />, allowedRoles: ['Agent'] },
    { path: '/agents-dashboard', label: 'Agents Dashboard', icon: <Users className="w-4 h-4" />, allowedRoles: ['Team Leader'] },
  ];

  const analyticsNavItems: NavItem[] = [
    { path: '/satisfaction', label: 'Satisfaction', icon: <Smile className="w-4 h-4" />, allowedRoles: ['Agent'] },
    { path: '/cpr-details', label: 'CPR Details', icon: <Info className="w-4 h-4" />, allowedRoles: ['Agent'] },
    { path: '/resolution', label: 'Resolution', icon: <CheckCircle className="w-4 h-4" />, allowedRoles: ['Agent'] },
  ];

  const reportItem: NavItem = { 
    path: '/report', 
    label: 'Reports', 
    icon: <FileText className="w-4 h-4" />,
    allowedRoles: ['Agent']
  };

  const NavLink = ({ item, className }: { item: NavItem; className?: string }) => {
    if (!isAllowedToView(item.allowedRoles)) return null;
    
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
          isActive(item.path)
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md dark:from-indigo-500 dark:to-purple-500"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
          className
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-lg border-b",
        scrolled 
          ? "bg-white/90 dark:bg-gray-900/90 border-gray-200/50 dark:border-gray-800/50 shadow-sm" 
          : "bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 border-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="font-bold text-transparent text-2xl bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              ChatScribe
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Primary Navigation */}
            <nav className="flex items-center gap-1 mr-2">
              {primaryNavItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>

            {/* Analytics Dropdown */}
            {user && user.role !== 'Team Leader' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 flex items-center gap-2 h-auto">
                    <BarChart2 className="w-4 h-4" />
                    <span>Analytics</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
                  {analyticsNavItems.map((item) => (
                    isAllowedToView(item.allowedRoles) && (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-2 w-full py-2",
                            isActive(item.path) ? "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400" : ""
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  ))}
                  <DropdownMenuSeparator />
                  {isAllowedToView(reportItem.allowedRoles) && (
                    <DropdownMenuItem asChild>
                      <Link 
                        to="/report" 
                        className={cn(
                          "flex items-center gap-2 w-full py-2",
                          isActive("/report") ? "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400" : ""
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Reports</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </Button>

            {/* User Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-2 py-1 h-auto rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <Avatar className="h-6 w-6 border border-gray-200 dark:border-gray-700">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline-block max-w-[100px] truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    Signed in as <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-800">
                    Role: {user.role}
                  </div>
                  <DropdownMenuItem asChild className="py-2">
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="text-sm">Login</Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden rounded-full h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
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
          <div className="lg:hidden py-4 absolute left-0 right-0 top-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 flex flex-col gap-1">
              <div className="font-medium text-xs uppercase text-gray-500 dark:text-gray-400 px-3 py-2">Main Navigation</div>
              {primaryNavItems.map((item) => (
                isAllowedToView(item.allowedRoles) && (
                  <NavLink key={item.path} item={item} className="w-full" />
                )
              ))}
              
              {/* Only show Analytics section for non-Team Leaders */}
              {user && user.role !== 'Team Leader' && (
                <>
                  <div className="font-medium text-xs uppercase text-gray-500 dark:text-gray-400 mt-4 px-3 py-2">Analytics</div>
                  {analyticsNavItems.map((item) => (
                    isAllowedToView(item.allowedRoles) && (
                      <NavLink key={item.path} item={item} className="w-full" />
                    )
                  ))}
                  
                  {isAllowedToView(reportItem.allowedRoles) && (
                    <NavLink 
                      item={reportItem} 
                      className="w-full" 
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, FileText, Home, Info, MessageSquare, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({
  to,
  icon: Icon,
  children,
  collapsed,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  collapsed?: boolean;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        "hover:bg-app-blue-light/10 hover:text-app-blue",
        isActive
          ? "bg-app-blue text-white"
          : "text-app-text"
      )
    }
  >
    <Icon className="h-6 w-6" />
    {!collapsed && <span>{children}</span>}
  </NavLink>
);

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col border-r border-border bg-card p-4 transition-all",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between mb-8">
        <h1 className={cn("text-lg font-bold text-app-blue", collapsed && "hidden")}>
          Chatlog Analyzer
        </h1>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem to="/" icon={Home} collapsed={collapsed}>
          Dashboard
        </NavItem>
        <NavItem to="/settings" icon={Settings} collapsed={collapsed}>
          Settings
        </NavItem>
        <NavItem to="/satisfaction" icon={Users} collapsed={collapsed}>
          Satisfaction
        </NavItem>
        <NavItem to="/cpr-details" icon={Info} collapsed={collapsed}>
          CPR Details
        </NavItem>
        <NavItem to="/resolution-details" icon={MessageSquare} collapsed={collapsed}>
          Resolution
        </NavItem>
      </nav>
      
      <div className={cn("mt-auto pt-4", collapsed && "hidden")}>
        <div className="rounded-lg bg-app-yellow/20 p-4">
          <p className="text-xs text-app-text/70">
            Remember to set your API key in Settings before evaluation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

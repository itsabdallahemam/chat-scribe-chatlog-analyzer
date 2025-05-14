import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  BarChart2, 
  Users,
  UserPlus,
  FileText, 
  ArrowRight, 
  Zap,
  BarChart,
  LineChart,
  PieChart,
  CircleUser,
  TrendingUp,
  TrendingDown,
  Award,
  BellRing,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TeamLeaderHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animateHero, setAnimateHero] = useState(false);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Mock team members - would come from a database in real implementation
  const teamMembers = [
    { id: 1, name: "Alex Johnson", email: "alex@example.com", performance: 92, avatar: "A" },
    { id: 2, name: "Jamie Lee", email: "jamie@example.com", performance: 87, avatar: "J" },
    { id: 3, name: "Casey Morgan", email: "casey@example.com", performance: 78, avatar: "C" },
    { id: 4, name: "Taylor Smith", email: "taylor@example.com", performance: 94, avatar: "T" },
  ];

  // Mock notifications
  const notifications = [
    { id: 1, type: 'performance', message: 'Team performance increased by 4.2%', date: '2025-01-15T14:32:00', read: false },
    { id: 2, type: 'agent', message: 'Taylor Smith achieved a new personal best', date: '2025-01-14T09:15:00', read: false },
    { id: 3, type: 'report', message: 'Monthly team report is now available', date: '2025-01-13T16:47:00', read: true },
  ];

  const quickLinks = [
    {
      title: "Team Dashboard",
      description: "Monitor team performance metrics and analytics",
      icon: <BarChart2 className="h-6 w-6" />,
      path: "/dashboard",
      gradient: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400"
    },
    {
      title: "Agents Overview",
      description: "View and manage agent profiles and performances",
      icon: <Users className="h-6 w-6" />,
      path: "/agents",
      gradient: "from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500"
    },
    {
      title: "Generate Reports",
      description: "Create and export comprehensive team reports",
      icon: <FileText className="h-6 w-6" />,
      path: "/report",
      gradient: "from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400"
    },
    {
      title: "Add New Agent",
      description: "Onboard a new agent to your team",
      icon: <UserPlus className="h-6 w-6" />,
      path: "/signup",
      gradient: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Team Leader Welcome Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent dark:from-green-400/10" />
          
          {/* Animated gradient orbs */}
          <div 
            className={`absolute top-20 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 dark:from-emerald-400/30 dark:to-blue-400/30 blur-3xl opacity-0 transition-opacity duration-1000 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(-30%, -30%)' }}
          />
          <div 
            className={`absolute bottom-20 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-gradient-to-r from-cyan-500/20 to-green-500/20 dark:from-cyan-400/30 dark:to-green-400/30 blur-3xl opacity-0 transition-opacity duration-1000 delay-300 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(20%, 20%)' }}
          />
        </div>
        
        <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-700 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 via-teal-500 to-cyan-500 dark:from-green-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Welcome back, {user?.fullName || 'Team Leader'}
              </h1>
            </div>
            
            <div className={`transform transition-all duration-700 delay-200 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto">
                Monitor your team performance, manage agents, and create detailed reports for your organization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Dashboard Overview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Team Performance Summary */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Team Performance</CardTitle>
                    <CardDescription>Current team metrics overview</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="text-xs hidden sm:flex">
                    View Full Analytics
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Overall Score</span>
                      <span className="bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-xs">+3.8%</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">88%</div>
                    <div className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Team Average</div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">Resolution Rate</span>
                      <span className="bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs">+2.5%</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">92%</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">Last 30 days</div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-amber-700 dark:text-amber-400 font-medium">Response Time</span>
                      <span className="bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs">-12%</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">1.4<span className="text-sm font-normal ml-1">min</span></div>
                    <div className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">Average</div>
                  </div>
                </div>
                
                {/* Fake chart area */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-[140px] sm:h-[180px] w-full relative overflow-hidden mt-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">Team Performance Trend</div>
                      <div className="flex justify-center gap-4 mt-2">
                        <LineChart className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                        <BarChart className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                        <PieChart className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center sm:hidden">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="text-xs">
                    View Full Analytics
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Team Members */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Team Members</CardTitle>
                    <CardDescription>Agent performance overview</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/agents')} className="text-xs">
                    View All Agents
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 dark:bg-gray-800/60 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-br from-green-500 to-cyan-500 dark:from-green-400 dark:to-cyan-400 text-white flex items-center justify-center w-9 h-9 font-medium">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`
                          text-sm font-medium px-2.5 py-1 rounded-full
                          ${member.performance >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            member.performance >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
                        `}>
                          {member.performance}%
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5"
                          onClick={() => navigate(`/agent/${member.id}`)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {quickLinks.map((link, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60"
                    onClick={() => navigate(link.path)}
                  >
                    <div className={`rounded p-1.5 mr-3 bg-gradient-to-r ${link.gradient} text-white`}>
                      {link.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{link.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
            
            {/* Organization Stats */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Organization Stats</CardTitle>
                <CardDescription>Your team's ranking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-3">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Team Ranking</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">2nd</div>
                      <div className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" /> Up 1 position
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/60 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Organization Average</div>
                      <div className="text-sm font-medium">82%</div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Your Team</div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">88%</div>
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm border-gray-200 dark:border-gray-700"
                  onClick={() => navigate('/report')}
                >
                  View Full Reports
                </Button>
              </CardContent>
            </Card>
            
            {/* Notifications */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                    {notifications.filter(n => !n.read).length} New
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-2.5 rounded-lg border ${notification.read 
                        ? 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700' 
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`rounded-full p-1.5 ${
                          notification.type === 'performance' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : notification.type === 'agent' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                          {notification.type === 'performance' ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : notification.type === 'agent' ? (
                            <CircleUser className="h-3.5 w-3.5" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">{notification.message}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(notification.date).toLocaleDateString()} 
                            {!notification.read && (
                              <span className="inline-block ml-2 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 flex justify-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All Notifications
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderHomePage; 
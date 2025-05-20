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
import api from '@/lib/axios';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  performance: number;
  avatar: string;
}

interface Notification {
  id: string;
  type: 'performance' | 'agent' | 'report';
  message: string;
  date: string;
  read: boolean;
}

interface TeamMetrics {
  overallScore: number;
  resolutionRate: number;
  responseTime: number;
  scoreChange: number;
  resolutionChange: number;
  responseChange: number;
  coherence: number;
  politeness: number;
  relevance: number;
  satisfaction: number;
}

interface TeamMetricsResponse {
  overallScore: number;
  resolutionRate: number;
  responseTime: number;
  scoreChange: number;
  resolutionChange: number;
  responseChange: number;
  coherence: number;
  politeness: number;
  relevance: number;
  satisfaction: number;
}

interface Agent {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  teamId: string;
}

const TeamLeaderHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animateHero, setAnimateHero] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Fetch real data from your model
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch team members
        const teamResponse = await api.get<Agent[]>('/auth/team/agents');
        const teamData = teamResponse.data;
        
        // Transform the data to match our TeamMember interface
        const transformedTeamMembers = teamData.map((agent) => ({
          id: agent.id,
          name: agent.fullName,
          email: agent.email,
          performance: 0, // This will be updated when we implement performance metrics
          avatar: agent.fullName.charAt(0).toUpperCase()
        }));
        
        setTeamMembers(transformedTeamMembers);
        
        // Fetch team metrics
        const metricsResponse = await api.get<TeamMetricsResponse>('/auth/team/metrics');
        const metricsData = metricsResponse.data;
        
        // Transform metrics data
        const transformedMetrics: TeamMetrics = {
          overallScore: metricsData.overallScore || 0,
          resolutionRate: metricsData.resolutionRate || 0,
          responseTime: metricsData.responseTime || 0,
          scoreChange: metricsData.scoreChange || 0,
          resolutionChange: metricsData.resolutionChange || 0,
          responseChange: metricsData.responseChange || 0,
          coherence: metricsData.coherence || 0,
          politeness: metricsData.politeness || 0,
          relevance: metricsData.relevance || 0,
          satisfaction: metricsData.satisfaction || 0
        };
        
        setTeamMetrics(transformedMetrics);
        
        // TODO: Implement notifications when the endpoint is ready
        // const notificationData = await fetchNotifications();
        // setNotifications(notificationData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                ) : teamMetrics ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">CPR Score</span>
                        <span className={`${teamMetrics.scoreChange >= 0 ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400'} px-2 py-0.5 rounded text-xs`}>
                          {teamMetrics.scoreChange >= 0 ? '+' : ''}{teamMetrics.scoreChange}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{teamMetrics.overallScore}%</div>
                      <div className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Team Average</div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-700 dark:text-blue-400 font-medium">Resolution Rate</span>
                        <span className={`${teamMetrics.resolutionChange >= 0 ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400'} px-2 py-0.5 rounded text-xs`}>
                          {teamMetrics.resolutionChange >= 0 ? '+' : ''}{teamMetrics.resolutionChange}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{teamMetrics.resolutionRate}%</div>
                      <div className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">Last 30 days</div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-700 dark:text-purple-400 font-medium">Satisfaction</span>
                        <span className="bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded text-xs">
                          {teamMetrics.satisfaction}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{teamMetrics.satisfaction}%</div>
                      <div className="text-xs text-purple-600/70 dark:text-purple-500/70 mt-1">Customer Rating</div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Response Time</span>
                        <span className={`${teamMetrics.responseChange <= 0 ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400'} px-2 py-0.5 rounded text-xs`}>
                          {teamMetrics.responseChange >= 0 ? '+' : ''}{teamMetrics.responseChange}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{teamMetrics.responseTime}<span className="text-sm font-normal ml-1">min</span></div>
                      <div className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">Average</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No performance data available
                  </div>
                )}
                
                {/* Chart area - Replace with your actual chart component */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-[140px] sm:h-[180px] w-full relative overflow-hidden mt-2">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 dark:text-gray-500 text-sm">Team Performance Trend</div>
                        {/* TODO: Replace with your actual chart component */}
                        <div className="flex justify-center gap-4 mt-2">
                          <LineChart className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                          <BarChart className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                          <PieChart className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-center sm:hidden">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="text-xs">
                    View Full Analytics
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* My Team */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">My Team</CardTitle>
                    <CardDescription>Agent performance overview</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/agents')} className="text-xs">
                    View All Agents
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                ) : teamMembers.length > 0 ? (
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
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No team members found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-xl">Quick Links</CardTitle>
                <CardDescription>Access key features quickly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {quickLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      className={`group relative overflow-hidden rounded-lg bg-gradient-to-r ${link.gradient} p-0.5 transition-all hover:scale-[1.02]`}
                    >
                      <div className="relative flex items-center gap-3 rounded-md bg-white dark:bg-gray-800 p-3">
                        <div className={`rounded-lg bg-gradient-to-r ${link.gradient} p-2 text-white`}>
                          {link.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{link.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-xl">Recent Notifications</CardTitle>
                <CardDescription>Stay updated with team activities</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.read 
                            ? 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 rounded-full p-1 ${
                            notification.type === 'performance' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : notification.type === 'agent'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          }`}>
                            {notification.type === 'performance' && <TrendingUp className="h-4 w-4" />}
                            {notification.type === 'agent' && <Users className="h-4 w-4" />}
                            {notification.type === 'report' && <FileText className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(notification.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No notifications available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderHomePage; 
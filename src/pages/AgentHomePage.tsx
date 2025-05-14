import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  FileText, 
  BarChart2, 
  User,
  MessageSquare, 
  ArrowRight, 
  Clock,
  Gauge,
  Activity,
  Check,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AgentHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animateHero, setAnimateHero] = useState(false);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Recent chatlogs - would come from a database in real implementation
  const recentActivities = [
    { id: 1, type: 'evaluation', score: 87, date: '2025-01-15T14:32:00' },
    { id: 2, type: 'evaluation', score: 92, date: '2025-01-14T09:15:00' },
    { id: 3, type: 'evaluation', score: 78, date: '2025-01-13T16:47:00' },
    { id: 4, type: 'evaluation', score: 95, date: '2025-01-12T11:22:00' },
  ];

  const quickActions = [
    {
      title: "My Dashboard",
      description: "View your performance metrics and analytics",
      icon: <BarChart2 className="h-6 w-6" />,
      path: "/dashboard",
      gradient: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400"
    },
    {
      title: "Upload Chatlog",
      description: "Analyze a new customer conversation",
      icon: <FileText className="h-6 w-6" />,
      path: "/evaluate",
      gradient: "from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500"
    },
    {
      title: "Resolution Analysis",
      description: "Review your resolution rates and metrics",
      icon: <CheckCircle className="h-6 w-6" />,
      path: "/resolution",
      gradient: "from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400"
    },
    {
      title: "CPR Metrics",
      description: "Track your coherence, politeness and relevance scores",
      icon: <Gauge className="h-6 w-6" />,
      path: "/cpr-details",
      gradient: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Agent Welcome Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent dark:from-blue-400/10" />
          
          {/* Animated gradient orbs */}
          <div 
            className={`absolute top-20 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 blur-3xl opacity-0 transition-opacity duration-1000 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(-30%, -30%)' }}
          />
          <div 
            className={`absolute bottom-20 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 dark:from-cyan-400/30 dark:to-emerald-400/30 blur-3xl opacity-0 transition-opacity duration-1000 delay-300 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(20%, 20%)' }}
          />
        </div>
        
        <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-700 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Welcome back, {user?.fullName || 'Agent'}
              </h1>
            </div>
            
            <div className={`transform transition-all duration-700 delay-200 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto">
                Track your performance, analyze customer conversations, and improve your service quality.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance Summary */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Performance Overview</CardTitle>
                <CardDescription>Your current performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">Coherence</span>
                      <span className="bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs">+4.2%</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">89%</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">Last 30 days</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-700 dark:text-purple-400 font-medium">Politeness</span>
                      <span className="bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded text-xs">+1.8%</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">92%</div>
                    <div className="text-xs text-purple-600/70 dark:text-purple-500/70 mt-1">Last 30 days</div>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Resolution</span>
                      <span className="bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-xs">+2.5%</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">85%</div>
                    <div className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Last 30 days</div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="text-sm">
                    View Full Dashboard
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index} 
                    className="group overflow-hidden rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 dark:bg-gray-800/50 h-full flex flex-col"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${action.gradient}`}></div>
                    <CardHeader className="pt-5">
                      <div className={`mb-3 p-2 rounded-lg inline-flex bg-gradient-to-r ${action.gradient} text-white`}>
                        {action.icon}
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">{action.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-2">
                      <Button 
                        variant="ghost" 
                        className="text-sm px-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => navigate(action.path)}
                      >
                        <span>Go to {action.title}</span>
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Profile summary */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2.5">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user?.fullName || 'Agent'}</CardTitle>
                    <CardDescription className="text-sm">{user?.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Ranking</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">3rd</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center">
                      <TrendingUp className="h-3 w-3 mr-0.5" /> +2
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-gray-200 dark:border-gray-700"
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card className="border-0 shadow-md dark:bg-gray-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Your latest chatlog evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800/80 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 p-1.5">
                          <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Chatlog Evaluation</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`
                        text-sm font-medium px-2 py-0.5 rounded 
                        ${activity.score >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          activity.score >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
                      `}>
                        {activity.score}/100
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-xs">
                    View All Activity
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

export default AgentHomePage; 
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Star,
  Trophy,
  ChevronUp,
  ChevronDown,
  UserCog,
  Upload,
  PieChart,
  CalendarClock,
  Calendar,
  Search,
  Settings,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatlog } from '@/contexts/ChatlogContext';

// Define trend type
interface MetricTrend {
  trend: 'up' | 'down' | 'neutral';
  percentageDiff: string;
  rawValue: number;
  percentageValue: string;
}

const AgentHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evaluationResults, loadSavedChatLogs, selectedModel } = useChatlog();
  const [animateHero, setAnimateHero] = useState(false);
  const [userStats, setUserStats] = useState({
    coherence: 0,
    politeness: 0,
    relevance: 0,
    resolution: 0,
    overallScore: 0,
    ranking: { position: 1, total: 1, change: 0 }
  });
  
  // Track metric trends
  const [trends, setTrends] = useState<{
    coherence: MetricTrend | null;
    politeness: MetricTrend | null;
    relevance: MetricTrend | null;
    resolution: MetricTrend | null;
    overall: MetricTrend | null;
  }>({
    coherence: null,
    politeness: null,
    relevance: null,
    resolution: null,
    overall: null
  });
  
  // Start animation after component mounts and load data
  useEffect(() => {
    setAnimateHero(true);
    loadSavedChatLogs();
  }, []);

  // Calculate metrics using real data
  useMemo(() => {
    if (evaluationResults && evaluationResults.length > 0) {
      // Filter valid results to avoid NaN
      const validResults = evaluationResults.filter(item =>
        item &&
        typeof item.coherence === 'number' && !isNaN(item.coherence) &&
        typeof item.politeness === 'number' && !isNaN(item.politeness) &&
        typeof item.relevance === 'number' && !isNaN(item.relevance) &&
        typeof item.resolution === 'number' && !isNaN(item.resolution)
      );
      
      if (validResults.length === 0) return;
      
      // Calculate average metrics based on real data
      const sumCoherence = validResults.reduce((sum, item) => sum + item.coherence, 0);
      const sumPoliteness = validResults.reduce((sum, item) => sum + item.politeness, 0);
      const sumRelevance = validResults.reduce((sum, item) => sum + item.relevance, 0);
      
      const avgCoherence = validResults.length > 0 ? sumCoherence / validResults.length : 0;
      const avgPoliteness = validResults.length > 0 ? sumPoliteness / validResults.length : 0;
      const avgRelevance = validResults.length > 0 ? sumRelevance / validResults.length : 0;
      
      const resolvedCount = validResults.filter(item => item.resolution === 1).length;
      const resolutionRate = validResults.length > 0 ? (resolvedCount / validResults.length) * 100 : 0;
      
      // Convert 0-5 scale to percentage (0-100)
      const coherencePercentage = Math.round((avgCoherence / 5) * 100);
      const politenessPercentage = Math.round((avgPoliteness / 5) * 100);
      const relevancePercentage = Math.round((avgRelevance / 5) * 100);
      
      // Calculate weighted average score matching dashboard calculation
      const weightedScore = Math.round(
        (avgCoherence * 0.25) + 
        (avgPoliteness * 0.2) + 
        (avgRelevance * 0.25) + 
        ((resolutionRate / 100) * 5 * 0.3)
      );
      
      // Calculate ranking - In a real app, this would come from an API
      // Since we don't have other agents data, we'll set the position to 1 if score is high
      const rankingPosition = weightedScore >= 4 ? 1 : 2;
      const totalAgents = 5; // Simulated total number of agents
      
      // Calculate trends for each metric based on time
      // Sort evaluations by date (assuming evaluations have datetime field)
      const sortedResults = [...validResults].sort((a, b) => {
        const dateA = (a as any).dateTime ? new Date((a as any).dateTime).getTime() : 0;
        const dateB = (b as any).dateTime ? new Date((b as any).dateTime).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
      
      // Compare recent data with older data
      const midPoint = Math.floor(sortedResults.length / 2);
      
      // Recent evaluations (first half)
      const recentEvals = sortedResults.slice(0, midPoint > 0 ? midPoint : 1);
      // Historical evaluations (second half)
      const historicalEvals = sortedResults.slice(midPoint > 0 ? midPoint : 1);
      
      // Calculate metric averages for trend comparison
      const recentCoherence = recentEvals.reduce((sum, item) => sum + (item.coherence / 5) * 100, 0) / recentEvals.length;
      const historicalCoherence = historicalEvals.length > 0 
        ? historicalEvals.reduce((sum, item) => sum + (item.coherence / 5) * 100, 0) / historicalEvals.length 
        : recentCoherence;
        
      const recentPoliteness = recentEvals.reduce((sum, item) => sum + (item.politeness / 5) * 100, 0) / recentEvals.length;
      const historicalPoliteness = historicalEvals.length > 0 
        ? historicalEvals.reduce((sum, item) => sum + (item.politeness / 5) * 100, 0) / historicalEvals.length 
        : recentPoliteness;
        
      const recentRelevance = recentEvals.reduce((sum, item) => sum + (item.relevance / 5) * 100, 0) / recentEvals.length;
      const historicalRelevance = historicalEvals.length > 0 
        ? historicalEvals.reduce((sum, item) => sum + (item.relevance / 5) * 100, 0) / historicalEvals.length 
        : recentRelevance;
        
      const recentResolution = recentEvals.reduce((sum, item) => sum + item.resolution * 100, 0) / recentEvals.length;
      const historicalResolution = historicalEvals.length > 0 
        ? historicalEvals.reduce((sum, item) => sum + item.resolution * 100, 0) / historicalEvals.length 
        : recentResolution;
      
      // Calculate overall metrics for trend
      const recentOverall = (recentCoherence + recentPoliteness + recentRelevance + recentResolution) / 4;
      const historicalOverall = (historicalCoherence + historicalPoliteness + historicalRelevance + historicalResolution) / 4;
      
      // Create trend objects
      const coherenceTrend: MetricTrend = {
        trend: recentCoherence > historicalCoherence ? 'up' : recentCoherence < historicalCoherence ? 'down' : 'neutral',
        percentageDiff: Math.abs(recentCoherence - historicalCoherence).toFixed(1),
        rawValue: avgCoherence,
        percentageValue: coherencePercentage.toFixed(1)
      };
      
      const politenessTrend: MetricTrend = {
        trend: recentPoliteness > historicalPoliteness ? 'up' : recentPoliteness < historicalPoliteness ? 'down' : 'neutral',
        percentageDiff: Math.abs(recentPoliteness - historicalPoliteness).toFixed(1),
        rawValue: avgPoliteness,
        percentageValue: politenessPercentage.toFixed(1)
      };
      
      const relevanceTrend: MetricTrend = {
        trend: recentRelevance > historicalRelevance ? 'up' : recentRelevance < historicalRelevance ? 'down' : 'neutral',
        percentageDiff: Math.abs(recentRelevance - historicalRelevance).toFixed(1),
        rawValue: avgRelevance,
        percentageValue: relevancePercentage.toFixed(1)
      };
      
      const resolutionTrend: MetricTrend = {
        trend: recentResolution > historicalResolution ? 'up' : recentResolution < historicalResolution ? 'down' : 'neutral',
        percentageDiff: Math.abs(recentResolution - historicalResolution).toFixed(1),
        rawValue: resolutionRate,
        percentageValue: resolutionRate.toFixed(1)
      };
      
      const overallTrend: MetricTrend = {
        trend: recentOverall > historicalOverall ? 'up' : recentOverall < historicalOverall ? 'down' : 'neutral',
        percentageDiff: Math.abs(recentOverall - historicalOverall).toFixed(1),
        rawValue: weightedScore,
        percentageValue: (weightedScore * 20).toFixed(1) // Convert to percentage
      };
      
      // Update state with real data
      setUserStats({
        coherence: coherencePercentage,
        politeness: politenessPercentage,
        relevance: relevancePercentage,
        resolution: resolutionRate,
        overallScore: Math.round(weightedScore * 20), // Convert to percentage (0-100)
        ranking: { 
          position: rankingPosition, 
          total: totalAgents, 
          change: overallTrend.trend === 'up' ? 1 : overallTrend.trend === 'down' ? -1 : 0 
        }
      });
      
      setTrends({
        coherence: coherenceTrend,
        politeness: politenessTrend,
        relevance: relevanceTrend,
        resolution: resolutionTrend,
        overall: overallTrend
      });
    }
  }, [evaluationResults]);
  
  // Updated quick actions
  const quickActions = [
    {
      title: "My Dashboard",
      description: "View your performance metrics and analytics",
      icon: <BarChart2 className="h-5 w-5" />,
      path: "/dashboard",
      color: "text-blue-600 dark:text-blue-500"
    },
    {
      title: "Upload Chatlog",
      description: "Analyze customer conversations with AI",
      icon: <Upload className="h-5 w-5" />,
      path: "/evaluate",
      color: "text-purple-600 dark:text-purple-500"
    },
    {
      title: "Resolution Analysis",
      description: "Review your resolution rates and metrics",
      icon: <CheckCircle className="h-5 w-5" />,
      path: "/resolution",
      color: "text-green-600 dark:text-green-500"
    },
    {
      title: "Weekly Schedule",
      description: "View your upcoming shifts and deadlines",
      icon: <Calendar className="h-5 w-5" />,
      path: "/schedule",
      color: "text-amber-600 dark:text-amber-500"
    }
  ];
  
  // Helper function for trend indicators - dashboard style
  const getTrendBadge = (trend: MetricTrend | null) => {
    if (!trend) return null;
    
    return (
      <div className={`ml-2 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
        trend.trend === 'up' 
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
          : trend.trend === 'down' 
            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
      }`}>
        {trend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
        {trend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
        {trend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
        {trend.percentageDiff}%
      </div>
    );
  };
  
  // Helper function to render stars for rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating / 20); // Convert percentage to 0-5 scale
    const hasHalfStar = rating % 20 >= 10;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-5 w-5 text-amber-500 fill-amber-500" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-5 w-5 text-amber-500" />
            <Star className="absolute top-0 left-0 h-5 w-5 text-amber-500 fill-amber-500 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-5 w-5 text-amber-500" />
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      {/* Header Section with Improved Alignment */}
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white shadow-md">
              <User className="h-6 w-6" />
        </div>
            <div>
              <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">
                Welcome back, {user?.fullName || 'Agent'}
              </h1>
              <p className="mt-1 text-[#667085] dark:text-gray-300">
                Track your performance, analyze customer conversations, and improve your service quality.
              </p>
            </div>
          </div>
          {selectedModel && (
            <div className="mt-2 md:mt-0 md:ml-auto px-4 py-2 bg-[#EEF4FF] dark:bg-blue-900/30 rounded-lg flex items-center">
              <Sparkles className="h-4 w-4 text-[#4582ff] dark:text-blue-400 mr-2" />
              <span className="text-[#4582ff] dark:text-blue-300 font-medium">
                {selectedModel.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Bento Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Performance Overview - Full width on mobile, 8 columns on desktop */}
        <div className="md:col-span-8">
          <Card className="shadow-md border-border/40 overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your current metrics for the last 5 days compared to previous period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Coherence Card */}
                <div className="bg-gradient-to-r from-[#F8E3FF] via-[#FFD1DC] to-[#FFC6D3] dark:bg-gradient-to-r dark:from-pink-900/60 dark:via-pink-800/60 dark:to-rose-900/60 rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Coherence</h3>
                    <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
                      <Gauge className="w-4 h-4 text-[#FF80B5] dark:text-pink-400" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                        {userStats.coherence}%
                      </div>
                      {getTrendBadge(trends.coherence)}
                    </div>
                    <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
                      Score: {trends.coherence ? (trends.coherence.rawValue).toFixed(1) : "0"}/5
                    </div>
                  </div>
                </div>
                
                {/* Politeness Card */}
                <div className="bg-gradient-to-r from-[#D4E7FE] via-[#B6CCFE] to-[#B0E5E9] dark:bg-gradient-to-r dark:from-blue-900/60 dark:via-blue-800/60 dark:to-cyan-900/60 rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Politeness</h3>
                    <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
                      <User className="w-4 h-4 text-[#247BA0] dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                        {userStats.politeness}%
                      </div>
                      {getTrendBadge(trends.politeness)}
                    </div>
                    <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
                      Score: {trends.politeness ? (trends.politeness.rawValue).toFixed(1) : "0"}/5
                    </div>
                  </div>
                </div>
                
                {/* Relevance Card */}
                <div className="bg-gradient-to-r from-[#FFF8C9] via-[#FFEAA0] to-[#FFD166] dark:bg-gradient-to-r dark:from-yellow-800/60 dark:via-amber-800/60 dark:to-amber-900/60 rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Relevance</h3>
                    <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
                      <MessageSquare className="w-4 h-4 text-[#D4A000] dark:text-yellow-400" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                        {userStats.relevance}%
                      </div>
                      {getTrendBadge(trends.relevance)}
                    </div>
                    <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
                      Score: {trends.relevance ? (trends.relevance.rawValue).toFixed(1) : "0"}/5
                    </div>
                  </div>
                </div>
                
                {/* Resolution Card */}
                <div className="bg-gradient-to-r from-[#D1FAE5] via-[#6EE7B7] to-[#34D399] dark:bg-gradient-to-r dark:from-emerald-900/60 dark:via-green-800/60 dark:to-teal-900/60 rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Resolution</h3>
                    <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
                      <CheckCircle className="w-4 h-4 text-[#22c55e] dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                        {userStats.resolution.toFixed(0)}%
                      </div>
                      {getTrendBadge(trends.resolution)}
                    </div>
                    <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
                      {userStats.resolution.toFixed(0)}% resolved
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center sm:justify-end">
                <Button variant="default" size="sm" onClick={() => navigate('/dashboard')}>
                  View Full Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Agent Profile and Team Ranking - Stacked on mobile, side by side on desktop */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Agent Profile */}
          <Card className="shadow-md border-border/40 flex-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle>Agent Profile</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {user?.fullName ? user.fullName.charAt(0) : 'A'}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{user?.fullName || 'Agent'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email || 'agent@example.com'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-accent/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sm">Overall Rating</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold">{userStats.overallScore}%</div>
                    <div>{renderStars(userStats.overallScore)}</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:bg-gradient-to-r dark:from-amber-900/20 dark:to-amber-800/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sm">Team Ranking</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">#{userStats.ranking.position}</div>
                      <div className="text-sm text-muted-foreground">
                        {userStats.ranking.total > 1 
                          ? `out of ${userStats.ranking.total} agents` 
                          : 'No other agents yet'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Comparison with team average */}
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700/50">
                    {userStats.ranking.total > 1 ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Your score:</span>
                          <span className="text-sm font-bold">{userStats.overallScore}%</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Team average:</span>
                          <span className="text-sm font-bold">
                            {/* Calculate team average based on position */}
                            {userStats.ranking.position === 1 
                              ? Math.max(30, Math.min(90, userStats.overallScore - 10)) 
                              : Math.min(95, userStats.overallScore + 10)}%
                          </span>
                        </div>
                        
                        {/* Score difference indicator */}
                        <div className="mt-2 p-2 bg-white/60 dark:bg-amber-900/20 rounded flex items-center justify-between">
                          <span className="text-xs font-medium">Team performance:</span>
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            userStats.ranking.position === 1
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : userStats.ranking.position <= Math.ceil(userStats.ranking.total / 2)
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {userStats.ranking.position === 1 
                              ? 'Top Performer' 
                              : userStats.ranking.position <= Math.ceil(userStats.ranking.total / 2)
                                ? 'Above Average' 
                                : 'Needs Improvement'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-3 text-center text-sm text-amber-700 dark:text-amber-400">
                        <p>You're the first agent in the system!</p>
                        <p className="mt-1 text-xs">More comparative data will appear as other agents join.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions and Training Recommendations - Side by Side on desktop, stacked on mobile */}
        <div className="md:col-span-6">
          <Card className="shadow-md border-border/40">
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used tools and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1 text-blue-800 dark:text-blue-300">My Dashboard</h3>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/80">View your performance metrics and analytics</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/evaluate')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1 text-purple-800 dark:text-purple-300">Upload Chatlog</h3>
                      <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Analyze customer conversations with AI</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/resolution')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1 text-green-800 dark:text-green-300">Resolution Analysis</h3>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80">Review your resolution rates and metrics</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/schedule')}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-white/60 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1 text-amber-800 dark:text-amber-300">Weekly Schedule</h3>
                      <p className="text-sm text-amber-600/80 dark:text-amber-400/80">View your upcoming shifts and deadlines</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Training Recommendations */}
        <div className="md:col-span-6">
          <Card className="shadow-md border-border/40 h-full">
            <CardHeader className="pb-2">
              <CardTitle>Training Recommendations</CardTitle>
              <CardDescription>Based on your recent evaluations [implementation awaits in phase 3]</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userStats.coherence < 80 && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1 text-blue-800 dark:text-blue-300">Communication Clarity</h4>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Improve your coherence score with our communication workshop.</p>
                        <Button variant="link" className="h-auto p-0 text-blue-600 dark:text-blue-400 text-sm">
                          View Workshop
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-blue-300 dark:bg-blue-700"></div>
                  </div>
                )}
                
                {userStats.resolution < 80 && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-lg overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-green-900/40">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1 text-green-800 dark:text-green-300">Resolution Techniques</h4>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80">Learn effective strategies for issue resolution.</p>
                        <Button variant="link" className="h-auto p-0 text-green-600 dark:text-green-400 text-sm">
                          Start Training
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-green-300 dark:bg-green-700"></div>
                  </div>
                )}
                
                {userStats.politeness < 85 && (
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-purple-900/40">
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1 text-purple-800 dark:text-purple-300">Customer Empathy</h4>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Enhance your politeness scores with empathy training.</p>
                        <Button variant="link" className="h-auto p-0 text-purple-600 dark:text-purple-400 text-sm">
                          Access Course
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-purple-300 dark:bg-purple-700"></div>
                  </div>
                )}
                
                {userStats.coherence >= 80 && userStats.resolution >= 80 && userStats.politeness >= 85 && (
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 rounded-lg overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-amber-900/40">
                        <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1 text-amber-800 dark:text-amber-300">Advanced Techniques</h4>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80">You're doing great! Check out our advanced courses.</p>
                        <Button variant="link" className="h-auto p-0 text-amber-600 dark:text-amber-400 text-sm">
                          Explore Advanced Training
                        </Button>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-amber-300 dark:bg-amber-700"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentHomePage; 
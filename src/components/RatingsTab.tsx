import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  MessageSquare, 
  ThumbsUp, 
  Star, 
  CheckCircle, 
  Sparkles, 
  Info as InfoIcon,
  BarChart2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { getUserPerformanceMetrics, PerformanceMetrics } from '../services/performanceService';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from './ui/alert-dialog';

interface RatingsTabProps {
  userId?: string;
}

const RatingsTab: React.FC<RatingsTabProps> = ({ userId }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [noData, setNoData] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      try {
        setLoading(true);
        setNoData(false);
        setAnimated(false); // Reset animation state
        console.log('[RatingsTab] Fetching performance metrics for userId:', userId);
        // Use the real API call now that we have a backend
        const data = await getUserPerformanceMetrics(userId);
        console.log('[RatingsTab] Performance metrics received:', data);
        
        // Check if we have actual data or just zeros
        const hasRealData = 
          data.totalEvaluations > 0 && 
          (data.coherence > 0 || data.politeness > 0 || data.relevance > 0 || data.resolution > 0);
        
        if (hasRealData) {
        setMetrics(data);
          setNoData(false);
          // Add a small delay before animation for better UX
          setTimeout(() => setAnimated(true), 300);
        } else {
          console.log('[RatingsTab] No real data available, showing no data message');
          setNoData(true);
          setMetrics(null);
        }
      } catch (error) {
        console.error('[RatingsTab] Error fetching performance metrics:', error);
        setNoData(true);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceMetrics();
    return () => setAnimated(false);
  }, [userId]);

  if (loading) {
    return <div className="py-8 text-center">Loading performance metrics...</div>;
  }

  if (noData) {
    return (
      <div className="py-8 text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800/30">
        <h3 className="text-lg font-medium text-amber-700 dark:text-amber-400 mb-2">No Performance Data Available</h3>
        <p className="text-amber-600 dark:text-amber-500 mb-4">
          You don't have any evaluated chat logs in the system yet.
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          <p className="mb-2"><strong>To see your performance metrics:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-left">
            <li>Go to the <strong>Chat Evaluation</strong> page</li>
            <li>Upload a CSV file with your chat logs</li>
            <li>Evaluate the chats using the system</li>
          </ol>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No performance data available.</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 dark:text-green-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 1.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-600 dark:bg-green-500';
    if (score >= 3.5) return 'bg-blue-600 dark:bg-blue-500';
    if (score >= 2.5) return 'bg-yellow-600 dark:bg-yellow-500';
    if (score >= 1.5) return 'bg-orange-600 dark:bg-orange-500';
    return 'bg-red-600 dark:bg-red-500';
  };
  
  const getProgressStrokeColor = (score: number) => {
    if (score >= 4.5) return 'stroke-green-600 dark:stroke-green-500';
    if (score >= 3.5) return 'stroke-blue-600 dark:stroke-blue-500';
    if (score >= 2.5) return 'stroke-yellow-600 dark:stroke-yellow-500';
    if (score >= 1.5) return 'stroke-orange-600 dark:stroke-orange-500';
    return 'stroke-red-600 dark:stroke-red-500';
  };
  
  const getMetricColor = (label: string, value: number) => {
    // Special case for Resolution which is on a 0-1 scale
    if (label === "Resolution") {
      if (value >= 0.8) return "bg-green-600";
      if (value >= 0.6) return "bg-blue-600";
      if (value >= 0.4) return "bg-yellow-600";
      if (value >= 0.2) return "bg-orange-600";
      return "bg-red-600";
    }
    
    // Normal metrics on 0-5 scale
    if (value >= 4.5) return "bg-green-600";
    if (value >= 3.5) return "bg-blue-600";
    if (value >= 2.5) return "bg-yellow-600";
    if (value >= 1.5) return "bg-orange-600";
    return "bg-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overall Rating Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg text-[#252A3A] dark:text-blue-300">
              <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-2">
                <Sparkles className="h-4 w-4" />
              </div>
              Overall Rating
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    onClick={() => setInfoDialogOpen(true)}
                  >
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>How this score was calculated</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Based on {metrics.totalEvaluations} evaluations</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 pt-2">
          <div className="flex flex-col items-center">
            {/* Star rating display */}
            <div className={`flex items-center gap-1 mb-4 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-500 ease-out`}>
              {[1, 2, 3, 4, 5].map((starIndex) => {
                // Calculate star fill percentage for fractional stars
                const difference = metrics.averageScore - (starIndex - 1);
                const fillPercentage = difference > 1 ? 100 : Math.max(0, Math.min(1, difference)) * 100;
                const pulseScale = metrics.averageScore > 4 ? 1.15 : 1.05;
                
                return (
                  <div 
                    key={starIndex} 
                    className="relative h-10 w-10 transition-transform hover:scale-110"
                    style={{ 
                      transformOrigin: 'center',
                      transitionDelay: `${starIndex * 100}ms`,
                      animation: animated ? `pulse-${starIndex} 2s ease-in-out ${starIndex * 0.2}s infinite alternate` : 'none'
                    }}
                  >
                    {/* Define keyframes animation in styles for each star */}
                    <style dangerouslySetInnerHTML={{ 
                      __html: `
                        @keyframes pulse-${starIndex} {
                          0% { transform: scale(1); }
                          100% { transform: scale(${pulseScale}); }
                        }
                      `
                    }} />
                    
                    {/* Empty star (background) */}
                    <Star 
                      className="h-10 w-10 absolute inset-0 text-gray-300 dark:text-gray-600"
                    />
                    {/* Filled star (foreground with clip-path) */}
                    {fillPercentage > 0 && (
                      <div 
                        className="h-10 w-10 absolute inset-0 overflow-hidden transition-all duration-1000 ease-out"
                        style={{ 
                          clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                          opacity: animated ? 1 : 0
                        }}
                      >
                        <Star 
                          className="h-10 w-10 text-[#F5A623] fill-[#F5A623] drop-shadow-[0_0_3px_rgba(245,166,35,0.5)]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Score display */}
            <div className={`text-center mb-4 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-500 ease-out delay-500`}>
              <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 px-6 py-2 rounded-full shadow-sm inline-block">
                <div className={`text-4xl font-bold ${getScoreColor(metrics.averageScore)} flex items-baseline`}>
                  {metrics.averageScore.toFixed(1)}
                  <span className="text-sm font-normal ml-1 opacity-70">/ 5.0</span>
                </div>
                <div className="absolute -top-1 -right-1">
                  {metrics.averageScore >= 4 && (
                    <div className="bg-blue-100 dark:bg-blue-800/40 p-1 rounded-full shadow-sm">
                      <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Score interpretation with enhanced styling */}
            <div className={`text-sm font-medium mb-3 px-5 py-1.5 rounded-full shadow-sm transform ${
              metrics.averageScore >= 4 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30' 
                : metrics.averageScore >= 3
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
                  : metrics.averageScore >= 2
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30'
            } ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-500 ease-out delay-700`}>
              <span className="inline-block">
              {metrics.averageScore >= 4 
                ? 'Excellent' 
                : metrics.averageScore >= 3
                  ? 'Good'
                  : metrics.averageScore >= 2
                    ? 'Needs Improvement'
                    : 'Poor Performance'}
              </span>
            </div>
            
            {/* Percentage score with improved styling */}
            <div className={`flex items-center justify-center text-sm text-[#667085] dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-4 py-1.5 rounded-md border border-blue-100/50 dark:border-blue-900/30 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-500 ease-out delay-800`}>
              <BarChart2 className="h-4 w-4 mr-2" />
              <span className="font-medium">{(metrics.averageScore / 5 * 100).toFixed(0)}%</span> performance score
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown Card - Redesigned */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/30 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg text-[#252A3A] dark:text-purple-300">
            <div className="p-2 rounded-full bg-white/60 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mr-2">
              <CheckCircle className="h-4 w-4" />
            </div>
            Performance Breakdown
          </CardTitle>
          <CardDescription>
            Detailed metrics by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Coherence Metric - Redesigned */}
          <div className={`p-4 bg-white/80 dark:bg-gray-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800/30 transform transition-all duration-300 ease-out ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
               style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-3">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-[#252A3A] dark:text-white">Coherence</span>
                  <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                    Logical flow of conversation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  // Calculate star fill percentage for fractional stars
                  const difference = metrics.coherence - (starIndex - 1);
                  const fillPercentage = difference > 1 ? 100 : Math.max(0, Math.min(1, difference)) * 100;
                  
                  return (
                    <div key={starIndex} className="relative h-4 w-4 transition-transform hover:scale-110">
                      {/* Empty star (background) */}
                      <Star 
                        className="h-4 w-4 absolute inset-0 text-gray-300 dark:text-gray-600"
                      />
                      {/* Filled star (foreground with clip-path) */}
                      {fillPercentage > 0 && (
                        <div 
                          className="h-4 w-4 absolute inset-0 overflow-hidden transition-all duration-700 ease-out"
                          style={{ 
                            clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                            opacity: animated ? 1 : 0,
                            transitionDelay: `${starIndex * 100}ms`
                          }}
                        >
                          <Star 
                            className="h-4 w-4 text-[#9F7AEA] fill-[#9F7AEA]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#667085] dark:text-gray-500">Needs Work</div>
                <div className={`text-xs font-medium ${getScoreColor(metrics.coherence)}`}>{metrics.coherence.toFixed(1)}/5.0</div>
                <div className="text-xs text-[#667085] dark:text-gray-500">Excellent</div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200/70 dark:bg-gray-700/50">
                <div 
                  style={{ width: `${metrics.coherence * 20}%` }} 
                  className={`${getProgressColor(metrics.coherence)} h-full rounded-full transition-all duration-1000 ease-out ${animated ? 'opacity-100' : 'opacity-0'} relative`}
                >
                  {/* Add glow effect */}
                  <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-[1px]"></div>
                  {/* Add progress indicator */}
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-purple-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Politeness Metric - Redesigned */}
          <div className={`p-4 bg-white/80 dark:bg-gray-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800/30 transform transition-all duration-300 ease-out ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
               style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-[#252A3A] dark:text-white">Politeness</span>
                  <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                    Tone and courtesy level
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  // Calculate star fill percentage for fractional stars
                  const difference = metrics.politeness - (starIndex - 1);
                  const fillPercentage = difference > 1 ? 100 : Math.max(0, Math.min(1, difference)) * 100;
                  
                  return (
                    <div key={starIndex} className="relative h-4 w-4 transition-transform hover:scale-110">
                      {/* Empty star (background) */}
                      <Star 
                        className="h-4 w-4 absolute inset-0 text-gray-300 dark:text-gray-600"
                      />
                      {/* Filled star (foreground with clip-path) */}
                      {fillPercentage > 0 && (
                        <div 
                          className="h-4 w-4 absolute inset-0 overflow-hidden transition-all duration-700 ease-out"
                          style={{ 
                            clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                            opacity: animated ? 1 : 0,
                            transitionDelay: `${starIndex * 100}ms`
                          }}
                        >
                          <Star 
                            className="h-4 w-4 text-[#3B82F6] fill-[#3B82F6]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#667085] dark:text-gray-500">Needs Work</div>
                <div className={`text-xs font-medium ${getScoreColor(metrics.politeness)}`}>{metrics.politeness.toFixed(1)}/5.0</div>
                <div className="text-xs text-[#667085] dark:text-gray-500">Excellent</div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200/70 dark:bg-gray-700/50">
                <div 
                  style={{ width: `${metrics.politeness * 20}%` }} 
                  className={`${getProgressColor(metrics.politeness)} h-full rounded-full transition-all duration-1000 ease-out ${animated ? 'opacity-100' : 'opacity-0'} relative`}
                >
                  {/* Add glow effect */}
                  <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-[1px]"></div>
                  {/* Add progress indicator */}
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-blue-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Relevance Metric - Redesigned */}
          <div className={`p-4 bg-white/80 dark:bg-gray-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800/30 transform transition-all duration-300 ease-out ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
               style={{ transitionDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-3">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-[#252A3A] dark:text-white">Relevance</span>
                  <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                    Response addresses queries
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  // Calculate star fill percentage for fractional stars
                  const difference = metrics.relevance - (starIndex - 1);
                  const fillPercentage = difference > 1 ? 100 : Math.max(0, Math.min(1, difference)) * 100;
                  
                  return (
                    <div key={starIndex} className="relative h-4 w-4 transition-transform hover:scale-110">
                      {/* Empty star (background) */}
                      <Star 
                        className="h-4 w-4 absolute inset-0 text-gray-300 dark:text-gray-600"
                      />
                      {/* Filled star (foreground with clip-path) */}
                      {fillPercentage > 0 && (
                        <div 
                          className="h-4 w-4 absolute inset-0 overflow-hidden transition-all duration-700 ease-out"
                          style={{ 
                            clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                            opacity: animated ? 1 : 0,
                            transitionDelay: `${starIndex * 100}ms`
                          }}
                        >
                          <Star 
                            className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#667085] dark:text-gray-500">Needs Work</div>
                <div className={`text-xs font-medium ${getScoreColor(metrics.relevance)}`}>{metrics.relevance.toFixed(1)}/5.0</div>
                <div className="text-xs text-[#667085] dark:text-gray-500">Excellent</div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200/70 dark:bg-gray-700/50">
                <div 
                  style={{ width: `${metrics.relevance * 20}%` }} 
                  className={`${getProgressColor(metrics.relevance)} h-full rounded-full transition-all duration-1000 ease-out ${animated ? 'opacity-100' : 'opacity-0'} relative`}
                >
                  {/* Add glow effect */}
                  <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-[1px]"></div>
                  {/* Add progress indicator */}
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-amber-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Metric - Redesigned */}
          <div className={`p-4 bg-white/80 dark:bg-gray-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800/30 transform transition-all duration-300 ease-out ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
               style={{ transitionDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-[#252A3A] dark:text-white">Resolution</span>
                  <p className="text-xs text-[#667085] dark:text-gray-400 mt-0.5">
                    Issues successfully resolved
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                metrics.resolution >= 0.8 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : metrics.resolution >= 0.6
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : metrics.resolution >= 0.4
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {(metrics.resolution * 100).toFixed(0)}%
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#667085] dark:text-gray-500">Low</div>
                <div className="text-xs text-[#667085] dark:text-gray-500">Medium</div>
                <div className="text-xs text-[#667085] dark:text-gray-500">High</div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200/70 dark:bg-gray-700/50">
                <div 
                  style={{ width: `${metrics.resolution * 100}%` }} 
                  className={`${getProgressColor(metrics.resolution * 5)} h-full rounded-full transition-all duration-1000 ease-out ${animated ? 'opacity-100' : 'opacity-0'} relative`}
                >
                  {/* Add glow effect */}
                  <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-[1px]"></div>
                  {/* Add progress indicator */}
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <AlertDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-0 dark:border-gray-700 rounded-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#252A3A] dark:text-white flex items-center">
              <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              How Scores Are Calculated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#667085] dark:text-gray-400">
              <div className="space-y-3 text-left mt-2">
                <p className="text-sm">The overall score is a weighted average of the individual metrics:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li><span className="font-medium">Coherence (25%)</span>: How well the agent's responses flow logically</li>
                  <li><span className="font-medium">Politeness (20%)</span>: The tone and courtesy level of responses</li>
                  <li><span className="font-medium">Relevance (25%)</span>: If responses directly address the customer's questions</li>
                  <li><span className="font-medium">Resolution (30%)</span>: Whether the customer's issue was successfully resolved</li>
                </ul>
                <p className="text-sm">All metrics except Resolution are scored on a scale of 0-5. Resolution is measured as a success rate (0-100%).</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800">Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RatingsTab; 
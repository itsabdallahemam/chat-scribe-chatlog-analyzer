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

  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      try {
        setLoading(true);
        // Use the real API call now that we have a backend
        const data = await getUserPerformanceMetrics(userId);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
        // Fallback to mock data if API call fails
        const mockData = {
          coherence: 3.0,
          politeness: 2.7,
          relevance: 2.5,
          resolution: 0.2,
          averageScore: 1.9,
          totalEvaluations: 20
        };
        setMetrics(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceMetrics();
  }, [userId]);

  if (loading) {
    return <div className="py-8 text-center">Loading performance metrics...</div>;
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
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-600 dark:bg-green-500';
    if (score >= 3.5) return 'bg-blue-600 dark:bg-blue-500';
    if (score >= 2.5) return 'bg-yellow-600 dark:bg-yellow-500';
    return 'bg-red-600 dark:bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overall Rating Card */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Sparkles className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Overall Rating
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => setInfoDialogOpen(true)}
                  >
                    <InfoIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
        <CardContent className="pb-4">
          <div className="flex flex-col items-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.averageScore)}`}>
              {metrics.averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              out of 5.0
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`${getProgressColor(metrics.averageScore)} h-2 rounded-full`} 
                style={{ width: `${metrics.averageScore * 20}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown Card */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Metrics Breakdown</CardTitle>
          <CardDescription>Individual performance categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MetricItem 
              label="Coherence" 
              value={metrics.coherence} 
              icon={<MessageSquare className="h-4 w-4" />} 
              color="bg-yellow-500"
            />
            <MetricItem 
              label="Politeness" 
              value={metrics.politeness} 
              icon={<ThumbsUp className="h-4 w-4" />} 
              color="bg-yellow-500"
            />
            <MetricItem 
              label="Relevance" 
              value={metrics.relevance} 
              icon={<Star className="h-4 w-4" />} 
              color="bg-red-500"
            />
            <MetricItem 
              label="Resolution" 
              value={metrics.resolution} 
              icon={<CheckCircle className="h-4 w-4" />} 
              color="bg-red-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Explanation Dialog */}
      <AlertDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>How Ratings Are Calculated</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-4 py-2">
                <p>Your overall score is a weighted average of four key metrics:</p>
                
                <div className="space-y-2 pl-4">
                  <div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                      Coherence (25%)
                    </Badge>
                    <p className="text-sm mt-1">Measures how logical and consistent your responses are.</p>
                  </div>
                  
                  <div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                      Politeness (20%)
                    </Badge>
                    <p className="text-sm mt-1">Evaluates your professional courtesy and tone.</p>
                  </div>
                  
                  <div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                      Relevance (25%)
                    </Badge>
                    <p className="text-sm mt-1">Assesses how well you address the specific customer needs.</p>
                  </div>
                  
                  <div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                      Resolution (30%)
                    </Badge>
                    <p className="text-sm mt-1">Measures how effectively you resolve customer issues.</p>
                  </div>
                </div>
                
                <p className="pt-2">
                  The formula is: (Coherence × 0.25) + (Politeness × 0.20) + (Relevance × 0.25) + (Resolution × 0.30)
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md text-sm">
                  <p>Your scores are based on {metrics.totalEvaluations} chat evaluations completed in the past 30 days.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInfoDialogOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Individual metric component
interface MetricItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, icon, color }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <div className="mr-2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
          <span className="font-medium">{label}</span>
        </div>
        <div className="font-bold text-gray-900 dark:text-white">{value.toFixed(1)}</div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
        <div 
          className={`${color} h-2 rounded-full`} 
          style={{ width: `${value * 20}%` }}
        />
      </div>
    </div>
  );
};

export default RatingsTab; 
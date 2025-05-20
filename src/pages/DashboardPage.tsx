import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gauge, Smile, MessageCircle, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles, BarChart2, FileText, Calendar, Clock, Sun, Sunset, Moon, TrendingUp, TrendingDown, Tag, Filter, Search, X, ArrowUpDown, Star } from 'lucide-react';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import ChatBubbleView from '@/components/ChatBubbleView';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Select } from '@/components/ui/select';
import KeywordAnalysisSection from '@/components/KeywordAnalysisSection';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

import { formatDate } from '../utils/dateUtils';

// Define a type for the data used in score distribution charts
interface ScoreDistributionData {
  name: string; // Score value (e.g., "1", "2", "3", "4", "5")
  count: number;
}

interface EvaluationResultItem {
  id?: number;
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  originalIndex?: number;
  shift?: string;
  dateTime?: string;
  timestamp?: Date;
}

// ScoreCard component for dashboard metrics
const ScoreCard = ({
  title,
  value,
  subtitle,
  gradient,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
}) => (
  <div
    className={`relative rounded-2xl shadow-xl p-6 min-w-[180px] min-h-[180px] flex flex-col justify-between ${gradient} dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:shadow-2xl`}
  >
    <div className="flex justify-between items-start">
      <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{title}</div>
      <div className="bg-white/60 dark:bg-gray-700/80 rounded-full p-2 shadow absolute top-4 right-4">
        {icon}
      </div>
    </div>
    <div className="mt-8">
      <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{value}</div>
      <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{subtitle}</div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { evaluationResults, selectedModel, deleteChatLogById } = useChatlog();
  const [expandedChatlogIndex, setExpandedChatlogIndex] = useState<number | null>(null);
  const [coherenceFilter, setCoherenceFilter] = useState<string>('');
  const [politenessFilter, setPolitenessFilter] = useState<string>('');
  const [relevanceFilter, setRelevanceFilter] = useState<string>('');
  const [resolutionFilter, setResolutionFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('dateTime-desc');
  
  // Add pagination state
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(0);

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#f5f7fa] dark:bg-[#161925]">
        <div className="max-w-md text-center">
          <h3 className="text-xl font-medium mb-4 text-[#252A3A] dark:text-white">No Evaluation Results</h3>
          <p className="text-[#667085] dark:text-gray-400 mb-6">
            Please upload or paste chatlogs on the home page to see evaluation results.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-[#4582ff] hover:bg-[#4582ff]/90 text-white"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  // --- Calculate Metrics (keep as is) ---
  const totalLogs = evaluationResults.length;
  const validResults = evaluationResults
    .map((item, index) => ({
      ...item,
      originalIndex: index // Add originalIndex to each item
    }))
    .filter(item =>
      item &&
      typeof item.coherence === 'number' && !isNaN(item.coherence) &&
      typeof item.politeness === 'number' && !isNaN(item.politeness) &&
      typeof item.relevance === 'number' && !isNaN(item.relevance) &&
      typeof item.resolution === 'number' && !isNaN(item.resolution)
    );

  if (validResults.length === 0 && totalLogs > 0) {
    console.warn("DashboardPage: All evaluation results have invalid/NaN scores for metric calculations.");
  }
  
  const sumCoherence = validResults.reduce((sum, item) => sum + item.coherence, 0);
  const sumPoliteness = validResults.reduce((sum, item) => sum + item.politeness, 0);
  const sumRelevance = validResults.reduce((sum, item) => sum + item.relevance, 0);
  
  const avgCoherence = validResults.length > 0 ? sumCoherence / validResults.length : NaN;
  const avgPoliteness = validResults.length > 0 ? sumPoliteness / validResults.length : NaN;
  const avgRelevance = validResults.length > 0 ? sumRelevance / validResults.length : NaN;

  const resolvedCount = validResults.filter(item => item.resolution === 1).length;
  const unresolvedCount = validResults.length - resolvedCount;
  const resolutionRate = validResults.length > 0 ? (resolvedCount / validResults.length) * 100 : 0;

  // Calculate weighted average score (matching RatingsTab calculation method)
  const averageScore = validResults.length > 0 
    ? (avgCoherence * 0.25) + (avgPoliteness * 0.2) + (avgRelevance * 0.25) + ((resolutionRate / 100) * 5 * 0.3)
    : NaN;

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 dark:text-green-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 1.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get progress indicator gradient colors based on score
  const getScoreGradient = (score: number) => {
    if (score >= 4) return {
      from: '#22c55e', // Green
      to: '#16a34a'
    };
    if (score >= 3) return {
      from: '#0A2463', // App-blue
      to: '#247BA0'    // App-blue-light
    };
    if (score >= 2) return {
      from: '#eab308', // Yellow
      to: '#ca8a04'
    };
    return {
      from: '#ef4444', // Red
      to: '#dc2626'
    };
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Needs Improvement';
    return 'Poor Performance';
  };

  // Get score badge style
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 4) 
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30';
    if (score >= 3)
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30';
    if (score >= 2)
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30';
  };

  // --- Prepare data for score distribution charts (keep as is) ---
  const getScoreDistribution = (metric: keyof typeof evaluationResults[0]): ScoreDistributionData[] => {
    const counts: { [key: string]: number } = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    validResults.forEach(item => {
      const scoreValue = item[metric];
      if (typeof scoreValue === 'number' && !isNaN(scoreValue) && scoreValue >= 1 && scoreValue <= 5) {
        const roundedScore = String(Math.round(scoreValue));
        counts[roundedScore] = (counts[roundedScore] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  };

  const coherenceDistribution = getScoreDistribution('coherence');
  const politenessDistribution = getScoreDistribution('politeness');
  const relevanceDistribution = getScoreDistribution('relevance');

  // --- Colors for charts ---
  const COHERENCE_COLOR = "#FF80B5"; // Pink for coherence
  const POLITENESS_COLOR = "#247BA0"; // Blue for politeness
  const RELEVANCE_COLOR = "#FFD166"; // Yellow for relevance
  const RESOLUTION_COLOR = "#22c55e"; // Green for resolution

  const handleToggleChatlogView = (index: number) => {
    setExpandedChatlogIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleDeleteChatLog = async (id: number) => {
    try {
      await deleteChatLogById(id);
      toast({
        title: "Chat Log Deleted",
        description: "The chat log has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the chat log.",
        variant: "destructive",
      });
    }
  };

  // Update columns type to match DataTable's expected type
  type DashboardTableRow = EvaluationResultItem & { expandedContent?: React.ReactNode };
  const columns: ColumnDef<DashboardTableRow>[] = [
    {
      accessorKey: 'scenario',
      header: 'Scenario',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium text-[#252A3A] dark:text-white">
          {row.original.scenario ? 
            row.original.scenario.length > 25 
              ? `${row.original.scenario.substring(0, 25)}...` 
              : row.original.scenario 
            : "Unnamed Scenario"}
        </div>
      ),
    },
    {
      accessorKey: 'shift',
      header: 'Shift',
      cell: ({ row }) => (
        row.original.shift ? (
          <div className="inline-flex items-center justify-center font-medium px-2.5 py-0.5 rounded-full text-xs bg-[#EEF4FF] text-[#4582ff] dark:bg-blue-900/30 dark:text-blue-300">
            {row.original.shift}
          </div>
        ) : <span className="text-gray-400 dark:text-gray-600">-</span>
      ),
    },
    {
      accessorKey: 'dateTime',
      header: 'Date & Time',
      cell: ({ row }) => {
        if (!row.original.dateTime) return <span className="text-gray-400 dark:text-gray-600">-</span>;
        
        return (
          <div className="text-sm text-[#252A3A] dark:text-gray-200">
            {formatDate(row.original.dateTime, 'DATE_ONLY')}<br />
            <span className="text-xs text-[#667085] dark:text-gray-400">
              {formatDate(row.original.dateTime, 'TIME_ONLY')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'coherence',
      header: 'Coherence',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
          row.original.coherence <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
          row.original.coherence === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
          'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
        }`}>
          {row.original.coherence.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'politeness',
      header: 'Politeness',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
          row.original.politeness <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
          row.original.politeness === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
          'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
        }`}>
          {row.original.politeness.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'relevance',
      header: 'Relevance',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
          row.original.relevance <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
          row.original.relevance === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
          'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
        }`}>
          {row.original.relevance.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'resolution',
      header: 'Resolution',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[4.5rem] font-medium px-2.5 py-1 rounded-md text-sm ${
          row.original.resolution === 1 ? 'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-800/70 dark:text-emerald-200' : 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-800/70 dark:text-rose-200'
        }`}>
          {row.original.resolution === 1 ? 'Resolved' : 'Unresolved'}
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleChatlogView(row.original.originalIndex as number)}
            className="border-[#4582ff] text-[#4582ff] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg"
          >
            {expandedChatlogIndex === row.original.originalIndex ? 'Hide' : 'View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteChatLog(row.original.id as number)}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium dark:bg-red-800/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-700/30 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // Calculate scenario-based metrics
  const scenarioMetrics = useMemo(() => {
    const scenarios = [...new Set(validResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = validResults.filter(item => item.scenario === scenario);
      const resolvedInScenario = scenarioLogs.filter(item => item.resolution === 1).length;
      const resolutionRate = scenarioLogs.length > 0 ? (resolvedInScenario / scenarioLogs.length) * 100 : 0;
      
      const avgCoherence = scenarioLogs.reduce((sum, item) => sum + item.coherence, 0) / scenarioLogs.length;
      const avgPoliteness = scenarioLogs.reduce((sum, item) => sum + item.politeness, 0) / scenarioLogs.length;
      const avgRelevance = scenarioLogs.reduce((sum, item) => sum + item.relevance, 0) / scenarioLogs.length;

      return {
        name: scenario,
        resolutionRate,
        avgCoherence,
        avgPoliteness,
        avgRelevance,
        count: scenarioLogs.length
      };
    });
  }, [validResults]);

  // Calculate shift-based metrics
  const shiftMetrics = useMemo(() => {
    // Get all shifts (filtering out undefined) and make a set of unique values
    const shifts = validResults
      .map(item => (item as EvaluationResultItem).shift)
      .filter(shift => shift !== undefined) as string[];
    
    // If no shifts data exists, return empty array
    if (shifts.length === 0) return [];

    const uniqueShifts = [...new Set(shifts)];
    
    return uniqueShifts.map(shift => {
      const shiftLogs = validResults.filter(item => (item as EvaluationResultItem).shift === shift);
      const resolvedInShift = shiftLogs.filter(item => item.resolution === 1).length;
      const resolutionRate = shiftLogs.length > 0 ? (resolvedInShift / shiftLogs.length) * 100 : 0;
      
      const avgCoherence = shiftLogs.reduce((sum, item) => sum + item.coherence, 0) / shiftLogs.length;
      const avgPoliteness = shiftLogs.reduce((sum, item) => sum + item.politeness, 0) / shiftLogs.length;
      const avgRelevance = shiftLogs.reduce((sum, item) => sum + item.relevance, 0) / shiftLogs.length;

      // Calculate weighted average score for this shift
      const weightedScore = (avgCoherence * 0.25) + (avgPoliteness * 0.2) + (avgRelevance * 0.25) + ((resolutionRate / 100) * 5 * 0.3);

      // Add icon based on shift name
      let icon = <Clock className="h-5 w-5 text-[#667085]" />;
      if (shift && shift.toLowerCase().includes('morning')) {
        icon = <Sun className="h-5 w-5 text-amber-500" />;
      } else if (shift && shift.toLowerCase().includes('afternoon')) {
        icon = <Sunset className="h-5 w-5 text-orange-500" />;
      } else if (shift && shift.toLowerCase().includes('evening')) {
        icon = <Sunset className="h-5 w-5 text-pink-500" />;
      } else if (shift && shift.toLowerCase().includes('night')) {
        icon = <Moon className="h-5 w-5 text-indigo-500" />;
      }

      return {
        name: shift,
        resolutionRate,
        avgCoherence,
        avgPoliteness,
        avgRelevance,
        count: shiftLogs.length,
        averageScore: weightedScore,
        icon
      };
    });
  }, [validResults]);

  // Calculate date-based metrics
  const getDateFromDateTime = (dateTime?: string) => {
    if (!dateTime) return null;
    return dateTime.split(' ')[0]; // Extract date part from "YYYY-MM-DD HH:MM"
  };

  // Helper to get week number from date
  const getWeekNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Format week label
  const formatWeekLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekNum = getWeekNumber(dateStr);
    return `Week ${weekNum}, ${date.getFullYear()}`;
  };

  const dateMetrics = useMemo(() => {
    // Get all dates (filtering out undefined) and make a set of unique values
    const dates = validResults
      .map(item => getDateFromDateTime((item as EvaluationResultItem).dateTime))
      .filter(date => date !== null) as string[];
    
    // If no date data exists, return empty array
    if (dates.length === 0) return [];

    const uniqueDates = [...new Set(dates)];
    
    // Check if we have too many dates (more than 14)
    const shouldGroupByWeek = uniqueDates.length > 14;
    
    if (shouldGroupByWeek) {
      // Group by week
      const weekData: { [key: string]: { 
        dates: string[], 
        logs: typeof validResults,
        firstDate: string 
      }} = {};
      
      // First, group all logs by week
      uniqueDates.forEach(date => {
        const weekLabel = formatWeekLabel(date);
        if (!weekData[weekLabel]) {
          weekData[weekLabel] = {
            dates: [],
            logs: [],
            firstDate: date
          };
        }
        
        weekData[weekLabel].dates.push(date);
        
        // Get logs for this date and add to week
        const dateLogs = validResults.filter(item => 
          getDateFromDateTime((item as EvaluationResultItem).dateTime) === date
        );
        weekData[weekLabel].logs.push(...dateLogs);
      });
      
      // Convert the grouped data to our metrics format
      return Object.entries(weekData)
        .map(([weekLabel, data]) => {
          const { logs } = data;
          const resolvedInWeek = logs.filter(item => item.resolution === 1).length;
          const resolutionRate = logs.length > 0 ? (resolvedInWeek / logs.length) * 100 : 0;
          
          const avgCoherence = logs.reduce((sum, item) => sum + item.coherence, 0) / logs.length;
          const avgPoliteness = logs.reduce((sum, item) => sum + item.politeness, 0) / logs.length;
          const avgRelevance = logs.reduce((sum, item) => sum + item.relevance, 0) / logs.length;

          return {
            date: weekLabel,
            rawDate: data.firstDate, // Keep the original date for sorting
            resolutionRate,
            avgCoherence,
            avgPoliteness,
            avgRelevance,
            count: logs.length
          };
        })
        .sort((a, b) => a.rawDate.localeCompare(b.rawDate)); // Sort by first date in each week
    } else {
      // Use daily data as before
      return uniqueDates.map(date => {
        const dateLogs = validResults.filter(item => getDateFromDateTime((item as EvaluationResultItem).dateTime) === date);
        const resolvedOnDate = dateLogs.filter(item => item.resolution === 1).length;
        const resolutionRate = dateLogs.length > 0 ? (resolvedOnDate / dateLogs.length) * 100 : 0;
        
        const avgCoherence = dateLogs.reduce((sum, item) => sum + item.coherence, 0) / dateLogs.length;
        const avgPoliteness = dateLogs.reduce((sum, item) => sum + item.politeness, 0) / dateLogs.length;
        const avgRelevance = dateLogs.reduce((sum, item) => sum + item.relevance, 0) / dateLogs.length;

        return {
          date,
          rawDate: date, // Keep consistent with weekly data structure
          resolutionRate,
          avgCoherence,
          avgPoliteness,
          avgRelevance,
          count: dateLogs.length
        };
      }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
    }
  }, [validResults]);

  // Get filtered data based on selected filters
  const filteredData = useMemo(() => {
    // First filter the data
    const filtered = validResults.filter(item =>
      (!coherenceFilter || Math.round(item.coherence) === Number(coherenceFilter)) &&
      (!politenessFilter || Math.round(item.politeness) === Number(politenessFilter)) &&
      (!relevanceFilter || Math.round(item.relevance) === Number(relevanceFilter)) &&
      (!resolutionFilter || String(item.resolution) === resolutionFilter)
    );
    
    // Then sort the data based on the selected sort option
    if (sortOption) {
      const [field, direction] = sortOption.split('-');
      return [...filtered].sort((a, b) => {
        // Handle different field types
        if (field === 'dateTime') {
          const dateA = (a as EvaluationResultItem).dateTime ? new Date((a as EvaluationResultItem).dateTime).getTime() : 0;
          const dateB = (b as EvaluationResultItem).dateTime ? new Date((b as EvaluationResultItem).dateTime).getTime() : 0;
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          // For numeric fields (coherence, politeness, relevance, resolution)
          const valA = a[field as keyof typeof a] as number;
          const valB = b[field as keyof typeof b] as number;
          return direction === 'asc' ? valA - valB : valB - valA;
        }
      });
    }
    
    return filtered;
  }, [validResults, coherenceFilter, politenessFilter, relevanceFilter, resolutionFilter, sortOption]);

  // Calculate pagination details
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [coherenceFilter, politenessFilter, relevanceFilter, resolutionFilter]);

  // Calculate metric trends compared to 5 days ago
  const calculateTrend = (metric: 'coherence' | 'politeness' | 'relevance' | 'resolution') => {
    // If no date data, return null (no trend)
    if (!dateMetrics || dateMetrics.length === 0) return null;
    
    // Sort dates in ascending order
    const sortedDates = [...dateMetrics].sort((a, b) => 
      new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    );
    
    // Get the most recent date data
    const mostRecent = sortedDates[sortedDates.length - 1];
    
    // Find data from 5 days ago
    const fiveDaysAgo = new Date(mostRecent.rawDate);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    // Find the closest date to 5 days ago
    let historicalData = null;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const date = new Date(sortedDates[i].rawDate);
      if (date <= fiveDaysAgo) {
        historicalData = sortedDates[i];
        break;
      }
    }
    
    // If no historical data found, return null
    if (!historicalData) return null;
    
    // Calculate the trend
    let currentValue: number, historicalValue: number;
    
    switch(metric) {
      case 'resolution':
        // Resolution is already a percentage
        currentValue = mostRecent.resolutionRate;
        historicalValue = historicalData.resolutionRate;
        break;
      case 'coherence':
        // Convert scores to percentages
        currentValue = (mostRecent.avgCoherence / 5) * 100;
        historicalValue = (historicalData.avgCoherence / 5) * 100;
        break;
      case 'politeness':
        // Convert scores to percentages
        currentValue = (mostRecent.avgPoliteness / 5) * 100;
        historicalValue = (historicalData.avgPoliteness / 5) * 100;
        break;
      case 'relevance':
        // Convert scores to percentages
        currentValue = (mostRecent.avgRelevance / 5) * 100;
        historicalValue = (historicalData.avgRelevance / 5) * 100;
        break;
    }
    
    // Calculate percentage point difference (current - historical)
    const percentageDiff = currentValue - historicalValue;
    
    return {
      trend: percentageDiff > 0 ? 'up' : percentageDiff < 0 ? 'down' : 'neutral',
      percentageDiff: Math.abs(percentageDiff).toFixed(1),
      rawValue: metric === 'resolution' ? currentValue : mostRecent[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof typeof mostRecent] as number,
      percentageValue: currentValue.toFixed(1) // Always a percentage
    };
  };
  
  // Calculate trends for all metrics
  const coherenceTrend = calculateTrend('coherence');
  const politenessTrend = calculateTrend('politeness');
  const relevanceTrend = calculateTrend('relevance');
  const resolutionTrend = calculateTrend('resolution');

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[#4582ff] rounded-full text-white shadow-md">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">Dashboard</h1>
              <p className="mt-1 text-[#667085] dark:text-gray-300">Analyzing {totalLogs} chatlogs</p>
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
      
      {/* Stats Cards - Full Width Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-7xl mx-auto">
        {/* Coherence Card */}
        <div className="bg-gradient-to-r from-[#F8E3FF] via-[#FFD1DC] to-[#FFC6D3] dark:bg-gradient-to-r dark:from-pink-900/60 dark:via-pink-800/60 dark:to-rose-900/60 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Coherence</h3>
            <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
              <Gauge className="w-5 h-5 text-[#FF80B5] dark:text-pink-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                {isNaN(avgCoherence) ? 'N/A' : `${Math.round((avgCoherence / 5) * 100)}%`}
              </div>
              {coherenceTrend && (
                <div className={`ml-2 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                  coherenceTrend.trend === 'up' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
                    : coherenceTrend.trend === 'down' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
                }`}>
                    {coherenceTrend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {coherenceTrend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {coherenceTrend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {coherenceTrend.percentageDiff}%
                  </div>
                )}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Score: {isNaN(avgCoherence) ? 'N/A' : avgCoherence.toFixed(1)}/5
            </div>
          </div>
        </div>
        
        {/* Politeness Card */}
        <div className="bg-gradient-to-r from-[#D4E7FE] via-[#B6CCFE] to-[#B0E5E9] dark:bg-gradient-to-r dark:from-blue-900/60 dark:via-blue-800/60 dark:to-cyan-900/60 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Politeness</h3>
            <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
              <Smile className="w-5 h-5 text-[#247BA0] dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                {isNaN(avgPoliteness) ? 'N/A' : `${Math.round((avgPoliteness / 5) * 100)}%`}
              </div>
              {politenessTrend && (
                <div className={`ml-2 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                  politenessTrend.trend === 'up' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
                    : politenessTrend.trend === 'down' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
                  }`}>
                    {politenessTrend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {politenessTrend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {politenessTrend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {politenessTrend.percentageDiff}%
                  </div>
                )}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Score: {isNaN(avgPoliteness) ? 'N/A' : avgPoliteness.toFixed(1)}/5
            </div>
          </div>
        </div>
        
        {/* Relevance Card */}
        <div className="bg-gradient-to-r from-[#FFF8C9] via-[#FFEAA0] to-[#FFD166] dark:bg-gradient-to-r dark:from-yellow-800/60 dark:via-amber-800/60 dark:to-amber-900/60 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Relevance</h3>
            <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
              <MessageCircle className="w-5 h-5 text-[#D4A000] dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                {isNaN(avgRelevance) ? 'N/A' : `${Math.round((avgRelevance / 5) * 100)}%`}
              </div>
              {relevanceTrend && (
                <div className={`ml-2 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                  relevanceTrend.trend === 'up' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
                    : relevanceTrend.trend === 'down' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
                  }`}>
                    {relevanceTrend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {relevanceTrend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {relevanceTrend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {relevanceTrend.percentageDiff}%
                  </div>
                )}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Score: {isNaN(avgRelevance) ? 'N/A' : avgRelevance.toFixed(1)}/5
            </div>
          </div>
        </div>
        
        {/* Resolution Card */}
        <div className="bg-gradient-to-r from-[#D1FAE5] via-[#6EE7B7] to-[#34D399] dark:bg-gradient-to-r dark:from-emerald-900/60 dark:via-green-800/60 dark:to-teal-900/60 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Resolution</h3>
            <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
              <CheckCircle className="w-5 h-5 text-[#22c55e] dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
                {isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`}
              </div>
              {resolutionTrend && (
                <div className={`ml-2 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                  resolutionTrend.trend === 'up' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
                    : resolutionTrend.trend === 'down' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
                  }`}>
                    {resolutionTrend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {resolutionTrend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {resolutionTrend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                    {resolutionTrend.percentageDiff}%
                  </div>
                )}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              {resolvedCount} of {validResults.length} resolved
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Overall Rating Card - Star-based design */}
        <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 flex flex-col h-full lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">
              Overall Rating
            </h3>
            <div className="p-2 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
              <Sparkles className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
            </div>
          </div>
          <div className="text-sm text-[#667085] dark:text-gray-400 mb-5">
            Based on {validResults.length} evaluations
          </div>
          
          <div className="flex flex-col items-center">
            {/* Large Score Display */}
            <div className={`text-5xl font-bold mb-4 ${getScoreColor(averageScore)}`}>
              {isNaN(averageScore) ? 'N/A' : averageScore.toFixed(1)}
            </div>
            
            {/* Star Rating */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="relative">
                  {/* Background star (empty) */}
                  <Star
                    className="h-8 w-8 text-gray-200 dark:text-gray-700"
                  />
                  
                  {/* Full stars */}
                  {!isNaN(averageScore) && Math.floor(averageScore) >= star && (
                    <Star
                      className="h-8 w-8 absolute top-0 left-0 text-[#FFD166] fill-[#FFD166]"
                    />
                  )}
                  
                  {/* Half stars */}
                  {!isNaN(averageScore) && 
                    Math.floor(averageScore) < star && 
                    Math.ceil(averageScore) >= star && (
                    <div className="absolute top-0 left-0 h-8 w-4 overflow-hidden">
                      <Star
                        className="h-8 w-8 text-[#FFD166] fill-[#FFD166]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Score label */}
            <div className={`text-sm font-medium mb-3 px-4 py-1.5 rounded-full ${getScoreBadgeStyle(averageScore)}`}>
              {isNaN(averageScore) ? 'No Data' : getScoreLabel(averageScore)}
            </div>
            
            {/* Score details */}
            <div className="w-full space-y-3 mt-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <span className="text-sm text-[#667085] dark:text-gray-400">Coherence</span>
                <span className="text-sm font-medium text-[#252A3A] dark:text-white">{isNaN(avgCoherence) ? 'N/A' : avgCoherence.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <span className="text-sm text-[#667085] dark:text-gray-400">Politeness</span>
                <span className="text-sm font-medium text-[#252A3A] dark:text-white">{isNaN(avgPoliteness) ? 'N/A' : avgPoliteness.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <span className="text-sm text-[#667085] dark:text-gray-400">Relevance</span>
                <span className="text-sm font-medium text-[#252A3A] dark:text-white">{isNaN(avgRelevance) ? 'N/A' : avgRelevance.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                <span className="text-sm text-[#667085] dark:text-gray-400">Resolution</span>
                <span className="text-sm font-medium text-[#252A3A] dark:text-white">{isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resolution Overview Card - Redesigned */}
        <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 flex flex-col h-full lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Resolution Overview</h3>
            <div className="p-2 rounded-full bg-[#ECFDF3] dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-[#22c55e] dark:text-green-400" />
            </div>
          </div>
          <div className="text-sm text-[#667085] dark:text-gray-400 mb-5">
            Percentage of successfully resolved chatlogs
          </div>
          
          <div className="flex flex-col items-center mt-2">
            {/* Visual percentage circle */}
            <div className="relative w-36 h-36 mb-6">
              {/* Background circle */}
              <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-700"></div>
              
              {/* Progress circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="resolutionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
                <circle 
                  cx="50%" 
                  cy="50%" 
                  r="45%" 
                  fill="none" 
                  stroke="url(#resolutionGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 90 * (resolutionRate / 100)}, ${Math.PI * 90}`}
                  className="drop-shadow-sm"
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-[15%] bg-white dark:bg-[#232534] rounded-full flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#22c55e] dark:text-green-400">
                    {isNaN(resolutionRate) ? 'N/A' : `${Math.round(resolutionRate)}%`}
                  </div>
                  <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
                    resolved
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Comparison */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Resolved count */}
              <div className="bg-[#ECFDF3] dark:bg-green-900/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#22c55e] dark:text-green-400">{resolvedCount}</div>
                <div className="text-xs text-[#15803d] dark:text-green-300">Resolved</div>
              </div>
              
              {/* Unresolved count */}
              <div className="bg-[#FFECEB] dark:bg-rose-900/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#FF80B5] dark:text-rose-400">{unresolvedCount}</div>
                <div className="text-xs text-[#e11d48] dark:text-rose-300">Unresolved</div>
              </div>
            </div>
            
            {/* Trend Indicator */}
            {resolutionTrend && (
              <div className="w-full mt-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg flex items-center justify-between">
                <span className="text-sm text-[#667085] dark:text-gray-400">Compared to 5 days ago:</span>
                <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                  resolutionTrend.trend === 'up' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/40' 
                    : resolutionTrend.trend === 'down' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/40'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40'
                }`}>
                  {resolutionTrend.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                  {resolutionTrend.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                  {resolutionTrend.trend === 'neutral' && <ArrowUpDown className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
                  {resolutionTrend.percentageDiff}%
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Shift Performance Analysis - Adjacent to key metrics */}
        {shiftMetrics.length > 0 && (
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 flex flex-col h-full lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Shift Analysis</h3>
                <div className="text-sm text-[#667085] dark:text-gray-400">
                  Performance by shift
                </div>
              </div>
              <div className="p-2 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
                <BarChart2 className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 flex-1 overflow-y-auto max-h-[350px]">
              {shiftMetrics.map((shift, index) => (
                <div key={index} className="mb-5 last:mb-0">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-[#252A3A] dark:text-white flex items-center">
                      {shift.icon}
                      <span className="ml-1.5">{shift.name}</span>
                    </h3>
                    <div className="text-xs bg-[#EEF4FF] text-[#4582ff] dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                      {shift.count}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {/* Overall Rating */}
                      <div className="bg-white dark:bg-gray-800/60 p-2 rounded-lg">
                        <div className="text-xs text-[#667085] dark:text-gray-400">Rating</div>
                        <div className={`text-base font-bold ${getScoreColor(shift.averageScore)}`}>
                          {shift.averageScore.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Resolution */}
                      <div className="bg-white dark:bg-gray-800/60 p-2 rounded-lg">
                        <div className="text-xs text-[#667085] dark:text-gray-400">Resolution</div>
                        <div className="text-base font-bold text-[#22c55e] dark:text-[#22c55e]">
                          {shift.resolutionRate.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#667085] dark:text-gray-400">Coherence</span>
                        <span className="text-xs font-medium text-[#FF80B5] dark:text-[#FF80B5]">{shift.avgCoherence.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#FF80B5] h-1 rounded-full" 
                          style={{ width: `${(shift.avgCoherence / 5) * 100}%` }}
                        ></div>
              </div>
            </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#667085] dark:text-gray-400">Politeness</span>
                        <span className="text-xs font-medium text-[#247BA0] dark:text-[#247BA0]">{shift.avgPoliteness.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#247BA0] h-1 rounded-full" 
                          style={{ width: `${(shift.avgPoliteness / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#667085] dark:text-gray-400">Relevance</span>
                        <span className="text-xs font-medium text-[#FFD166] dark:text-[#FFD166]">{shift.avgRelevance.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#FFD166] h-1 rounded-full" 
                          style={{ width: `${(shift.avgRelevance / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Divider - Don't show for the last item */}
                  {index < shiftMetrics.length - 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Card - Redesigned with Centered Buttons */}
        <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 flex flex-col h-full lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Quick Actions</h3>
            <div className="p-2 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
              <BarChart2 className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
            </div>
          </div>
          <div className="text-sm text-[#667085] dark:text-gray-400 mb-5">
            Navigate to detailed views
          </div>
          <div className="flex flex-col space-y-3 justify-center flex-1">
              <Button 
                onClick={() => navigate('/satisfaction')}
                variant="outline"
                className="w-full bg-gray-50 border-gray-200 text-[#252A3A] hover:bg-gray-100 dark:bg-gray-800/40 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700/40 justify-center text-sm font-medium rounded-lg h-12"
              >
                <BarChart2 className="h-4 w-4 mr-2 text-[#4582ff]" />
                Customer Satisfaction
              </Button>
              <Button 
                onClick={() => navigate('/cpr-details')}
                variant="outline"
                className="w-full bg-gray-50 border-gray-200 text-[#252A3A] hover:bg-gray-100 dark:bg-gray-800/40 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700/40 justify-center text-sm font-medium rounded-lg h-12"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-[#22c55e]" />
                CPR Details
              </Button>
              <Button 
                onClick={() => navigate('/resolution-details')}
                variant="outline"
                className="w-full bg-gray-50 border-gray-200 text-[#252A3A] hover:bg-gray-100 dark:bg-gray-800/40 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700/40 justify-center text-sm font-medium rounded-lg h-12"
              >
                <Gauge className="h-4 w-4 mr-2 text-[#D4A000]" />
                Resolution Details
              </Button>
              <Button 
                onClick={() => navigate('/report')}
                variant="outline"
                className="w-full bg-gray-50 border-gray-200 text-[#252A3A] hover:bg-gray-100 dark:bg-gray-800/40 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700/40 justify-center text-sm font-medium rounded-lg h-12"
              >
                <FileText className="h-4 w-4 mr-2 text-[#FF80B5]" />
                Full Report
              </Button>
            </div>
        </div>
        
        {/* Profanity Analysis Section - Replacing Keyword Analysis */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Profanity in Chatlogs</h3>
                <div className="text-sm text-[#667085] dark:text-gray-400">
                  Analysis of inappropriate language in customer communications
                </div>
              </div>
              <div className="p-2 rounded-full bg-[#FFECEB] dark:bg-rose-900/30">
                <Tag className="h-4 w-4 text-[#FF80B5] dark:text-rose-400" />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 flex-1 flex flex-col justify-center">
              {validResults.length > 0 ? (
                <div className="flex flex-col">
                  {/* Profanity Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg text-center">
                      <div className="text-3xl font-bold text-[#FF80B5] dark:text-rose-400">0%</div>
                      <div className="text-xs text-[#667085] dark:text-gray-400">Chatlogs with Profanity</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg text-center">
                      <div className="text-3xl font-bold text-[#4582ff] dark:text-blue-400">0</div>
                      <div className="text-xs text-[#667085] dark:text-gray-400">Total Instances</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg text-center">
                      <div className="text-3xl font-bold text-[#22c55e] dark:text-green-400">100%</div>
                      <div className="text-xs text-[#667085] dark:text-gray-400">Clean Chatlogs</div>
                    </div>
                  </div>
                  
                  {/* Profanity Message */}
                  <div className="flex items-center justify-center p-6 bg-[#ECFDF3] dark:bg-green-900/20 rounded-lg mt-4">
                    <CheckCircle className="h-5 w-5 text-[#22c55e] dark:text-green-400 mr-2" />
                    <span className="text-[#15803d] dark:text-green-300 font-medium">
                      No profanity detected in the analyzed chatlogs
                    </span>
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-sm text-[#667085] dark:text-gray-400">
                      This feature monitors chatlogs for inappropriate language and provides insights on profanity usage
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[#667085] dark:text-gray-400">No data available for profanity analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Performance by Scenario - Revised for better handling of many scenarios */}
        <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 lg:col-span-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Performance by Scenario</h3>
              <div className="text-sm text-[#667085] dark:text-gray-400">
                Top and bottom performing scenarios
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mt-2">
            {scenarioMetrics.length > 0 ? (
              <div className="flex flex-col">
                {/* Scenario Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-[#4582ff] dark:text-blue-400">{scenarioMetrics.length}</div>
                    <div className="text-xs text-[#667085] dark:text-gray-400">Total Scenarios</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800/60 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-[#22c55e] dark:text-green-400">
                      {Math.round(scenarioMetrics.reduce((sum, scenario) => sum + scenario.resolutionRate, 0) / scenarioMetrics.length)}%
                    </div>
                    <div className="text-xs text-[#667085] dark:text-gray-400">Avg Resolution Rate</div>
                  </div>
                </div>
                
                {/* Compact Scenarios Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-3 py-2 text-left text-xs font-medium text-[#667085] dark:text-gray-400">Scenario</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-[#667085] dark:text-gray-400">Logs</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-[#667085] dark:text-gray-400">Res. Rate</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-[#667085] dark:text-gray-400">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Top 3 Scenarios */}
                      {scenarioMetrics
                        .sort((a, b) => b.resolutionRate - a.resolutionRate)
                        .slice(0, 3)
                        .map((scenario, index) => (
                          <tr key={`top-${index}`} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 text-sm text-[#252A3A] dark:text-white truncate max-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                {scenario.name}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-[#252A3A] dark:text-white">{scenario.count}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-medium text-green-600 dark:text-green-400">{scenario.resolutionRate.toFixed(0)}%</span>
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-[#252A3A] dark:text-white">
                              {((scenario.avgCoherence + scenario.avgPoliteness + scenario.avgRelevance) / 3).toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      
                      {/* Divider row */}
                      {scenarioMetrics.length > 6 && (
                        <tr className="bg-gray-50 dark:bg-gray-800/60">
                          <td colSpan={4} className="px-3 py-1 text-center text-xs text-[#667085] dark:text-gray-400">
                            {scenarioMetrics.length - 6} more scenarios
                          </td>
                        </tr>
                      )}
                      
                      {/* Bottom 3 Scenarios */}
                      {scenarioMetrics
                        .sort((a, b) => a.resolutionRate - b.resolutionRate)
                        .slice(0, 3)
                        .map((scenario, index) => (
                          <tr key={`bottom-${index}`} className={index === 2 ? '' : 'border-b border-gray-200 dark:border-gray-700'}>
                            <td className="px-3 py-2 text-sm text-[#252A3A] dark:text-white truncate max-w-[200px]">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                {scenario.name}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-[#252A3A] dark:text-white">{scenario.count}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-medium text-red-600 dark:text-red-400">{scenario.resolutionRate.toFixed(0)}%</span>
                            </td>
                            <td className="px-3 py-2 text-center text-sm text-[#252A3A] dark:text-white">
                              {((scenario.avgCoherence + scenario.avgPoliteness + scenario.avgRelevance) / 3).toFixed(1)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[#667085] dark:text-gray-400">No scenario data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Date-based Performance - Full width for timeline visibility */}
        {dateMetrics.length > 0 && (
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 lg:col-span-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">
                  Weekly Performance
                </h3>
                <div className="text-sm text-[#667085] dark:text-gray-400">
                  Performance trends over time
              </div>
              </div>
              </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mt-2">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dateMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={dateMetrics.length > 8 ? Math.floor(dateMetrics.length / 8) : 0}
                      tick={{ fontSize: 12, fill: '#667085' }}
                      strokeOpacity={0.75}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke={RESOLUTION_COLOR}
                      tick={{ fill: '#667085' }}
                      domain={[0, 100]}
                      label={{ 
                        value: 'Resolution Rate (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#667085', fontSize: 12 }
                      }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke={COHERENCE_COLOR}
                      tick={{ fill: '#667085' }}
                      domain={[0, 5]}
                      label={{ 
                        value: 'Score (0-5)', 
                        angle: 90, 
                        position: 'insideRight',
                        style: { textAnchor: 'middle', fill: '#667085', fontSize: 12 }
                      }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <p className="font-medium text-[#252A3A] text-sm mb-1.5">{label}</p>
                              <p className="text-xs mb-1 text-[#667085]">Resolution: <span className="font-medium text-[#252A3A]">{data.resolutionRate.toFixed(1)}%</span></p>
                              <p className="text-xs mb-1 text-[#667085]">Coherence: <span className="font-medium text-[#252A3A]">{data.avgCoherence.toFixed(1)}</span></p>
                              <p className="text-xs mb-1 text-[#667085]">Politeness: <span className="font-medium text-[#252A3A]">{data.avgPoliteness.toFixed(1)}</span></p>
                              <p className="text-xs mb-1 text-[#667085]">Relevance: <span className="font-medium text-[#252A3A]">{data.avgRelevance.toFixed(1)}</span></p>
                              <p className="text-xs text-[#667085]">Chatlogs: <span className="font-medium text-[#252A3A]">{data.count}</span></p>
              </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 20 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="resolutionRate"
                      name="Resolution Rate"
                      stroke={RESOLUTION_COLOR}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgCoherence"
                      name="Coherence"
                      stroke={COHERENCE_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgPoliteness"
                      name="Politeness"
                      stroke={POLITENESS_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgRelevance"
                      name="Relevance"
                      stroke={RELEVANCE_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default DashboardPage;

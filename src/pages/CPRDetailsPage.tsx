// src/pages/CPRDetailsPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';
import { Gauge, Smile, MessageCircle, Download, CheckCircle, BarChart2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, Zap, FileText, X, ArrowUpDown, Tag, TrendingUp, TrendingDown, Clock, Calendar, Sun, Sunset, Moon, Search, Filter } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { format, getHours, getDay, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Define types
interface EvaluationResultItem {
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  originalIndex?: number;
  dateTime?: string;
}

interface ScoreDistributionDataItem {
  name: string;
  count: number;
}

// Column definition for our manual table
interface ColumnDefinition<TData extends object> {
  accessorKey: keyof TData | 'actions';
  header: string | (() => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
}

// Define consistent color scheme
const COLOR_SCHEME = {
  coherence: "#8884d8", // Purple for coherence
  politeness: "#247BA0", // Blue for politeness
  relevance: "#22c55e", // Green for relevance
  resolution: "#FFD166", // Yellow/amber for resolution
  background: "#f5f7fa",
  cardBg: "#ffffff",
  darkBg: "#161925",
  darkCardBg: "#232534",
  textPrimary: "#252A3A",
  textSecondary: "#667085"
};

// Updated gradients to match the dashboard
const metricGradients: Record<string, string> = {
  coherence: 'bg-gradient-to-r from-[#F8E3FF] via-[#FFD1DC] to-[#FFC6D3]',
  politeness: 'bg-gradient-to-r from-[#D4E7FE] via-[#B6CCFE] to-[#B0E5E9]',
  relevance: 'bg-gradient-to-r from-[#D1FAE5] via-[#6EE7B7] to-[#34D399]',
  resolution: 'bg-gradient-to-r from-[#FFF8C9] via-[#FFEAA0] to-[#FFD166]',
};

const metricIcons: Record<string, React.ReactNode> = {
  coherence: <Gauge className="w-6 h-6 text-[#0A2463]" />,
  politeness: <Smile className="w-6 h-6 text-[#247BA0]" />,
  relevance: <MessageCircle className="w-6 h-6 text-[#FFD166]" />,
  resolution: <CheckCircle className="w-6 h-6 text-[#2B2D42]" />,
};

// Updated ScoreCard component to match the dashboard style
const ScoreCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) => {
  // Get the corresponding gradient based on the title
  const getGradient = () => {
    if (title.toLowerCase().includes('coherence')) return metricGradients.coherence;
    if (title.toLowerCase().includes('politeness')) return metricGradients.politeness;
    if (title.toLowerCase().includes('relevance')) return metricGradients.relevance;
    if (title.toLowerCase().includes('resolution')) return metricGradients.resolution;
    return '';
  };

  return (
    <div className={`${getGradient()} dark:bg-gradient-to-r dark:from-gray-800/60 dark:via-gray-800/60 dark:to-gray-800/60 rounded-xl shadow-sm p-5 flex flex-col`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-[#252A3A] dark:text-white">{title}</h3>
        <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5", style: { color } })}
      </div>
    </div>
      <div className="mt-2">
        <div className="text-3xl font-bold text-[#252A3A] dark:text-white">{value}</div>
        <div className="text-sm text-[#252A3A]/70 dark:text-white/70">{subtitle}</div>
    </div>
  </div>
);
};

// Add interfaces for time-based analysis
interface TimeDistributionData {
  hour: number;
  count: number;
  avgMetricValue: number;
  resolutionRate: number;
}

interface ShiftData {
  name: string;
  hours: [number, number];
  count: number;
  avgMetricValue: number;
  resolutionRate: number;
  icon: React.ReactNode;
}

const CPRDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'coherence' | 'politeness' | 'relevance'>('coherence');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);
  const [scoreFilter, setScoreFilter] = useState<string>('');
  const [resolutionFilter, setResolutionFilter] = useState<string>('');
  
  // Add new filter states
  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Add pagination state
  const ITEMS_PER_PAGE = 5; // Show 5 items per page
  const [currentPage, setCurrentPage] = useState(0);

  // Update state variables to separate table and needs attention sections
  const [expandedChatlogIndex, setExpandedChatlogIndex] = useState<number | null>(null);
  const [expandedTableChatlogIndex, setExpandedTableChatlogIndex] = useState<number | null>(null);
  const [expandedChatData, setExpandedChatData] = useState<EvaluationResultItem | null>(null);
  const [activeSection, setActiveSection] = useState<'needs-attention' | 'table' | null>(null);

  // Update the handleToggleChatlogView function for the needs attention section only
  const handleToggleChatlogView = (index: number) => {
    if (expandedChatlogIndex === index) {
      setExpandedChatlogIndex(null);
      setActiveSection(null);
    } else {
      setExpandedChatlogIndex(index);
      setExpandedTableChatlogIndex(null);
      setActiveSection('needs-attention');
      const chatData = validResults.find(item => item.originalIndex === index);
      setExpandedChatData(chatData || null);
    }
  };

  // Add a function to handle viewing a chat from the table
  const handleViewChat = (row: EvaluationResultItem) => {
    setExpandedTableChatlogIndex(row.originalIndex!);
    setExpandedChatlogIndex(null);
    setExpandedChatData(row);
    setActiveSection('table');
  };

  // Add a function to handle closing the chat view
  const handleCloseChat = () => {
    setExpandedChatlogIndex(null);
    setExpandedTableChatlogIndex(null);
    setExpandedChatData(null);
    setActiveSection(null);
  };

  // Add a sort config state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: activeTab, 
    direction: 'asc' 
  });

  // Add a function to handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(0); // Reset to first page when sorting
  };

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#f5f7fa] dark:bg-[#161925] text-[#252A3A] dark:text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-2">CPR Details</h1>
          <h3 className="text-xl font-medium mb-4 mt-8">No Evaluation Results</h3>
          <p className="text-[#667085] dark:text-gray-400 mb-6">
            Please upload or paste chatlogs on the home page to see CPR details.
          </p>
          <Button onClick={() => navigate('/')} className="bg-[#247BA0] hover:bg-[#247BA0]/80 text-white">
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  const validResults: EvaluationResultItem[] = useMemo(() => evaluationResults
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item =>
      item &&
      typeof item.coherence === 'number' && !isNaN(item.coherence) &&
      typeof item.politeness === 'number' && !isNaN(item.politeness) &&
      typeof item.relevance === 'number' && !isNaN(item.relevance) &&
      typeof item.resolution === 'number' && !isNaN(item.resolution)
  ), [evaluationResults]);

  const avgScores = useMemo(() => {
    if (validResults.length === 0) return { coherence: NaN, politeness: NaN, relevance: NaN };
    return {
      coherence: validResults.reduce((sum, item) => sum + item.coherence, 0) / validResults.length,
      politeness: validResults.reduce((sum, item) => sum + item.politeness, 0) / validResults.length,
      relevance: validResults.reduce((sum, item) => sum + item.relevance, 0) / validResults.length,
    };
  }, [validResults]);
  const resolvedCount = validResults.filter(item => item.resolution === 1).length;
  const resolutionRate = validResults.length > 0 ? (resolvedCount / validResults.length) * 100 : 0;

  const distributions = useMemo(() => {
    const createDistribution = (metric: 'coherence' | 'politeness' | 'relevance'): ScoreDistributionDataItem[] => {
      const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      validResults.forEach(result => {
        const score = Math.round(Number(result[metric]));
        if (score >= 1 && score <= 5) {
          counts[score]++;
        }
      });
      return Object.entries(counts).map(([scoreNum, count]) => ({ name: scoreNum, count }));
    };
    return {
      coherence: createDistribution('coherence'),
      politeness: createDistribution('politeness'),
      relevance: createDistribution('relevance'),
    };
  }, [validResults]);

  // Get unique scenarios for filter dropdown
  const uniqueScenarios = useMemo(() => {
    const scenarios = new Set<string>();
    validResults.forEach(item => {
      if (item.scenario) {
        scenarios.add(item.scenario);
      }
    });
    return Array.from(scenarios).sort();
  }, [validResults]);

  // Get unique dates for calendar highlighting
  const availableDates = useMemo(() => {
    const dates = new Set<Date>();
    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            // Set time to midnight to compare only dates
            date.setHours(0, 0, 0, 0);
            dates.add(date);
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    return Array.from(dates);
  }, [validResults]);

  // Update the filtered results to include all filters
  const filteredResults = useMemo(() => {
    let filtered = validResults.filter(item =>
      (!scoreFilter || Math.round(item[activeTab]) === Number(scoreFilter)) &&
      (!resolutionFilter || String(item.resolution) === resolutionFilter)
    );
    
    // Apply search text filter
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(item => 
        (item.scenario && item.scenario.toLowerCase().includes(searchLower)) ||
        (item.chatlog && item.chatlog.toLowerCase().includes(searchLower)) ||
        (item.dateTime && item.dateTime.toLowerCase().includes(searchLower))
      );
    }

    // Apply specific filters
    if (scenarioFilter) {
      filtered = filtered.filter(item => 
        item.scenario && item.scenario.toLowerCase().includes(scenarioFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(item => 
        item.dateTime && item.dateTime.includes(dateFilter)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'scenario') {
          const valA = a.scenario || '';
          const valB = b.scenario || '';
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else if (sortConfig.key === 'dateTime') {
          const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
          const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          const valA = a[sortConfig.key as keyof EvaluationResultItem] as number;
          const valB = b[sortConfig.key as keyof EvaluationResultItem] as number;
          
          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
          }
          return 0;
        }
      });
    }
    
    return filtered;
  }, [validResults, scoreFilter, resolutionFilter, activeTab, sortConfig, filterText, scenarioFilter, dateFilter]);

  // Pagination logic for filtered results
  const pageCount = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredResults.length);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Export logic
  const handleExport = (type: 'csv' | 'excel') => {
    const data = filteredResults;
    if (type === 'csv') {
      exportToCSV(data, `${activeTab}-chatlogs`);
      toast({ title: 'Exported', description: 'CSV file has been downloaded.' });
    } else {
      exportToExcel(data, `${activeTab}-chatlogs`);
      toast({ title: 'Exported', description: 'Excel file has been downloaded.' });
    }
  };
  
  // Table columns
  const getColumnsForMetric = (metric: 'coherence' | 'politeness' | 'relevance'): ColumnDefinition<EvaluationResultItem>[] => [
    {
      accessorKey: 'scenario',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('scenario')}>
          <Tag className="h-4 w-4 mr-1 text-[#667085]" />
          <span>Scenario</span>
          {sortConfig.key === 'scenario' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
          )}
        </div>
      ),
      cell: (row: EvaluationResultItem) => (
        <div className="max-w-[200px] truncate text-[#252A3A] dark:text-white">
          {row.scenario || 'Unknown scenario'}
        </div>
      ),
    },
    {
      accessorKey: 'dateTime',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('dateTime')}>
          <Calendar className="h-4 w-4 mr-1 text-[#667085]" />
          <span>Timestamp</span>
          {sortConfig.key === 'dateTime' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
          )}
        </div>
      ),
      cell: (row: EvaluationResultItem) => {
        if (!row.dateTime) return <span className="text-[#667085] dark:text-gray-400">-</span>;
        
        try {
          const date = new Date(row.dateTime);
          return (
            <div className="text-sm text-[#252A3A] dark:text-gray-200">
              <div>{format(date, 'MMM d, yyyy')}</div>
              <div className="text-xs text-[#667085] dark:text-gray-400">{format(date, 'h:mm a')}</div>
            </div>
          );
        } catch (e) {
          return <span className="text-[#667085] dark:text-gray-400">{row.dateTime}</span>;
        }
      },
    },
    {
      accessorKey: metric,
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort(metric)}>
          {metric === 'coherence' ? (
            <Gauge className="h-4 w-4 mr-1 text-[#667085]" />
          ) : metric === 'politeness' ? (
            <Smile className="h-4 w-4 mr-1 text-[#667085]" />
          ) : (
            <MessageCircle className="h-4 w-4 mr-1 text-[#667085]" />
          )}
          <span>{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
          {sortConfig.key === metric && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
          )}
        </div>
      ),
      cell: (row: EvaluationResultItem) => {
        const score = row[metric];
        return <div className={`font-medium p-2 rounded-md w-12 text-center mx-auto ${
          score <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          score === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200' : 
          'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200'
        }`}>{typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : 'N/A'}</div>;
      }
    },
    {
      accessorKey: 'resolution',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('resolution')}>
          <CheckCircle className="h-4 w-4 mr-1 text-[#667085]" />
          <span>Resolution</span>
          {sortConfig.key === 'resolution' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
          )}
        </div>
      ),
      cell: (row: EvaluationResultItem) => {
        const resolutionValue = row.resolution;
        const isResolved = typeof resolutionValue === 'number' && resolutionValue === 1;
        return <div className={`font-semibold p-2 rounded-md w-24 text-center mx-auto ${
          isResolved ? 'bg-green-100 text-green-700 dark:bg-green-800/70 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-800/70 dark:text-red-200'
        }`}>{typeof resolutionValue === 'number' ? (isResolved ? 'Resolved' : 'Unresolved') : 'N/A'}</div>;
      }
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: (row: EvaluationResultItem) => (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewChat(row)}
            className="border-[#247BA0] text-[#247BA0] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg h-8"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            View Chat
          </Button>
        </div>
      )
    }
  ];

  // 1. Needs Attention logic for sidebar - always focus on coherence
  const needsAttention = useMemo(() => {
    return validResults
      .slice()
      .sort((a, b) => a.coherence - b.coherence)
      .slice(0, 5);
  }, [validResults]);

  // 2. Trends data for each metric
  const trendsData = useMemo(() => {
    // Group by 10 logs for smoother trend
    const groupSize = 10;
    const data: { name: string; avg: number }[] = [];
    for (let i = 0; i < validResults.length; i += groupSize) {
      const group = validResults.slice(i, i + groupSize);
      const avg = group.length > 0 ? group.reduce((sum, item) => sum + item[activeTab], 0) / group.length : 0;
      data.push({ name: `#${i + 1}-${i + group.length}`, avg: avg });
    }
    return data;
  }, [validResults, activeTab]);

  // 3. Score breakdown for selected metric
  const scoreBreakdown = useMemo(() => {
    let low = 0, medium = 0, high = 0;
    validResults.forEach(item => {
      const score = Math.round(item[activeTab]);
      if (score <= 2) low++;
      else if (score === 3) medium++;
      else if (score >= 4) high++;
    });
    const total = validResults.length;
    return {
      low: { count: low, pct: total ? (low / total) * 100 : 0 },
      medium: { count: medium, pct: total ? (medium / total) * 100 : 0 },
      high: { count: high, pct: total ? (high / total) * 100 : 0 },
    };
  }, [validResults, activeTab]);

  // Calculate scenario-based metrics for each CPR dimension
  const scenarioMetrics = useMemo(() => {
    const scenarios = [...new Set(validResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = validResults.filter(item => item.scenario === scenario);
      return {
        name: scenario,
        coherence: scenarioLogs.reduce((sum, item) => sum + item.coherence, 0) / scenarioLogs.length,
        politeness: scenarioLogs.reduce((sum, item) => sum + item.politeness, 0) / scenarioLogs.length,
        relevance: scenarioLogs.reduce((sum, item) => sum + item.relevance, 0) / scenarioLogs.length,
        count: scenarioLogs.length
      };
    });
  }, [validResults]);

  // Get top and bottom scenarios based on active metric
  const topBottomScenarios = useMemo(() => {
    if (scenarioMetrics.length === 0) return { top: [], bottom: [] };
    
    // Sort by the active tab metric
    const sorted = [...scenarioMetrics].sort((a, b) => b[activeTab] - a[activeTab]);
    
    // Get top 3 and bottom 3
    return {
      top: sorted.slice(0, 3),
      bottom: sorted.slice(-3).reverse()
    };
  }, [scenarioMetrics, activeTab]);

  // Calculate time-related metrics
  const timeDistribution = useMemo(() => {
    const hourlyData: TimeDistributionData[] = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
      avgMetricValue: 0,
      resolutionRate: 0
    }));

    const hourCounts: number[] = Array(24).fill(0);
    const hourMetricValues: number[] = Array(24).fill(0);
    const hourResolved: number[] = Array(24).fill(0);
    
    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const hour = getHours(date);
            hourCounts[hour]++;
            hourMetricValues[hour] += item[activeTab];
            if (item.resolution === 1) {
              hourResolved[hour]++;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Calculate averages
    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > 0) {
        hourlyData[i].count = hourCounts[i];
        hourlyData[i].avgMetricValue = hourMetricValues[i] / hourCounts[i];
        hourlyData[i].resolutionRate = (hourResolved[i] / hourCounts[i]) * 100;
      }
    }

    return hourlyData;
  }, [validResults, activeTab]);

  // Define shifts (Morning: 6am-2pm, Afternoon: 2pm-10pm, Night: 10pm-6am)
  const shifts: ShiftData[] = useMemo(() => [
    { 
      name: "Morning", 
      hours: [6, 14], 
      count: 0, 
      avgMetricValue: 0, 
      resolutionRate: 0,
      icon: <Sun className="h-5 w-5 text-amber-500" />
    },
    { 
      name: "Afternoon", 
      hours: [14, 22], 
      count: 0, 
      avgMetricValue: 0, 
      resolutionRate: 0,
      icon: <Sunset className="h-5 w-5 text-orange-500" />
    },
    { 
      name: "Night", 
      hours: [22, 6], 
      count: 0, 
      avgMetricValue: 0, 
      resolutionRate: 0,
      icon: <Moon className="h-5 w-5 text-indigo-500" />
    }
  ], []);

  // Calculate shift metrics
  const shiftMetrics = useMemo(() => {
    const shiftData = [...shifts];
    
    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const hour = getHours(date);
            
            // Update shift data
            for (let i = 0; i < shiftData.length; i++) {
              const shift = shiftData[i];
              const [start, end] = shift.hours;
              if (end > start) {
                // Normal shift (e.g., 6am-2pm)
                if (hour >= start && hour < end) {
                  shift.count++;
                  shift.avgMetricValue += item[activeTab];
                  if (item.resolution === 1) shift.resolutionRate++;
                }
              } else {
                // Overnight shift (e.g., 10pm-6am)
                if (hour >= start || hour < end) {
                  shift.count++;
                  shift.avgMetricValue += item[activeTab];
                  if (item.resolution === 1) shift.resolutionRate++;
                }
              }
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Finalize shift calculations
    shiftData.forEach(shift => {
      if (shift.count > 0) {
        shift.avgMetricValue = shift.avgMetricValue / shift.count;
        shift.resolutionRate = (shift.resolutionRate / shift.count) * 100;
      }
    });

    return shiftData;
  }, [validResults, shifts, activeTab]);

  // Calculate day of week analysis
  const dayOfWeekAnalysis = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData = days.map(day => ({
      name: day,
      count: 0,
      avgMetricValue: 0,
      resolutionRate: 0,
      totalMetricValue: 0,
      resolved: 0
    }));

    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const dayIndex = getDay(date);
            dayData[dayIndex].count++;
            dayData[dayIndex].totalMetricValue += item[activeTab];
            if (item.resolution === 1) {
              dayData[dayIndex].resolved++;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Calculate averages for each day
    dayData.forEach(day => {
      if (day.count > 0) {
        day.avgMetricValue = day.totalMetricValue / day.count;
        day.resolutionRate = (day.resolved / day.count) * 100;
      }
    });

    // Find best and worst days
    let bestDayIndex = 0;
    let worstDayIndex = 0;
    
    for (let i = 1; i < dayData.length; i++) {
      if (dayData[i].count > 0) {
        if (dayData[i].avgMetricValue > dayData[bestDayIndex].avgMetricValue) {
          bestDayIndex = i;
        }
        if (dayData[i].avgMetricValue < dayData[worstDayIndex].avgMetricValue || dayData[worstDayIndex].count === 0) {
          worstDayIndex = i;
        }
      }
    }

    return {
      data: dayData,
      bestDay: dayData[bestDayIndex].count > 0 ? days[bestDayIndex] : null,
      worstDay: dayData[worstDayIndex].count > 0 ? days[worstDayIndex] : null
    };
  }, [validResults, activeTab]);

  // Handle page change - reset to first page when filters or active tab changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [scoreFilter, resolutionFilter, activeTab]);

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      {/* Page Header */}
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-[#8884d8] rounded-full text-white shadow-md">
            <Gauge className="h-6 w-6" />
      </div>
          <div>
            <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">CPR Metrics Dashboard</h1>
            <p className="mt-1 text-[#667085] dark:text-gray-300">
              Detailed analysis of Coherence, Politeness, and Relevance across {validResults.length} chatlogs
            </p>
        </div>
        </div>
        </div>
      
      {/* Stat Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-7xl mx-auto">
        <ScoreCard 
          title="Coherence"
          value={isNaN(avgScores.coherence) ? 'N/A' : avgScores.coherence.toFixed(2)}
          subtitle="Average Score (1-5)"
          icon={<Gauge />}
          color={COLOR_SCHEME.coherence}
        />
        
        <ScoreCard 
          title="Politeness"
          value={isNaN(avgScores.politeness) ? 'N/A' : avgScores.politeness.toFixed(2)}
          subtitle="Average Score (1-5)"
          icon={<Smile />}
          color={COLOR_SCHEME.politeness}
        />
        
        <ScoreCard 
          title="Relevance"
          value={isNaN(avgScores.relevance) ? 'N/A' : avgScores.relevance.toFixed(2)}
          subtitle="Average Score (1-5)"
          icon={<MessageCircle />}
          color={COLOR_SCHEME.relevance}
        />
        
        <ScoreCard 
          title="Resolution Rate"
          value={isNaN(resolutionRate) ? 'N/A' : resolutionRate.toFixed(1) + '%'}
          subtitle={`${resolvedCount} of ${validResults.length} resolved`}
          icon={<CheckCircle />}
          color={COLOR_SCHEME.resolution}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto mb-6">
        {/* Left Column - 8 columns wide */}
        <div className="lg:col-span-9 space-y-4">
          {/* Tabs Card */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'coherence' | 'politeness' | 'relevance')} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger 
                  value="coherence" 
                  className="data-[state=active]:bg-[#8884d8] data-[state=active]:text-white"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  Coherence
                </TabsTrigger>
                <TabsTrigger 
                  value="politeness" 
                  className="data-[state=active]:bg-[#247BA0] data-[state=active]:text-white"
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Politeness
                </TabsTrigger>
                <TabsTrigger 
                  value="relevance" 
                  className="data-[state=active]:bg-[#22c55e] data-[state=active]:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Relevance
                </TabsTrigger>
                </TabsList>
              
              {/* Tab Content - Rendered for all tabs */}
              <div>
                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Low (1-2)</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{scoreBreakdown.low.count}</div>
                    <div className="text-xs text-[#667085] dark:text-gray-400">{scoreBreakdown.low.pct.toFixed(1)}%</div>
                        </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Average (3)</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scoreBreakdown.medium.count}</div>
                    <div className="text-xs text-[#667085] dark:text-gray-400">{scoreBreakdown.medium.pct.toFixed(1)}%</div>
                        </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">High (4-5)</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{scoreBreakdown.high.count}</div>
                    <div className="text-xs text-[#667085] dark:text-gray-400">{scoreBreakdown.high.pct.toFixed(1)}%</div>
                </div>
                  </div>
                  
                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Score Distribution Chart */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">Score Distribution</div>
                    <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={distributions[activeTab]} 
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#667085' }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} />
                              <Tooltip
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                                }}
                              />
                              <Bar 
                                dataKey="count" 
                            fill={activeTab === 'coherence' 
                              ? COLOR_SCHEME.coherence 
                              : (activeTab === 'politeness' 
                                ? COLOR_SCHEME.politeness 
                                : COLOR_SCHEME.relevance)
                            } 
                                radius={[4, 4, 0, 0]} 
                            barSize={25}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Trends Chart */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Trends Over Time
                    </div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={trendsData} 
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={[0, 5]} 
                            tick={{ fontSize: 12, fill: '#667085' }} 
                          />
                              <Tooltip
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Bar 
                            dataKey="avg" 
                            name="Average Score"
                            fill={activeTab === 'coherence' 
                              ? COLOR_SCHEME.coherence 
                              : (activeTab === 'politeness' 
                                ? COLOR_SCHEME.politeness 
                                : COLOR_SCHEME.relevance)
                            } 
                            radius={[4, 4, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                                      </div>
                  </div>
                </div>
                
                {/* Time-based Analysis Section */}
                <div className="mt-6">
                  <div className="flex items-center mb-3">
                    <Clock className="h-5 w-5 text-[#667085] mr-2" />
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Time-based Analysis</h3>
                  </div>
                  
                  {/* Shift Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {shiftMetrics.map((shift) => (
                      <div key={shift.name} className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {shift.icon}
                            <span className="ml-2 font-medium text-sm text-[#252A3A] dark:text-white">{shift.name} Shift</span>
                          </div>
                          <span className="text-xs text-[#667085] dark:text-gray-400">
                            {shift.hours[0] % 12 || 12}{shift.hours[0] < 12 ? 'am' : 'pm'} - {shift.hours[1] % 12 || 12}{shift.hours[1] < 12 ? 'am' : 'pm'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <div className="text-2xl font-bold text-[#252A3A] dark:text-white">
                              {shift.count > 0 ? shift.avgMetricValue.toFixed(1) : 'N/A'}
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400">
                              Avg. {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-[#252A3A] dark:text-white">
                              {shift.count > 0 ? shift.resolutionRate.toFixed(0) + '%' : 'N/A'}
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400">
                              Resolution Rate
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#667085] dark:text-gray-400">Sample Size</span>
                            <span className="font-medium text-[#252A3A] dark:text-white">{shift.count} chatlogs</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Hourly Distribution */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-[#252A3A] dark:text-white">
                        Hourly Distribution
                      </div>
                    </div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={timeDistribution.filter(hour => hour.count > 0)} 
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="hour" 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(hour) => `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            domain={[0, 5]} 
                            tick={{ fontSize: 11, fill: '#667085' }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            domain={[0, 100]} 
                            tick={{ fontSize: 11, fill: '#667085' }}
                          />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === 'Average Score') return [Number(value).toFixed(1), name];
                              if (name === 'Resolution Rate') return [Number(value).toFixed(0) + '%', name];
                              return [value, name];
                            }}
                            labelFormatter={(hour) => `Hour: ${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '12px'}}/>
                          <Bar
                            yAxisId="left"
                            dataKey="avgMetricValue"
                            name="Average Score"
                            fill={
                              activeTab === 'coherence' 
                                ? COLOR_SCHEME.coherence 
                                : (activeTab === 'politeness' 
                                  ? COLOR_SCHEME.politeness 
                                  : COLOR_SCHEME.relevance)
                            }
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="resolutionRate"
                            name="Resolution Rate"
                            fill={COLOR_SCHEME.resolution}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Day of Week Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Calendar className="h-5 w-5 text-[#667085] mr-2" />
                        <div className="text-sm font-medium text-[#252A3A] dark:text-white">
                          Day of Week Performance
                        </div>
                      </div>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={dayOfWeekAnalysis.data.filter(day => day.count > 0)} 
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10, fill: '#667085' }}
                              tickFormatter={(name) => name.substring(0, 3)}
                            />
                            <YAxis 
                              domain={[0, 5]} 
                              tick={{ fontSize: 11, fill: '#667085' }}
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === 'Average Score') return [Number(value).toFixed(1), name];
                                return [value, name];
                              }}
                              contentStyle={{ 
                                background: 'white', 
                                borderRadius: '8px', 
                                border: '1px solid #e2e8f0', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                              }}
                            />
                            <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '12px'}}/>
                            <Bar
                              dataKey="avgMetricValue"
                              name="Average Score"
                              fill={
                                activeTab === 'coherence' 
                                  ? COLOR_SCHEME.coherence 
                                  : (activeTab === 'politeness' 
                                    ? COLOR_SCHEME.politeness 
                                    : COLOR_SCHEME.relevance)
                              }
                                radius={[4, 4, 0, 0]} 
                              label={{
                                position: 'top',
                                formatter: (value: number) => value.toFixed(1),
                                fontSize: 10,
                                fill: '#667085'
                              }}
                              />
                        </BarChart>
                      </ResponsiveContainer>
                </div>
                  </div>
                  
                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Calendar className="h-5 w-5 text-[#667085] mr-2" />
                        <div className="text-sm font-medium text-[#252A3A] dark:text-white">
                          Day of Week Insights
                        </div>
                      </div>
                      <div className="space-y-4">
                        {dayOfWeekAnalysis.bestDay && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                              <div className="text-sm font-medium text-green-700 dark:text-green-400">
                                Best Performing Day
                              </div>
                            </div>
                            <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                              {dayOfWeekAnalysis.bestDay}
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
                              Highest average {activeTab} score among all days
                            </div>
                            <div className="text-sm font-medium text-green-700 dark:text-green-400 mt-2">
                              Avg: {dayOfWeekAnalysis.data.find(d => d.name === dayOfWeekAnalysis.bestDay)?.avgMetricValue.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        {dayOfWeekAnalysis.worstDay && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                              <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                              <div className="text-sm font-medium text-red-700 dark:text-red-400">
                                Needs Improvement
                              </div>
                            </div>
                            <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                              {dayOfWeekAnalysis.worstDay}
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
                              Lowest average {activeTab} score among all days
                            </div>
                            <div className="text-sm font-medium text-red-700 dark:text-red-400 mt-2">
                              Avg: {dayOfWeekAnalysis.data.find(d => d.name === dayOfWeekAnalysis.worstDay)?.avgMetricValue.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
          
          {/* Table Card */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Details
                </h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Chat details and {activeTab} scoring
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 text-xs border-[#4582ff] text-[#4582ff]"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                
                <select 
                  value={scoreFilter} 
                  onChange={e => setScoreFilter(e.target.value)}
                  className="border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-[#252A3A] dark:text-white border-gray-300 dark:border-gray-700"
                >
                                <option value="">All Scores</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                    </select>
                
                <select 
                  value={resolutionFilter} 
                  onChange={e => setResolutionFilter(e.target.value)}
                  className="border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-[#252A3A] dark:text-white border-gray-300 dark:border-gray-700"
                >
                                <option value="">All Resolution</option>
                      <option value="1">Resolved</option>
                      <option value="0">Unresolved</option>
                    </select>
                
                            <Button 
                              onClick={() => handleExport('csv')}
                              size="sm" 
                              variant="outline" 
                  className="h-7 text-xs border-[#4582ff] text-[#4582ff]"
                            >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                              Export
                    </Button>
                  </div>
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-[#667085]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="pl-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-sm w-full"
                    />
                  </div>
                  
                  <select
                    value={scenarioFilter}
                    onChange={(e) => setScenarioFilter(e.target.value)}
                    className="flex-1 min-w-[150px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                  >
                    <option value="">All Scenarios</option>
                    {uniqueScenarios.map(scenario => (
                      <option key={scenario} value={scenario}>{scenario}</option>
                    ))}
                  </select>
                  
                  {/* Date Calendar Picker */}
                  <div className="flex-1 min-w-[150px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFilter ? format(new Date(dateFilter), 'PPP') : <span className="text-[#667085]">Select date...</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dateFilter ? new Date(dateFilter) : undefined}
                          onSelect={(date) => setDateFilter(date ? format(date, 'yyyy-MM-dd') : '')}
                          modifiers={{
                            highlighted: availableDates
                          }}
                          modifiersStyles={{
                            highlighted: { backgroundColor: '#EEF4FF', color: '#247BA0', fontWeight: 'bold' }
                          }}
                          initialFocus
                        />
                        {dateFilter && (
                          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                              variant="ghost" 
                              className="w-full justify-center text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => setDateFilter('')}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setFilterText('');
                      setScenarioFilter('');
                      setDateFilter('');
                      setScoreFilter('');
                      setResolutionFilter('');
                    }}
                    className="whitespace-nowrap border-gray-200 dark:border-gray-700"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Clear All
                  </Button>
                </div>
              </div>
            )}
            
            {/* Main content area with table and chat view */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Table Section */}
              <div className={`bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 ${expandedChatData && activeSection === 'table' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/80">
                    <table className="w-full caption-bottom text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                          {getColumnsForMetric(activeTab).map((columnDef) => (
                          <th
                            key={String(columnDef.accessorKey)}
                            className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs"
                          >
                              {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                                  {paginatedResults.length > 0 ? (
                                    paginatedResults.map((rowItem, rowIndex) => (
                          <tr 
                            key={rowItem.originalIndex ?? (startIndex + rowIndex)}
                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 ${expandedTableChatlogIndex === rowItem.originalIndex && activeSection === 'table' ? 'bg-[#EEF4FF] dark:bg-blue-900/20' : ''}`}
                          >
                                {getColumnsForMetric(activeTab).map((columnDef) => (
                              <td
                                key={String(columnDef.accessorKey)}
                                className="p-3 align-middle text-xs"
                              >
                                    {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                  </td>
                                ))}
                              </tr>
                          ))
                        ) : (
                          <tr>
                          <td
                            colSpan={getColumnsForMetric(activeTab).length}
                            className="p-4 h-16 text-center text-[#667085] dark:text-gray-400 text-xs"
                          >
                              No chatlogs found for this filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                </div>
                          
                          {/* Pagination Controls */}
                          {pageCount > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-[#667085] dark:text-gray-400">
                      Showing {startIndex + 1} to {endIndex} of {filteredResults.length}
                              </div>
                    <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(0)}
                                  disabled={currentPage === 0}
                        className="border-gray-200 dark:border-gray-700 h-7 w-7 p-0"
                                >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                  disabled={currentPage === 0}
                        className="border-gray-200 dark:border-gray-700 h-7 text-xs"
                                >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                  Prev
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(pageCount - 1, prev + 1))}
                                  disabled={currentPage >= pageCount - 1}
                        className="border-gray-200 dark:border-gray-700 h-7 text-xs"
                                >
                                  Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(pageCount - 1)}
                                  disabled={currentPage >= pageCount - 1}
                        className="border-gray-200 dark:border-gray-700 h-7 w-7 p-0"
                                >
                        <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )}
                    </div>

              {/* Chat View Panel - Inside the table card */}
              {expandedChatData && activeSection === 'table' && (
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 lg:col-span-4">
                  <div className="bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 text-[#247BA0] mr-2" />
                        <div>
                          <div className="font-medium text-[#252A3A] dark:text-white text-xs">
                            Chatlog #{expandedTableChatlogIndex! + 1}
                  </div>
                          <div className="text-[10px] text-[#667085] dark:text-gray-400">
                            {expandedChatData.scenario || 'Unknown scenario'}
                </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                          expandedChatData.resolution === 1 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {expandedChatData.resolution === 1 ? 'Resolved' : 'Unresolved'}
                        </div>
                        <div className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                          expandedChatData[activeTab] <= 2 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : expandedChatData[activeTab] === 3
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}: {expandedChatData[activeTab].toFixed(1)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseChat}
                          className="h-6 w-6 p-0 text-[#667085]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto max-h-[400px]">
                      <ChatBubbleView chatlogText={expandedChatData.chatlog} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Needs Attention Card */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Needs Attention</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Lowest coherence chatlogs
                </div>
              </div>
              <div className="p-1.5 rounded-full bg-[#FFECEB] dark:bg-rose-900/30">
                <AlertTriangle className="h-4 w-4 text-[#FF80B5] dark:text-rose-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                {needsAttention.length === 0 ? (
                <span className="text-base text-[#667085] dark:text-gray-400">No chatlogs need attention.</span>
              ) : (
                needsAttention.map((item, idx) => (
                  <div key={item.originalIndex} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-medium text-[#252A3A] dark:text-gray-300">Chatlog #{item.originalIndex! + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">{item.coherence.toFixed(1)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleChatlogView(item.originalIndex!)}
                        className="border-[#247BA0] text-[#247BA0] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg h-7"
                      >
                        {expandedChatlogIndex === item.originalIndex && activeSection === 'needs-attention' ? 'Hide' : 'View'}
                      </Button>
                        </div>
                      </div>
                ))
              )}
            </div>
            {expandedChatlogIndex !== null && 
             activeSection === 'needs-attention' &&
             needsAttention.some(item => item.originalIndex === expandedChatlogIndex) && (
              <div className="mt-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-[#252A3A] dark:text-white mb-2">
                  Chatlog #{expandedChatlogIndex + 1}
                </div>
                <ChatBubbleView 
                  chatlogText={needsAttention.find(item => item.originalIndex === expandedChatlogIndex)?.chatlog || ''} 
                />
                  </div>
                )}
              </div>
          
          {/* Scenario Performance Card */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Scenario Performance</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Top and bottom scenarios by {activeTab}
                </div>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30">
                <BarChart2 className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 mt-3">
                {scenarioMetrics.length === 0 ? (
                <div className="text-center text-[#667085] dark:text-gray-400 py-4 text-sm">No scenario data available</div>
              ) : (
                <>
                  {/* Top Performers */}
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                      <span className="text-xs font-medium text-[#252A3A] dark:text-white">Top Performers</span>
                          </div>
                    <div className="space-y-2">
                      {topBottomScenarios.top.map((scenario) => (
                        <div key={`top-${scenario.name}`} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-medium truncate max-w-[70%] text-[#252A3A] dark:text-white" title={scenario.name}>
                                {scenario.name.length > 20 ? scenario.name.substring(0, 20) + '...' : scenario.name}
                              </div>
                              <div className="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                            {scenario[activeTab].toFixed(1)}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                                className="h-1.5 rounded-full bg-green-500 dark:bg-green-400" 
                            style={{ width: `${Math.min(100, (scenario[activeTab] / 5) * 100)}%` }}
                          ></div>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                  
                  {/* Bottom Performers */}
                  <div>
                    <div className="flex items-center mb-2">
                      <TrendingDown className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                      <span className="text-xs font-medium text-[#252A3A] dark:text-white">Needs Improvement</span>
                    </div>
                    <div className="space-y-2">
                      {topBottomScenarios.bottom.map((scenario) => (
                        <div key={`bottom-${scenario.name}`} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-medium truncate max-w-[70%] text-[#252A3A] dark:text-white" title={scenario.name}>
                                {scenario.name.length > 20 ? scenario.name.substring(0, 20) + '...' : scenario.name}
                                {scenario[activeTab].toFixed(1)}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full bg-red-500 dark:bg-red-400" 
                                style={{ width: `${Math.min(100, (scenario[activeTab] / 5) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
                )}
              </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5 mt-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Quick Navigation</h3>
              <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                <Zap className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 mt-3">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 justify-start text-sm"
                >
                  <BarChart2 className="w-4 h-4 mr-2 text-indigo-500" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/satisfaction')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 justify-start text-sm"
                >
                  <Smile className="w-4 h-4 mr-2 text-[#247BA0]" />
                  Satisfaction
                </Button>
                <Button 
                  onClick={() => navigate('/resolution-details')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 justify-start text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-[#22c55e]" />
                  Resolution
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPRDetailsPage;

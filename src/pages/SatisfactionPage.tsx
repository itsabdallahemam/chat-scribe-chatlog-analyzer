// src/pages/SatisfactionPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';
import { Smile, CheckCircle, Download, MessageCircle, AlertTriangle, Search, ArrowUpDown, Calendar, Tag, LayoutList, FileText, X, Filter, Clock, BarChart as BarChartIcon, Users, Clock3, Clock8, Clock12, Sun, Sunset, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { Input } from '@/components/ui/input';
import { format, isValid, parse, parseISO, getHours, getDay, startOfWeek, endOfWeek, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from '../utils/dateUtils';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Scatter, ScatterChart
} from 'recharts';

// Icons for pagination buttons (example using lucide-react)
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';


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

interface ColumnType<TData> {
  accessorKey: keyof TData | 'actions';
  header: string | (() => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface TimeDistributionData {
  hour: number;
  count: number;
  avgPoliteness: number;
  resolutionRate: number;
}

interface ShiftData {
  name: string;
  hours: [number, number];
  count: number;
  avgPoliteness: number;
  resolutionRate: number;
  icon?: React.ReactNode;
}

const ExpandableChatlog: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 100 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  if (typeof text !== 'string') return <span className="text-muted-foreground">N/A</span>;
  const needsExpansion = text.length > maxLength;
  const displayText = isExpanded || !needsExpansion ? text : `${text.substring(0, maxLength)}...`;
  return (
    <div className="text-app-text text-sm">
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayText}</p>
      {needsExpansion && (
        <Button variant="link" size="sm" className="p-0 h-auto text-app-blue hover:text-app-blue-light" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
};

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
    className={`relative rounded-2xl shadow-lg p-6 min-w-[180px] min-h-[180px] flex flex-col justify-between ${gradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}
  >
    <div className="flex justify-between items-start">
      <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{title}</div>
      <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow absolute top-4 right-4">
        {icon}
      </div>
    </div>
    <div className="mt-8">
      <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{value}</div>
      <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{subtitle}</div>
    </div>
  </div>
);

const SatisfactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();

  const [expandedChatlogIndex, setExpandedChatlogIndex] = useState<number | null>(null);
  const [expandedChatData, setExpandedChatData] = useState<EvaluationResultItem | null>(null);
  const [activeSection, setActiveSection] = useState<'needs-attention' | 'attention-table' | null>(null);

  // --- Sorting and Filtering State ---
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'politeness', direction: 'asc' });
  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [resolutionStatusFilter, setResolutionStatusFilter] = useState('');

  // --- Pagination State for Attention Table ---
  const ATTENTION_TABLE_PAGE_SIZE = 5; // Show 5 items per page
  const [attentionTableCurrentPage, setAttentionTableCurrentPage] = useState(0);
  // --- End Pagination State ---


  if (!evaluationResults || evaluationResults.length === 0) {
    // ... (no results message) ...
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-app-bg text-app-text">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-app-blue dark:text-white">Customer Satisfaction Insights</h1>
          <h3 className="text-xl font-medium mb-4 mt-8">No Evaluation Results</h3>
          <p className="text-muted-foreground mb-6">
            Please upload or paste chatlogs on the home page to see satisfaction insights.
          </p>
          <Button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light text-white">
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
      typeof item.politeness === 'number' && !isNaN(item.politeness) &&
      typeof item.resolution === 'number' && !isNaN(item.resolution)
    ), [evaluationResults]);

  const totalValidLogs = validResults.length;
  const avgPoliteness = totalValidLogs > 0 ? validResults.reduce((sum, item) => sum + item.politeness, 0) / totalValidLogs : NaN;
  const resolvedCount = validResults.filter(item => item.resolution === 1).length;
  const resolutionRate = totalValidLogs > 0 ? (resolvedCount / totalValidLogs) * 100 : 0;

  const politenessDistribution: ScoreDistributionDataItem[] = useMemo(() => {
    // ... (politenessDistribution logic) ...
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    validResults.forEach(result => {
      const score = Math.round(result.politeness);
      if (score >= 1 && score <= 5) {
        distribution[score]++;
      }
    });
    return Object.entries(distribution).map(([score, count]) => ({ name: score, count: count }));
  }, [validResults]);

  const attentionRequired: EvaluationResultItem[] = useMemo(() => {
    return validResults.filter(item => item.politeness <= 2 || item.resolution === 0);
  }, [validResults]);

  const handleToggleChatlogView = (index: number, section: 'needs-attention' | 'attention-table') => {
    if (expandedChatlogIndex === index && activeSection === section) {
      setExpandedChatlogIndex(null);
      setExpandedChatData(null);
      setActiveSection(null);
    } else {
      setExpandedChatlogIndex(index);
      const chatData = validResults.find(item => item.originalIndex === index);
      setExpandedChatData(chatData || null);
      setActiveSection(section);
    }
  };

  const attentionColumns: ColumnType<EvaluationResultItem>[] = [
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
        
        return (
          <div className="text-sm text-[#252A3A] dark:text-gray-200">
            <div>{formatDate(row.dateTime, 'DATE_ONLY')}</div>
            <div className="text-xs text-[#667085] dark:text-gray-400">
              {formatDate(row.dateTime, 'TIME_ONLY')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'politeness',
      header: () => (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('politeness')}>
          <Smile className="h-4 w-4 mr-1 text-[#667085]" />
          <span>Politeness</span>
          {sortConfig.key === 'politeness' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
          )}
        </div>
      ),
      cell: (row: EvaluationResultItem) => {
        const politenessValue = row.politeness;
        return <div className={`font-medium p-2 rounded-md w-12 text-center mx-auto ${
          politenessValue <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          politenessValue === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200' : 
          'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200'
        }`}>{typeof politenessValue === 'number' ? politenessValue.toFixed(1) : 'N/A'}</div>;
      },
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
      },
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
      ),
    }
  ];

  // Handle viewing a chat
  const handleViewChat = (row: EvaluationResultItem) => {
    setExpandedChatlogIndex(row.originalIndex!);
    setExpandedChatData(row);
    setActiveSection('attention-table'); // Set the active section to the table view
  };

  // Handle closing chat view
  const handleCloseChat = () => {
    setExpandedChatlogIndex(null);
    setExpandedChatData(null);
  };

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setAttentionTableCurrentPage(0); // Reset to first page when sorting
  };

  // Process filters and sorting
  const filteredAttentionData = useMemo(() => {
    let filtered = [...attentionRequired];

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

    if (resolutionStatusFilter) {
      const isResolved = resolutionStatusFilter === 'resolved';
      filtered = filtered.filter(item => 
        isResolved ? item.resolution === 1 : item.resolution === 0
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle different column types
        if (sortConfig.key === 'dateTime') {
          const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
          const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          const valA = a[sortConfig.key as keyof EvaluationResultItem] as number | string;
          const valB = b[sortConfig.key as keyof EvaluationResultItem] as number | string;
          
          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
          } else {
            const strA = String(valA || '');
            const strB = String(valB || '');
            return sortConfig.direction === 'asc' 
              ? strA.localeCompare(strB) 
              : strB.localeCompare(strA);
          }
        }
      });
    }

    return filtered;
  }, [attentionRequired, filterText, sortConfig, scenarioFilter, dateFilter, resolutionStatusFilter]);

  // Update pagination with filtered data
  const attentionPageCount = Math.ceil(filteredAttentionData.length / ATTENTION_TABLE_PAGE_SIZE);
  const attentionStartIndex = attentionTableCurrentPage * ATTENTION_TABLE_PAGE_SIZE;
  const attentionEndIndex = Math.min(attentionStartIndex + ATTENTION_TABLE_PAGE_SIZE, filteredAttentionData.length);
  const attentionPageData = filteredAttentionData.slice(attentionStartIndex, attentionEndIndex);

  // Reset pagination when filters change
  React.useEffect(() => {
    setAttentionTableCurrentPage(0);
  }, [filterText, scenarioFilter, dateFilter, resolutionStatusFilter]);

  // Get unique scenarios for filter dropdown
  const uniqueScenarios = useMemo(() => {
    const scenarios = new Set<string>();
    attentionRequired.forEach(item => {
      if (item.scenario) scenarios.add(item.scenario);
    });
    return Array.from(scenarios).sort();
  }, [attentionRequired]);

  // Get unique dates for calendar highlighting
  const availableDates = useMemo(() => {
    const dates = new Set<Date>();
    attentionRequired.forEach(item => {
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
  }, [attentionRequired]);

  const BAR_CHART_COLOR_POLITENESS = "#247BA0";
  const RESOLVED_COLOR = "#22c55e";
  const UNRESOLVED_COLOR = "#FFD166";
  const excellentPolitenessCount = validResults.filter(i => i.politeness >= 4).length;
  const averagePolitenessCount = validResults.filter(i => i.politeness === 3).length;
  const poorPolitenessCount = validResults.filter(i => i.politeness <= 2).length;
  const statCardGradients = [ /* ... */ 
    "bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100",
    "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
  ];

  // 1. Average turns per resolution (improved: count only lines starting with Agent:/Customer:)
  const avgTurnsPerResolution = useMemo(() => {
    const resolved = validResults.filter(item => item.resolution === 1);
    if (resolved.length === 0) return NaN;
    const getTurns = (chatlog: string) => {
      if (!chatlog) return 0;
      const lines = chatlog.split('\n').map(line => line.trim());
      const turnLines = lines.filter(line =>
        /^agent:/i.test(line) || /^customer:/i.test(line)
      );
      if (turnLines.length > 0) return turnLines.length;
      // fallback: count non-empty lines
      return lines.filter(line => line.length > 0).length;
    };
    const totalTurns = resolved.reduce((sum, item) => sum + getTurns(item.chatlog), 0);
    return totalTurns / resolved.length;
  }, [validResults]);

  // 2. Score breakdown for politeness
  const politenessScoreBreakdown = useMemo(() => {
    let low = 0, medium = 0, high = 0;
    validResults.forEach(item => {
      const score = Math.round(item.politeness);
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
  }, [validResults]);

  // 3. Scenario-based metrics for politeness and resolution
  const scenarioMetrics = useMemo(() => {
    const scenarios = [...new Set(validResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = validResults.filter(item => item.scenario === scenario);
      const avgPoliteness = scenarioLogs.reduce((sum, item) => sum + item.politeness, 0) / scenarioLogs.length;
      const resolvedInScenario = scenarioLogs.filter(item => item.resolution === 1).length;
      const resolutionRate = scenarioLogs.length > 0 ? (resolvedInScenario / scenarioLogs.length) * 100 : 0;
      return {
        name: scenario,
        avgPoliteness,
        resolutionRate,
        count: scenarioLogs.length
      };
    });
  }, [validResults]);

  // 4. Needs Attention: lowest politeness chatlogs
  const needsAttention = useMemo(() => {
    return validResults
      .slice()
      .sort((a, b) => a.politeness - b.politeness)
      .slice(0, 5);
  }, [validResults]);

  // Define shifts (Morning: 6am-2pm, Afternoon: 2pm-10pm, Night: 10pm-6am)
  const shifts: ShiftData[] = [
    { 
      name: "Morning", 
      hours: [6, 14], 
      count: 0, 
      avgPoliteness: 0, 
      resolutionRate: 0,
      icon: <Sun className="h-5 w-5 text-amber-500" />
    },
    { 
      name: "Afternoon", 
      hours: [14, 22], 
      count: 0, 
      avgPoliteness: 0, 
      resolutionRate: 0,
      icon: <Sunset className="h-5 w-5 text-orange-500" />
    },
    { 
      name: "Night", 
      hours: [22, 6], 
      count: 0, 
      avgPoliteness: 0, 
      resolutionRate: 0,
      icon: <Moon className="h-5 w-5 text-indigo-500" />
    }
  ];

  // Calculate time-related metrics
  const timeDistribution = useMemo(() => {
    const hourlyData: TimeDistributionData[] = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
      avgPoliteness: 0,
      resolutionRate: 0
    }));

    const hourCounts: number[] = Array(24).fill(0);
    const hourPoliteness: number[] = Array(24).fill(0);
    const hourResolved: number[] = Array(24).fill(0);
    
    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const hour = getHours(date);
            hourCounts[hour]++;
            hourPoliteness[hour] += item.politeness;
            if (item.resolution === 1) {
              hourResolved[hour]++;
            }
            
            // Update shift data
            for (const shift of shifts) {
              const [start, end] = shift.hours;
              if (end > start) {
                // Normal shift (e.g., 6am-2pm)
                if (hour >= start && hour < end) {
                  shift.count++;
                  shift.avgPoliteness += item.politeness;
                  if (item.resolution === 1) shift.resolutionRate++;
                }
              } else {
                // Overnight shift (e.g., 10pm-6am)
                if (hour >= start || hour < end) {
                  shift.count++;
                  shift.avgPoliteness += item.politeness;
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

    // Calculate averages
    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > 0) {
        hourlyData[i].count = hourCounts[i];
        hourlyData[i].avgPoliteness = hourPoliteness[i] / hourCounts[i];
        hourlyData[i].resolutionRate = (hourResolved[i] / hourCounts[i]) * 100;
      }
    }

    // Finalize shift calculations
    shifts.forEach(shift => {
      if (shift.count > 0) {
        shift.avgPoliteness = shift.avgPoliteness / shift.count;
        shift.resolutionRate = (shift.resolutionRate / shift.count) * 100;
      }
    });

    return hourlyData;
  }, [validResults]);

  // Calculate day of week analysis
  const dayOfWeekAnalysis = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData = days.map(day => ({
      name: day,
      count: 0,
      avgPoliteness: 0,
      resolutionRate: 0,
      totalPoliteness: 0,
      resolved: 0
    }));

    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const dayIndex = getDay(date);
            dayData[dayIndex].count++;
            dayData[dayIndex].totalPoliteness += item.politeness;
            if (item.resolution === 1) {
              dayData[dayIndex].resolved++;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Calculate averages
    dayData.forEach(day => {
      if (day.count > 0) {
        day.avgPoliteness = day.totalPoliteness / day.count;
        day.resolutionRate = (day.resolved / day.count) * 100;
      }
    });

    return dayData;
  }, [validResults]);

  // Get date range for filtering
  const dateRange = useMemo(() => {
    if (validResults.length === 0) return { min: new Date(), max: new Date() };
    
    const dates = validResults
      .filter(item => item.dateTime && isValid(new Date(item.dateTime)))
      .map(item => new Date(item.dateTime!));
    
    return {
      min: dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
      max: dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
    };
  }, [validResults]);

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center justify-center w-12 h-12 bg-[#247BA0] rounded-full text-white shadow-md">
            <Smile className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">Customer Satisfaction Insights</h1>
            <p className="mt-1 text-[#667085] dark:text-gray-300">Analysis of politeness scores and resolution rates across all chatlogs.</p>
          </div>
        </div>
      </div>
      
      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Left Column (7 columns wide) */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-4">
          {/* Score Distribution Chart */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Politeness Score Distribution</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Frequency of each politeness score (1-5)
                </div>
              </div>
              <BarChartIcon className="h-5 w-5 text-[#667085] dark:text-gray-400" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={politenessDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5}/>
                    <XAxis dataKey="name" name="Score" stroke="#667085" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#667085" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}}/>
                    <Bar dataKey="count" fill={BAR_CHART_COLOR_POLITENESS} name="Chatlog Count" radius={[8, 8, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Time Analysis Distribution Chart */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Hourly Distribution</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Customer satisfaction metrics by hour of day
                </div>
              </div>
              <div className="ml-auto">
                <Clock className="h-5 w-5 text-[#667085] dark:text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeDistribution}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(hour) => `${hour}h`}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke={BAR_CHART_COLOR_POLITENESS} domain={[0, 5]} tick={{ fontSize: 11, fill: '#667085' }} />
                    <YAxis yAxisId="right" orientation="right" stroke={RESOLVED_COLOR} domain={[0, 100]} tick={{ fontSize: 11, fill: '#667085' }} />
                    <Tooltip
                      contentStyle={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                      }}
                      formatter={(value, name) => {
                        if (name === "Average Politeness") {
                          return [typeof value === 'number' ? value.toFixed(2) : value, name];
                        } 
                        if (name === "Resolution Rate") {
                          return [typeof value === 'number' ? `${value.toFixed(1)}%` : value, name];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(hour) => `${hour}:00 - ${(hour + 1) % 24}:00`}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}}/>
                    <Bar
                      yAxisId="left"
                      dataKey="avgPoliteness"
                      name="Average Politeness"
                      fill={BAR_CHART_COLOR_POLITENESS}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="resolutionRate"
                      name="Resolution Rate"
                      fill={RESOLVED_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
      </div>
      
          {/* Scenarios Analysis (half height) */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Scenarios Performance</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Satisfaction metrics across different scenarios
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
              <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scenarioMetrics}
                    margin={{ top: 5, right: 20, left: -10, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 11, fill: '#667085' }}
                      strokeOpacity={0.75}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke={BAR_CHART_COLOR_POLITENESS} domain={[0, 5]} tick={{ fontSize: 11, fill: '#667085' }} />
                    <YAxis yAxisId="right" orientation="right" stroke={RESOLVED_COLOR} domain={[0, 100]} tick={{ fontSize: 11, fill: '#667085' }} />
                    <Tooltip
                      contentStyle={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}}/>
                    <Bar
                      yAxisId="left"
                      dataKey="avgPoliteness"
                      name="Avg Politeness"
                      fill={BAR_CHART_COLOR_POLITENESS}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="resolutionRate"
                      name="Resolution Rate (%)"
                      fill={RESOLVED_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column (5 columns wide) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          {/* Politeness Breakdown */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Politeness Breakdown</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Chatlogs by politeness category
              </div>
              </div>
            </div>
            <div className="space-y-5 pt-2">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-[#252A3A] dark:text-white">Excellent (4-5)</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {excellentPolitenessCount} <span className="text-xs text-[#667085] dark:text-gray-400">({politenessScoreBreakdown.high.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalValidLogs > 0 ? (excellentPolitenessCount / totalValidLogs) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                  }}
                />
              </div>
            </div>
                
            <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-300 mr-2"></div>
                      <span className="text-sm text-[#252A3A] dark:text-white">Average (3)</span>
              </div>
                    <span className="text-sm font-semibold text-blue-500 dark:text-blue-300">
                      {averagePolitenessCount} <span className="text-xs text-[#667085] dark:text-gray-400">({politenessScoreBreakdown.medium.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalValidLogs > 0 ? (averagePolitenessCount / totalValidLogs) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)',
                  }}
                />
              </div>
            </div>
                
            <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-[#252A3A] dark:text-white">Poor (1-2)</span>
              </div>
                    <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                      {poorPolitenessCount} <span className="text-xs text-[#667085] dark:text-gray-400">({politenessScoreBreakdown.low.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalValidLogs > 0 ? (poorPolitenessCount / totalValidLogs) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                  }}
                />
                  </div>
                </div>
              </div>
              </div>
            </div>
            
          {/* Shift Performance Cards */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Shift Performance</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Metrics across different work shifts
                </div>
                </div>
              <Users className="h-5 w-5 text-[#667085] dark:text-gray-400" />
                </div>
            
            <div className="grid grid-cols-1 gap-3">
              {shifts.map((shift) => (
                <div key={shift.name} className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {shift.icon}
                      <div className="font-medium text-[#252A3A] dark:text-white text-sm">{shift.name} Shift</div>
              </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      shift.avgPoliteness >= 4 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : shift.avgPoliteness >= 3
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {shift.count} chats
            </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="text-xs text-[#667085] dark:text-gray-400 mb-1">Politeness</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-[#252A3A] dark:text-white">{shift.avgPoliteness.toFixed(2)}</div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                            style={{ width: `${(shift.avgPoliteness / 5) * 100}%` }}
                          />
                          </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-[#667085] dark:text-gray-400 mb-1">Resolution</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-[#252A3A] dark:text-white">{shift.resolutionRate.toFixed(0)}%</div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 dark:bg-green-600 rounded-full"
                            style={{ width: `${shift.resolutionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Needs Attention */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Needs Attention</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Lowest politeness chatlogs
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
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">{item.politeness.toFixed(1)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleChatlogView(item.originalIndex!, 'needs-attention')}
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
        </div>
        </div>
      
      {/* Customer Service Issues Section */}
      <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">
                Customer Service Issues
              </h3>
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                {filteredAttentionData.length}
              </div>
            </div>
            <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
              Chatlogs with low politeness (≤ 2) or unresolved issues
            </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-gray-200 dark:border-gray-700 text-[#667085] dark:text-gray-300 text-xs ${showFilters ? 'bg-[#EEF4FF] text-[#247BA0] dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
              onClick={() => exportToCSV(filteredAttentionData, 'customer-service-issues')}
              className="border-[#4582ff] text-[#4582ff] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg"
              >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
              </Button>
            </div>
          </div>
        
        {/* Search & Filter Panel */}
        <div className={`${showFilters ? 'mb-4' : 'hidden'} bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 transition-all`}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085] h-4 w-4" />
                <Input 
                  placeholder="Search chatlogs..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-full"
                />
              </div>
            </div>
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm text-[#252A3A] dark:text-white"
            >
              <option value="">All Scenarios</option>
              {uniqueScenarios.map(scenario => (
                <option key={scenario} value={scenario}>{scenario}</option>
              ))}
            </select>
            
            {/* Date Calendar Picker */}
            <div className="flex-1">
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
            
            <select
              value={resolutionStatusFilter}
              onChange={(e) => setResolutionStatusFilter(e.target.value)}
              className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm text-[#252A3A] dark:text-white"
            >
              <option value="">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFilterText('');
                setScenarioFilter('');
                setDateFilter('');
                setResolutionStatusFilter('');
              }}
              className="whitespace-nowrap border-gray-200 dark:border-gray-700"
            >
              <X className="h-4 w-4 mr-1.5" />
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Table Section */}
          <div className={`bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 ${expandedChatData && activeSection === 'attention-table' ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/80">
            <table className="w-full caption-bottom text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                  {attentionColumns.map((columnDef) => (
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
                {attentionPageData.length > 0 ? (
                  attentionPageData.map((rowItem, rowIndex) => (
                      <tr 
                        key={rowItem.originalIndex ?? (attentionStartIndex + rowIndex)}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 ${expandedChatlogIndex === rowItem.originalIndex && activeSection === 'attention-table' ? 'bg-[#EEF4FF] dark:bg-blue-900/20' : ''}`}
                      >
                        {attentionColumns.map((columnDef) => (
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
                      colSpan={attentionColumns.length}
                        className="p-4 h-16 text-center text-[#667085] dark:text-gray-400 text-xs"
                    >
                        No chatlogs found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {attentionPageCount > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Showing {attentionStartIndex + 1} to {attentionEndIndex} of {filteredAttentionData.length}
              </div>
                <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(0)}
                  disabled={attentionTableCurrentPage === 0}
                    className="border-gray-200 dark:border-gray-700 h-7 w-7 p-0"
                >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={attentionTableCurrentPage === 0}
                    className="border-gray-200 dark:border-gray-700 h-7 text-xs"
                >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(prev => Math.min(attentionPageCount - 1, prev + 1))}
                  disabled={attentionTableCurrentPage >= attentionPageCount - 1}
                    className="border-gray-200 dark:border-gray-700 h-7 text-xs"
                >
                  Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(attentionPageCount - 1)}
                  disabled={attentionTableCurrentPage >= attentionPageCount - 1}
                    className="border-gray-200 dark:border-gray-700 h-7 w-7 p-0"
                >
                    <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          </div>

          {/* Chat View Panel */}
          {expandedChatData && activeSection === 'attention-table' && (
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 lg:col-span-2">
              <div className="bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2.5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <FileText className="h-3.5 w-3.5 text-[#247BA0] mr-2" />
                    <div>
                      <div className="font-medium text-[#252A3A] dark:text-white text-xs">
                        Chatlog #{expandedChatlogIndex! + 1}
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
                      expandedChatData.politeness <= 2 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : expandedChatData.politeness === 3
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      Politeness: {expandedChatData.politeness.toFixed(1)}
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

      {/* Weekly Performance Section */}
      <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Weekly Performance</h3>
            <div className="text-xs text-[#667085] dark:text-gray-400">
              Customer satisfaction metrics by day of week
            </div>
          </div>
          <div className="ml-auto">
            <Calendar className="h-5 w-5 text-[#667085] dark:text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeekAnalysis}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#667085' }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke={BAR_CHART_COLOR_POLITENESS} domain={[0, 5]} tick={{ fontSize: 11, fill: '#667085' }} />
                  <YAxis yAxisId="right" orientation="right" stroke={RESOLVED_COLOR} domain={[0, 100]} tick={{ fontSize: 11, fill: '#667085' }} />
                  <Tooltip
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
                    dataKey="avgPoliteness"
                    name="Average Politeness"
                    fill={BAR_CHART_COLOR_POLITENESS}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="resolutionRate"
                    name="Resolution Rate"
                    fill={RESOLVED_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-[#252A3A] dark:text-white mb-2">Best Performing Day</h4>
              {dayOfWeekAnalysis.length > 0 && (() => {
                const bestDay = [...dayOfWeekAnalysis]
                  .filter(day => day.count > 0)
                  .sort((a, b) => b.avgPoliteness - a.avgPoliteness)[0];
                
                return bestDay ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-[#252A3A] dark:text-white">{bestDay.name}</div>
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        Best Day
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <div className="text-[10px] text-blue-600 dark:text-blue-400">Avg. Politeness</div>
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{bestDay.avgPoliteness.toFixed(2)}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                        <div className="text-[10px] text-green-600 dark:text-green-400">Resolution Rate</div>
                        <div className="text-sm font-bold text-green-700 dark:text-green-300">{bestDay.resolutionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ) : <div className="text-xs text-[#667085] dark:text-gray-400">No data available</div>;
              })()}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-[#252A3A] dark:text-white mb-2">Needs Improvement</h4>
              {dayOfWeekAnalysis.length > 0 && (() => {
                const worstDay = [...dayOfWeekAnalysis]
                  .filter(day => day.count > 0)
                  .sort((a, b) => a.avgPoliteness - b.avgPoliteness)[0];
                
                return worstDay ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-[#252A3A] dark:text-white">{worstDay.name}</div>
                      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        Attention Required
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <div className="text-[10px] text-blue-600 dark:text-blue-400">Avg. Politeness</div>
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{worstDay.avgPoliteness.toFixed(2)}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                        <div className="text-[10px] text-green-600 dark:text-green-400">Resolution Rate</div>
                        <div className="text-sm font-bold text-green-700 dark:text-green-300">{worstDay.resolutionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ) : <div className="text-xs text-[#667085] dark:text-gray-400">No data available</div>;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatisfactionPage;

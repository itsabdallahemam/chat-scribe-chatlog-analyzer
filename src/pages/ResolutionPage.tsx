// src/pages/ResolutionPage.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';
import { 
  Download, CheckCircle, AlertTriangle, TrendingUp, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, BarChart2, Filter, 
  Search, X, Calendar, ArrowUpDown, MessageCircle, Tag, Gauge, Smile,
  FileText, Zap, Clock, Sun, Sunset, Moon, TrendingDown, ArrowRight
} from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { format, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
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
  shift?: string;
}

interface ColumnDefinition<TData extends object> {
  accessorKey: keyof TData | 'actions' | 'chatlogNumber';
  header: string | (() => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
}

interface TrendsDataItem {
  name: string;
  Resolved: number;
  Unresolved: number;
}

// Define consistent color scheme
const COLOR_SCHEME = {
  resolved: "#22c55e", // Green for resolved
  unresolved: "#FF80B5", // Pink for unresolved
  background: "#f5f7fa",
  cardBg: "#ffffff",
  darkBg: "#161925",
  darkCardBg: "#232534",
  textPrimary: "#252A3A",
  textSecondary: "#667085"
};

// Updated ScoreCard component to match the dashboard style
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
  <div className={`relative rounded-2xl shadow-sm p-5 min-h-[150px] flex flex-col justify-between bg-white dark:bg-gray-900 border ${gradient}`}>
    <div className="flex justify-between items-start">
      <div className="text-base font-medium text-[#252A3A] dark:text-white">{title}</div>
      <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <div className="text-3xl font-bold text-[#252A3A] dark:text-white">{value}</div>
      <div className="text-sm text-[#252A3A]/70 dark:text-gray-300 font-medium">{subtitle}</div>
    </div>
  </div>
);

const ResolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'unresolved' | 'resolved'>('overview');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);
  
  // Pagination state
  const ITEMS_PER_PAGE = 5; // Show 5 items per page
  const [currentPage, setCurrentPage] = useState(0);
  
  // Add filter states
  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'resolution', 
    direction: 'asc' 
  });

  // Update state variables for chat view
  const [expandedChatlogIndex, setExpandedChatlogIndex] = useState<number | null>(null);
  const [expandedTableChatlogIndex, setExpandedTableChatlogIndex] = useState<number | null>(null);
  const [expandedChatData, setExpandedChatData] = useState<EvaluationResultItem | null>(null);
  const [activeSection, setActiveSection] = useState<'needs-attention' | 'table' | null>(null);

  // Add shift filter state
  const [shiftFilter, setShiftFilter] = useState<string>('');

  // Function to handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(0); // Reset to first page when sorting
  };

  // Function to handle viewing a chat from the table
  const handleViewChat = (row: EvaluationResultItem) => {
    if (expandedTableChatlogIndex === row.originalIndex && activeSection === 'table') {
      // If already expanded, close it
      handleCloseChat();
    } else {
      // Otherwise, open it
      setExpandedTableChatlogIndex(row.originalIndex!);
      setExpandedChatlogIndex(null);
      setExpandedChatData(row);
      setActiveSection('table');
    }
  };

  // Function to handle closing the chat view
  const handleCloseChat = () => {
    setExpandedChatlogIndex(null);
    setExpandedTableChatlogIndex(null);
    setExpandedChatData(null);
    setActiveSection(null);
  };

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#f5f7fa] dark:bg-[#161925] text-[#252A3A] dark:text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-2">Resolution Details</h1>
          <h3 className="text-xl font-medium mb-4 mt-8">No Evaluation Results</h3>
          <p className="text-[#667085] dark:text-gray-400 mb-6">
            Please upload or paste chatlogs on the home page to see resolution details.
          </p>
          <Button onClick={() => navigate('/')} className="bg-[#22c55e] hover:bg-[#22c55e]/80 text-white">
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

  const resolvedLogs = useMemo(() => validResults.filter(item => item.resolution === 1), [validResults]);
  const unresolvedLogs = useMemo(() => validResults.filter(item => item.resolution === 0), [validResults]);
  const totalValidLogs = validResults.length;
  const resolutionRate = totalValidLogs > 0 ? (resolvedLogs.length / totalValidLogs) * 100 : 0;

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

  // Calculate scenario-based resolution rates
  const scenarioResolutionData = useMemo(() => {
    const scenarios = [...new Set(validResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = validResults.filter(item => item.scenario === scenario);
      const resolvedInScenario = scenarioLogs.filter(item => item.resolution === 1).length;
      const rate = scenarioLogs.length > 0 ? (resolvedInScenario / scenarioLogs.length) * 100 : 0;
      return { 
        name: scenario, 
        value: rate,
        count: scenarioLogs.length
      };
    });
  }, [validResults]);

  // Calculate time-based resolution rates if dateTime is available
  const timeBasedResolutionData = useMemo(() => {
    const dateGroups: Record<string, { total: number, resolved: number }> = {};
    
    validResults.forEach(item => {
      if (item.dateTime) {
        try {
          const date = new Date(item.dateTime);
          if (isValid(date)) {
            const dateStr = format(date, 'yyyy-MM-dd');
            if (!dateGroups[dateStr]) {
              dateGroups[dateStr] = { total: 0, resolved: 0 };
            }
            dateGroups[dateStr].total++;
            if (item.resolution === 1) {
              dateGroups[dateStr].resolved++;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });
    
    return Object.entries(dateGroups)
      .map(([date, data]) => ({
        date,
        resolutionRate: (data.resolved / data.total) * 100,
        total: data.total,
        resolved: data.resolved
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [validResults]);

  // Calculate shift-based resolution rates
  const shiftResolutionData = useMemo(() => {
    const shifts = [...new Set(validResults.filter(item => item.shift).map(item => item.shift))];
    return shifts.map(shift => {
      const shiftLogs = validResults.filter(item => item.shift === shift);
      const resolvedInShift = shiftLogs.filter(item => item.resolution === 1).length;
      const rate = shiftLogs.length > 0 ? (resolvedInShift / shiftLogs.length) * 100 : 0;
      return { 
        name: shift || 'Unknown', 
        value: rate,
        count: shiftLogs.length
      };
    }).sort((a, b) => b.value - a.value);
  }, [validResults]);

  // 1. Needs Attention logic for sidebar - focus on unresolved chatlogs
  const needsAttention = useMemo(() => {
    return unresolvedLogs
      .slice()
      .sort((a, b) => (a.coherence + a.politeness + a.relevance) - (b.coherence + b.politeness + b.relevance))
      .slice(0, 5);
  }, [unresolvedLogs]);

  // Handle export function
  const handleExport = useCallback((type: 'csv' | 'excel') => {
    let dataToExport = [];
    const tabTitle = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    
    if (activeTab === 'unresolved') {
      dataToExport = unresolvedLogs;
    } else if (activeTab === 'resolved') {
      dataToExport = resolvedLogs;
    } else {
      dataToExport = validResults;
    }
    
    if (type === 'csv') {
      exportToCSV(dataToExport, `${tabTitle}-chatlogs`);
      toast({ title: 'Exported', description: 'CSV file has been downloaded.' });
    } else {
      exportToExcel(dataToExport, `${tabTitle}-chatlogs`);
      toast({ title: 'Exported', description: 'Excel file has been downloaded.' });
    }
  }, [activeTab, unresolvedLogs, resolvedLogs, validResults, toast]);

  // Apply filters to the data
  const getFilteredData = (data: EvaluationResultItem[]) => {
    let filtered = [...data];
    
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
    
    // Apply shift filter
    if (shiftFilter) {
      filtered = filtered.filter(item => 
        item.shift === shiftFilter
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
  };

  // Get filtered data based on the active tab
  const filteredData = useMemo(() => {
    if (activeTab === 'unresolved') {
      return getFilteredData(unresolvedLogs);
    } else if (activeTab === 'resolved') {
      return getFilteredData(resolvedLogs);
    }
    return getFilteredData(validResults);
  }, [activeTab, unresolvedLogs, resolvedLogs, validResults, filterText, scenarioFilter, dateFilter, shiftFilter, sortConfig]);

  // Pagination logic
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset pagination when tab changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      {/* Page Header */}
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-[#22c55e] rounded-full text-white shadow-md">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">Resolution Analysis</h1>
            <p className="mt-1 text-[#667085] dark:text-gray-300">
              Deep dive into resolved and unresolved chatlogs across {validResults.length} conversations
            </p>
          </div>
        </div>
      </div>
      
      {/* Stat Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#D1FAE5] via-[#6EE7B7] to-[#34D399] dark:bg-gradient-to-r dark:from-emerald-900/60 dark:via-green-800/60 dark:to-teal-900/60 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Resolution Rate</h3>
            <div className="p-2 rounded-full bg-white/30 dark:bg-white/10">
              <CheckCircle className="w-5 h-5 text-[#22c55e] dark:text-green-400" />
              </div>
            </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
              {isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              {resolvedLogs.length} of {totalValidLogs} resolved
          </div>
        </div>
              </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 flex flex-col border border-gradient-to-r from-[#FFF8C9] via-[#FFEAA0] to-[#FFD166]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Total Chatlogs</h3>
            <div className="p-2 rounded-full bg-[#FFF6E9] dark:bg-amber-900/30">
              <MessageCircle className="w-5 h-5 text-[#D4A000] dark:text-yellow-400" />
            </div>
            </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
              {totalValidLogs}
          </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Total evaluated chatlogs
        </div>
              </div>
            </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 flex flex-col border border-gradient-to-r from-[#D1FAE5] via-[#6EE7B7] to-[#34D399]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Resolved</h3>
            <div className="p-2 rounded-full bg-[#ECFDF3] dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-[#22c55e] dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
              {resolvedLogs.length}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Successfully resolved chatlogs
            </div>
        </div>
      </div>
      
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 flex flex-col border border-gradient-to-r from-[#F8E3FF] via-[#FFD1DC] to-[#FFC6D3]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-[#252A3A] dark:text-white">Unresolved</h3>
            <div className="p-2 rounded-full bg-[#FFECEB] dark:bg-rose-900/30">
              <AlertTriangle className="w-5 h-5 text-[#FF80B5] dark:text-pink-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-[#252A3A] dark:text-white">
              {unresolvedLogs.length}
            </div>
            <div className="text-sm text-[#252A3A]/70 dark:text-white/70">
              Unresolved chatlogs
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Main Content - 9 columns */}
        <div className="lg:col-span-9 space-y-4">
          {/* Tabs Card */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'overview' | 'unresolved' | 'resolved')} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-[#22c55e] data-[state=active]:text-white"
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="unresolved" 
                  className="data-[state=active]:bg-[#FF80B5] data-[state=active]:text-white"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Unresolved
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="data-[state=active]:bg-[#22c55e] data-[state=active]:text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolved
                </TabsTrigger>
                  </TabsList>
              
              {/* Tab Content */}
              <TabsContent value="overview" className="mt-0">
                <div className="text-lg font-semibold text-[#252A3A] dark:text-white mb-4">
                  Resolution Overview
                </div>

                {/* Resolution Progress */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white">Resolution Progress</div>
                    <div className="text-sm text-[#667085] dark:text-gray-400">{resolvedLogs.length} of {totalValidLogs} resolved</div>
                  </div>
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#22c55e] dark:bg-[#22c55e]/80 transition-all duration-500"
                      style={{ width: `${resolutionRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-[#667085] dark:text-gray-400">
                    <div>0%</div>
                    <div>50%</div>
                    <div>100%</div>
                  </div>
                </div>
                
                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Resolution Distribution */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">Resolution Distribution</div>
                    <div className="h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Resolved', value: resolvedLogs.length },
                              { name: 'Unresolved', value: unresolvedLogs.length }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill="#fff"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize={16}
                                  fontWeight="bold"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            <Cell fill={COLOR_SCHEME.resolved} />
                            <Cell fill={COLOR_SCHEME.unresolved} />
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            contentStyle={{
                              background: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                          {/* Remove <Legend /> */}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Resolution by Scenario - Improved */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">Resolution by Scenario</div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={scenarioResolutionData
                            .sort((a, b) => b.value - a.value) // Sort by resolution rate descending
                            .slice(0, 5)} // Show only top 5 for clarity
                          margin={{ top: 5, right: 30, left: 0, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Resolution Rate']}
                            labelFormatter={(name) => name.length > 25 ? `${name.substring(0, 25)}...` : name}
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            name="Resolution Rate" 
                            fill={COLOR_SCHEME.resolved} 
                            radius={[4, 4, 0, 0]} 
                          >
                            {scenarioResolutionData.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value > 75 ? '#22c55e' : entry.value > 50 ? '#D4A000' : '#FF80B5'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Time-based Resolution Chart */}
                {timeBasedResolutionData.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">Resolution Rate Over Time</div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timeBasedResolutionData}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(value) => {
                              try {
                                const date = new Date(value);
                                return format(date, 'MMM d');
                              } catch (e) {
                                return value;
                              }
                            }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Resolution Rate']}
                            labelFormatter={(date) => {
                              try {
                                return format(new Date(date), 'MMMM d, yyyy');
                              } catch (e) {
                                return date;
                              }
                            }}
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="resolutionRate" 
                            name="Resolution Rate" 
                            stroke={COLOR_SCHEME.resolved} 
                            strokeWidth={2} 
                            dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Shift-based Resolution Chart */}
                {shiftResolutionData.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-[#252A3A] dark:text-white mb-2">Resolution by Shift</div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={shiftResolutionData}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#667085' }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 11, fill: '#667085' }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Resolution Rate']}
                            contentStyle={{ 
                              background: 'white', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            name="Resolution Rate" 
                            radius={[4, 4, 0, 0]} 
                          >
                            {shiftResolutionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.name === 'Morning' ? '#22c55e' : 
                                entry.name === 'Afternoon' ? '#D4A000' : 
                                entry.name === 'Evening' ? '#4582ff' : 
                                '#FF80B5'
                              } />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Top and Bottom Performing Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Performing Scenarios */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <div className="text-sm font-medium text-[#252A3A] dark:text-white">Top Performing Scenarios</div>
                    </div>
                    <div className="space-y-3">
                      {scenarioResolutionData
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 3)
                        .map((scenario, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800/60 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-xs font-medium text-[#252A3A] dark:text-white truncate pr-2" title={scenario.name}>
                                {scenario.name.length > 25 ? `${scenario.name.substring(0, 25)}...` : scenario.name}
                              </div>
                              <div className="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                                {scenario.value.toFixed(1)}%
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full bg-green-500 dark:bg-green-400" 
                                style={{ width: `${scenario.value}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
                              {scenario.count} chatlogs
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Bottom Performing Scenarios */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                      <div className="text-sm font-medium text-[#252A3A] dark:text-white">Needs Improvement</div>
                    </div>
                    <div className="space-y-3">
                      {scenarioResolutionData
                        .filter(scenario => scenario.count >= 3) // Only include scenarios with enough data
                        .sort((a, b) => a.value - b.value)
                        .slice(0, 3)
                        .map((scenario, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800/60 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-xs font-medium text-[#252A3A] dark:text-white truncate pr-2" title={scenario.name}>
                                {scenario.name.length > 25 ? `${scenario.name.substring(0, 25)}...` : scenario.name}
                              </div>
                              <div className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded text-xs font-medium">
                                {scenario.value.toFixed(1)}%
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full bg-red-500 dark:bg-red-400" 
                                style={{ width: `${scenario.value}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[#667085] dark:text-gray-400 mt-1">
                              {scenario.count} chatlogs
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
                  <TabsContent value="unresolved" className="mt-0">
                <div className="text-lg font-semibold text-[#252A3A] dark:text-white mb-4">
                              Unresolved Chatlogs
                </div>
                
                {/* Filters Section */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-8 text-xs border-[#4582ff] text-[#4582ff]"
                      >
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleExport('csv')}
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs border-[#4582ff] text-[#4582ff]"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800/60 rounded-lg">
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
                        
                        {/* Shift Filter */}
                        <select
                          value={shiftFilter}
                          onChange={(e) => setShiftFilter(e.target.value)}
                          className="flex-1 min-w-[150px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                        >
                          <option value="">All Shifts</option>
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                        </select>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setFilterText('');
                            setScenarioFilter('');
                            setDateFilter('');
                            setShiftFilter('');
                          }}
                          className="whitespace-nowrap border-gray-200 dark:border-gray-700"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Table Section */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/80">
                                <table className="w-full caption-bottom text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('originalIndex')}>
                              <span>Chatlog #</span>
                              {sortConfig.key === 'originalIndex' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                                        </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('scenario')}>
                              <Tag className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>Scenario</span>
                              {sortConfig.key === 'scenario' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('dateTime')}>
                              <Calendar className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>Date & Time</span>
                              {sortConfig.key === 'dateTime' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('coherence')}>
                              <Gauge className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>C</span>
                              {sortConfig.key === 'coherence' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('politeness')}>
                              <Smile className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>P</span>
                              {sortConfig.key === 'politeness' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('relevance')}>
                              <MessageCircle className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>R</span>
                              {sortConfig.key === 'relevance' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-center align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            Actions
                          </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((row) => (
                            <tr 
                              key={row.originalIndex} 
                              className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 ${
                                expandedTableChatlogIndex === row.originalIndex ? 'bg-[#EEF4FF] dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <td className="p-3 align-middle text-xs text-center">
                                #{row.originalIndex !== undefined ? row.originalIndex + 1 : 'N/A'}
                                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className="max-w-[200px] truncate font-medium text-[#252A3A] dark:text-white">
                                  {row.scenario ? 
                                    row.scenario.length > 25 
                                      ? `${row.scenario.substring(0, 25)}...` 
                                      : row.scenario 
                                    : "Unnamed Scenario"}
                                </div>
                                              </td>
                              <td className="p-3 align-middle text-xs">
                                {row.dateTime ? (
                                  (() => {
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
                                  })()
                                ) : (
                                  <span className="text-[#667085] dark:text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.coherence <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.coherence === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.coherence.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.politeness <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.politeness === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.politeness.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.relevance <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.relevance === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.relevance.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewChat(row)}
                                  className="border-[#247BA0] text-[#247BA0] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg h-8"
                                >
                                  {expandedTableChatlogIndex === row.originalIndex && activeSection === 'table' ? (
                                    <>
                                      <X className="h-3.5 w-3.5 mr-1.5" />
                                      Hide Chat
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                      View Chat
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                                      ))
                                    ) : (
                                      <tr>
                            <td colSpan={7} className="p-4 h-16 text-center text-[#667085] dark:text-gray-400 text-xs">
                              No unresolved chatlogs found for this filter.
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
                        Showing {startIndex + 1} to {endIndex} of {filteredData.length}
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
                
                {/* Chat View Panel */}
                {expandedChatData && activeSection === 'table' && (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mt-4">
                    <div className="bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 border-b border-gray-200 dark:border-gray-700">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseChat}
                          className="h-6 w-6 p-0 text-[#667085]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        <ChatBubbleView chatlogText={expandedChatData.chatlog} />
                      </div>
                    </div>
                  </div>
                )}
                  </TabsContent>

                  <TabsContent value="resolved" className="mt-0">
                <div className="text-lg font-semibold text-[#252A3A] dark:text-white mb-4">
                              Resolved Chatlogs
                </div>
                
                {/* Filters Section */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-8 text-xs border-[#4582ff] text-[#4582ff]"
                      >
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleExport('csv')}
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs border-[#4582ff] text-[#4582ff]"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800/60 rounded-lg">
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
                        
                        {/* Shift Filter */}
                        <select
                          value={shiftFilter}
                          onChange={(e) => setShiftFilter(e.target.value)}
                          className="flex-1 min-w-[150px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                        >
                          <option value="">All Shifts</option>
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                        </select>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setFilterText('');
                            setScenarioFilter('');
                            setDateFilter('');
                            setShiftFilter('');
                          }}
                          className="whitespace-nowrap border-gray-200 dark:border-gray-700"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Table Section */}
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/80">
                                <table className="w-full caption-bottom text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('originalIndex')}>
                              <span>Chatlog #</span>
                              {sortConfig.key === 'originalIndex' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                                        </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('scenario')}>
                              <Tag className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>Scenario</span>
                              {sortConfig.key === 'scenario' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('dateTime')}>
                              <Calendar className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>Date & Time</span>
                              {sortConfig.key === 'dateTime' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('coherence')}>
                              <Gauge className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>C</span>
                              {sortConfig.key === 'coherence' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('politeness')}>
                              <Smile className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>P</span>
                              {sortConfig.key === 'politeness' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-left align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('relevance')}>
                              <MessageCircle className="h-4 w-4 mr-1 text-[#667085]" />
                              <span>R</span>
                              {sortConfig.key === 'relevance' && (
                                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="h-9 px-4 text-center align-middle font-medium text-[#667085] dark:text-gray-400 text-xs">
                            Actions
                          </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((row) => (
                            <tr 
                              key={row.originalIndex} 
                              className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 ${
                                expandedTableChatlogIndex === row.originalIndex ? 'bg-[#EEF4FF] dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <td className="p-3 align-middle text-xs text-center">
                                #{row.originalIndex !== undefined ? row.originalIndex + 1 : 'N/A'}
                                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className="max-w-[200px] truncate font-medium text-[#252A3A] dark:text-white">
                                  {row.scenario ? 
                                    row.scenario.length > 25 
                                      ? `${row.scenario.substring(0, 25)}...` 
                                      : row.scenario 
                                    : "Unnamed Scenario"}
                                </div>
                                              </td>
                              <td className="p-3 align-middle text-xs">
                                {row.dateTime ? (
                                  (() => {
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
                                  })()
                                ) : (
                                  <span className="text-[#667085] dark:text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.coherence <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.coherence === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.coherence.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.politeness <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.politeness === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.politeness.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs">
                                <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1 rounded-md text-sm ${
                                  row.relevance <= 2 ? 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/60 dark:text-rose-200' : 
                                  row.relevance === 3 ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/60 dark:text-amber-200' : 
                                  'bg-[#ECFDF3] text-[#22c55e] dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}>
                                  {row.relevance.toFixed(1)}
                                </div>
                              </td>
                              <td className="p-3 align-middle text-xs text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewChat(row)}
                                  className="border-[#247BA0] text-[#247BA0] hover:bg-[#EEF4FF] text-xs font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/30 rounded-lg h-8"
                                >
                                  {expandedTableChatlogIndex === row.originalIndex && activeSection === 'table' ? (
                                    <>
                                      <X className="h-3.5 w-3.5 mr-1.5" />
                                      Hide Chat
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                      View Chat
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                                      ))
                                    ) : (
                                      <tr>
                            <td colSpan={7} className="p-4 h-16 text-center text-[#667085] dark:text-gray-400 text-xs">
                              No resolved chatlogs found for this filter.
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
                        Showing {startIndex + 1} to {endIndex} of {filteredData.length}
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
                
                {/* Chat View Panel */}
                {expandedChatData && activeSection === 'table' && (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 mt-4">
                    <div className="bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 border-b border-gray-200 dark:border-gray-700">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseChat}
                          className="h-6 w-6 p-0 text-[#667085]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                                        </div>
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        <ChatBubbleView chatlogText={expandedChatData.chatlog} />
                      </div>
                    </div>
                </div>
                )}
                  </TabsContent>
              </Tabs>
          </div>
        </div>
        
        {/* Sidebar - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Resolution Insights Card - Replacing Needs Attention */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Resolution Insights</h3>
                <div className="text-xs text-[#667085] dark:text-gray-400">
                  Key metrics and trends
                                        </div>
              </div>
              <div className="p-1.5 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
                <TrendingUp className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-4">
              {/* Resolution Rate Trend */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                <div className="text-xs font-medium text-[#252A3A] dark:text-white mb-1">Resolution Rate Trend</div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                    {isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`}
                  </div>
                  <div className={`flex items-center text-xs font-medium ${
                    resolutionRate >= 75 ? 'text-green-600 dark:text-green-400' : 
                    resolutionRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {resolutionRate >= 75 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        Good
                      </>
                    ) : resolutionRate >= 50 ? (
                      <>
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                        Average
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 mr-1" />
                        Needs Improvement
                      </>
                    )}
                  </div>
                      </div>
                    </div>

              {/* Top Performing Scenario */}
              {scenarioResolutionData.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs font-medium text-[#252A3A] dark:text-white mb-1">Top Performing Scenario</div>
                  <div className="text-sm font-medium text-[#252A3A] dark:text-white truncate" title={scenarioResolutionData[0].name}>
                    {scenarioResolutionData[0].name}
                                        </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-[#667085] dark:text-gray-400">
                      {scenarioResolutionData[0].count} chatlogs
                      </div>
                    <div className="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                      {scenarioResolutionData[0].value.toFixed(1)}%
                    </div>
                </div>
        </div>
              )}
              
              {/* Shift Performance */}
              {shiftResolutionData.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs font-medium text-[#252A3A] dark:text-white mb-1">Shift Performance</div>
                  <div className="space-y-2 mt-2">
                    {shiftResolutionData.map((shift, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {shift.name === 'Morning' ? (
                            <Sun className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          ) : shift.name === 'Afternoon' ? (
                            <Sunset className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                          ) : (
                            <Moon className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                          )}
                          <span className="text-xs font-medium text-[#252A3A] dark:text-white">{shift.name}</span>
                        </div>
                        <div className={`text-xs font-medium ${
                          shift.value >= 75 ? 'text-green-600 dark:text-green-400' : 
                          shift.value >= 50 ? 'text-amber-600 dark:text-amber-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {shift.value.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
              )}
              
              {/* Recent Resolution Progress */}
              {timeBasedResolutionData.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                  <div className="text-xs font-medium text-[#252A3A] dark:text-white mb-1">Recent Resolution Progress</div>
                  <div className="h-[80px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeBasedResolutionData.slice(-7)} // Show last 7 days
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <Line 
                          type="monotone" 
                          dataKey="resolutionRate" 
                          stroke="#22c55e" 
                          strokeWidth={2} 
                          dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                        <Tooltip
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Resolution Rate']}
                          labelFormatter={(date) => {
                            try {
                              return format(new Date(date), 'MMM d');
                            } catch (e) {
                              return date;
                            }
                          }}
                          contentStyle={{ 
                            background: 'white', 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            fontSize: '10px'
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
              </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-5 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#252A3A] dark:text-white">Quick Navigation</h3>
              <div className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                <Zap className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
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
                  onClick={() => navigate('/cpr-details')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-700 justify-start text-sm"
                >
                  <Gauge className="w-4 h-4 mr-2 text-[#8884d8]" />
                  CPR Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolutionPage;

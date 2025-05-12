// src/pages/CPRDetailsPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// DataTable import is removed as we'll build the table manually for chat bubbles
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView'; // Import your ChatBubbleView
import { Gauge, Smile, MessageCircle, Download, CheckCircle, BarChart2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

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
  originalIndex?: number; // For managing expanded state in tables
}

interface ScoreDistributionDataItem {
  name: string;
  count: number;
}

// Column definition for our manual table
interface ColumnDefinition<TData extends object> {
  accessorKey: keyof TData | 'actions'; // 'actions' for non-data columns like view button
  header: string | (() => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
  // size?: number; // Optional: if you want to hint at column widths
}

// ExpandableChatlog component (assuming it's in ChatBubbleView.tsx or defined here)
// If it's imported, you don't need to redefine it.
// const ExpandableChatlog: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 100 }) => { ... };

// Add ScoreCard component at the top (if not already present)
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

const CPRDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'coherence' | 'politeness' | 'relevance'>('coherence');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);
  const [scoreFilter, setScoreFilter] = useState<string>('');
  const [resolutionFilter, setResolutionFilter] = useState<string>('');
  
  // Add pagination state
  const ITEMS_PER_PAGE = 5; // Show 5 items per page
  const [currentPage, setCurrentPage] = useState(0);

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-app-bg text-app-text">
        <div className="max-w-md text-center">
          <PageTitle title="CPR Details" description="No evaluations yet." />
          <h3 className="text-xl font-medium mb-4 mt-8">No Evaluation Results</h3>
          <p className="text-muted-foreground mb-6">
            Please upload or paste chatlogs on the home page to see CPR details.
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

  const metricGradients: Record<string, string> = {
    coherence: 'bg-gradient-to-br from-[#f8e3ff] via-[#ffd1dc] to-[#ffd6d6]',
    politeness: 'bg-gradient-to-br from-[#d4e7fe] via-[#b6ccfe] to-[#b0e5e9]',
    relevance: 'bg-gradient-to-br from-[#d1fae5] via-[#6ee7b7] to-[#34d399]',
    resolution: 'bg-gradient-to-br from-[#fff8c9] via-[#ffeaa0] to-[#ffd166]',
  };
  const metricIcons: Record<string, React.ReactNode> = {
    coherence: <Gauge className="w-6 h-6 text-[#0A2463]" />,
    politeness: <Smile className="w-6 h-6 text-[#247BA0]" />,
    relevance: <MessageCircle className="w-6 h-6 text-[#FFD166]" />,
    resolution: <CheckCircle className="w-6 h-6 text-[#2B2D42]" />,
  };

  // Quick filter logic
  const filteredResults = useMemo(() => {
    return validResults.filter(item =>
      (!scoreFilter || Math.round(item[activeTab]) === Number(scoreFilter)) &&
      (!resolutionFilter || String(item.resolution) === resolutionFilter)
    );
  }, [validResults, scoreFilter, resolutionFilter, activeTab]);

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
      accessorKey: metric,
      header: metric.charAt(0).toUpperCase() + metric.slice(1),
      cell: (row: EvaluationResultItem) => {
        const score = row[metric];
        return <div className={`text-center font-medium p-2 rounded-md w-20 mx-auto ${score <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200' : score === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200' : 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200'}`}>{typeof score === 'number' && !isNaN(score) ? score.toFixed(0) : 'N/A'}</div>;
      }
    },
    {
      accessorKey: 'resolution',
      header: 'Resolution',
      cell: (row: EvaluationResultItem) => (
        <div className={`text-center font-medium p-2 rounded-md w-20 mx-auto ${row.resolution === 1 ? 'bg-green-50 text-green-700 dark:bg-green-800/70 dark:text-green-200' : 'bg-red-50 text-red-700 dark:bg-red-800/70 dark:text-red-200'}`}>{row.resolution === 1 ? 'Resolved' : 'Unresolved'}</div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'View Chat',
      cell: (row: EvaluationResultItem) => (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedChatlog(expandedChatlog && expandedChatlog.tab === metric && expandedChatlog.originalIndex === row.originalIndex ? null : { tab: metric, originalIndex: row.originalIndex! })}
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white dark:bg-app-blue/80 dark:text-white dark:border-app-blue dark:hover:bg-app-blue/60"
          >
            {expandedChatlog?.tab === metric && expandedChatlog?.originalIndex === row.originalIndex ? 'Hide' : 'View'}
          </Button>
        </div>
      )
    }
  ];

  // Stat card values
  const statCards = [
    {
      title: 'Coherence',
      value: isNaN(avgScores.coherence) ? 'N/A' : avgScores.coherence.toFixed(2),
      subtitle: 'Avg. Score',
      gradient: metricGradients.coherence,
      icon: metricIcons.coherence,
    },
    {
      title: 'Politeness',
      value: isNaN(avgScores.politeness) ? 'N/A' : avgScores.politeness.toFixed(2),
      subtitle: 'Avg. Score',
      gradient: metricGradients.politeness,
      icon: metricIcons.politeness,
    },
    {
      title: 'Relevance',
      value: isNaN(avgScores.relevance) ? 'N/A' : avgScores.relevance.toFixed(2),
      subtitle: 'Avg. Score',
      gradient: metricGradients.relevance,
      icon: metricIcons.relevance,
    },
  ];

  // 1. Needs Attention logic for sidebar
  const needsAttention = useMemo(() => {
    return validResults
      .slice()
      .sort((a, b) => a[activeTab] - b[activeTab])
      .slice(0, 5);
  }, [validResults, activeTab]);

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

  // Handle page change - reset to first page when filters or active tab changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [scoreFilter, resolutionFilter, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">CPR Details Overview</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Detailed analysis of Coherence, Politeness, and Relevance metrics across all evaluated chatlogs.</p>
      </div>
      
      {/* Stat Cards - Full Width Row */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto mb-8">
        <div className="col-span-12 md:col-span-4">
          <ScoreCard {...statCards[0]} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <ScoreCard {...statCards[1]} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <ScoreCard {...statCards[2]} />
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Metric Details Card */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl overflow-hidden h-full">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">CPR Metric Details</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Explore chatlogs and score distributions for each metric
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'coherence' | 'politeness' | 'relevance')} className="w-full">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <TabsList className="grid w-full grid-cols-3 bg-card border rounded-lg shadow-sm">
                    <TabsTrigger value="coherence" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Coherence</TabsTrigger>
                    <TabsTrigger value="politeness" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Politeness</TabsTrigger>
                    <TabsTrigger value="relevance" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Relevance</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="p-6">
                  {/* Score Breakdown - Current Metric */}
                  <div className="grid grid-cols-12 gap-4 mb-6">
                    <div className="col-span-12">
                      <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                        <CardHeader className="pb-0 pt-4">
                          <CardTitle className="text-base font-medium text-app-text dark:text-white">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Score Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-300">{scoreBreakdown.low.count}</div>
                              <div className="text-sm text-gray-700 dark:text-gray-200">Low (1-2)</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{scoreBreakdown.low.pct.toFixed(1)}%</div>
                            </div>
                            <div className="flex-1 text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{scoreBreakdown.medium.count}</div>
                              <div className="text-sm text-gray-700 dark:text-gray-200">Medium (3)</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{scoreBreakdown.medium.pct.toFixed(1)}%</div>
                            </div>
                            <div className="flex-1 text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-300">{scoreBreakdown.high.count}</div>
                              <div className="text-sm text-gray-700 dark:text-gray-200">High (4-5)</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{scoreBreakdown.high.pct.toFixed(1)}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Score Distribution Chart */}
                  <div className="grid grid-cols-12 gap-4 mb-6">
                    <div className="col-span-12">
                      <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                        <CardHeader className="pb-0 pt-4">
                          <CardTitle className="text-base font-medium text-app-text dark:text-white">
                            Score Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributions[activeTab]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium">Score: {label}</p>
                                        <p className="text-sm">Count: {payload[0].value as number}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="count" 
                                fill={activeTab === 'coherence' ? '#8884d8' : (activeTab === 'politeness' ? '#247BA0' : '#34d399')} 
                                radius={[4, 4, 0, 0]} 
                                name="Count" 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Trends Chart */}
                  <div className="grid grid-cols-12 gap-4 mb-6">
                    <div className="col-span-12">
                      <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                        <CardHeader className="pb-0 pt-4">
                          <CardTitle className="text-base font-medium text-app-text dark:text-white">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium">Group: {label}</p>
                                        <p className="text-sm">Avg Score: {(payload[0].value as number).toFixed(1)}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="avg" 
                                fill={activeTab === 'coherence' ? '#8884d8' : (activeTab === 'politeness' ? '#247BA0' : '#34d399')} 
                                radius={[4, 4, 0, 0]} 
                                name="Avg. Score" 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Chatlog Table */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                      <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                        <CardHeader className="pb-0 pt-4 flex flex-row justify-between items-center flex-wrap gap-2">
                          <CardTitle className="text-base font-medium text-app-text dark:text-white">
                            Chatlog Details
                          </CardTitle>
                          
                          <div className="flex flex-wrap gap-3 items-center">
                            <div>
                              <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                                <option value="">All Scores</option>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                            <div>
                              <select value={resolutionFilter} onChange={e => setResolutionFilter(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                                <option value="">All Resolution</option>
                                <option value="1">Resolved</option>
                                <option value="0">Unresolved</option>
                              </select>
                            </div>
                            <Button 
                              onClick={() => handleExport('csv')}
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-4 pb-2 px-0">
                          <div className="rounded-md overflow-hidden">
                            <div className="[&_th]:bg-gray-50 dark:[&_th]:bg-gray-800/80 [&_th]:text-gray-500 dark:[&_th]:text-gray-300 [&_th]:font-medium [&_th]:text-xs [&_th]:border-gray-200 dark:[&_th]:border-gray-700 [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-gray-50/80 dark:[&_tr:hover]:bg-gray-800/30">
                              <table className="w-full caption-bottom text-sm">
                                <thead>
                                  <tr>
                                    {getColumnsForMetric(activeTab).map((columnDef) => (
                                      <th key={String(columnDef.accessorKey)} className="h-10 px-4 text-left align-middle">
                                        {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {paginatedResults.length > 0 ? (
                                    paginatedResults.map((rowItem, rowIndex) => (
                                      <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                                        <tr className="border-b transition-colors">
                                          {getColumnsForMetric(activeTab).map((columnDef) => (
                                            <td key={String(columnDef.accessorKey)} className="p-2 align-middle">
                                              {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                            </td>
                                          ))}
                                        </tr>
                                        {expandedChatlog?.tab === activeTab && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                          <tr key={rowItem.originalIndex + '-expanded'} className="bg-gray-50/80 dark:bg-gray-800/30">
                                            <td colSpan={getColumnsForMetric(activeTab).length} className="p-2 border-t">
                                              <ChatBubbleView chatlogText={rowItem.chatlog} />
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={getColumnsForMetric(activeTab).length} className="p-4 h-24 text-center text-muted-foreground">
                                        No chatlogs found for this filter.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Pagination Controls */}
                          {pageCount > 1 && (
                            <div className="flex items-center justify-between mt-4 px-4 pt-2 pb-2 border-t dark:border-gray-700">
                              <div className="text-sm text-muted-foreground">
                                Page {currentPage + 1} of {pageCount}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({startIndex + 1}-{endIndex} of {filteredResults.length})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(0)}
                                  disabled={currentPage === 0}
                                  className="dark:border-gray-700 h-8 w-8 p-0"
                                >
                                  <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                  disabled={currentPage === 0}
                                  className="dark:border-gray-700"
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />
                                  Prev
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(pageCount - 1, prev + 1))}
                                  disabled={currentPage >= pageCount - 1}
                                  className="dark:border-gray-700"
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(pageCount - 1)}
                                  disabled={currentPage >= pageCount - 1}
                                  className="dark:border-gray-700 h-8 w-8 p-0"
                                >
                                  <ChevronsRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          {/* Needs Attention Card */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Needs Attention</CardTitle>
              <CardDescription className="text-sm text-app-text-secondary dark:text-gray-300">
                Lowest scoring {activeTab} chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                {needsAttention.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No data available</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {needsAttention.map((item, idx) => (
                      <div key={item.originalIndex} className="flex justify-between items-center py-2.5 px-1">
                        <div className="text-sm">Chatlog #{item.originalIndex! + 1}</div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          item[activeTab] <= 2 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' 
                            : item[activeTab] === 3 
                              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300' 
                              : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                        }`}>
                          {item[activeTab].toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Scenario Performance Card */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Scenario Performance</CardTitle>
              <CardDescription className="text-sm text-app-text-secondary dark:text-gray-300">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} scores by scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                {scenarioMetrics.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No scenario data available</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {scenarioMetrics.map((scenario) => (
                      <div key={scenario.name} className="py-2.5 px-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-medium truncate max-w-[70%]" title={scenario.name}>
                            {scenario.name}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            scenario[activeTab] <= 2 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' 
                              : scenario[activeTab] === 3 
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300' 
                                : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                          }`}>
                            {scenario[activeTab].toFixed(1)}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (scenario[activeTab] / 5) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {scenario.count} chatlog{scenario.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-md mt-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  <BarChart2 className="w-4 h-4 mr-2 text-indigo-500" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/satisfaction')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  <Smile className="w-4 h-4 mr-2 text-indigo-500" />
                  Satisfaction
                </Button>
                <Button 
                  onClick={() => navigate('/resolution-details')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                  Resolution
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CPRDetailsPage;

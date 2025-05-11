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
import { Gauge, Smile, MessageCircle, Download, CheckCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">CPR Details Overview</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Detailed analysis of Coherence, Politeness, and Relevance metrics across all evaluated chatlogs.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Main Content (2 columns) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Tabs for CPR metrics */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">CPR Metric Details</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Explore chatlogs and score distributions for each metric
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as 'coherence' | 'politeness' | 'relevance'); setScoreFilter(''); setResolutionFilter(''); }} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-card border rounded-lg shadow-sm mb-6">
                  <TabsTrigger value="coherence" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Coherence</TabsTrigger>
                  <TabsTrigger value="politeness" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Politeness</TabsTrigger>
                  <TabsTrigger value="relevance" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Relevance</TabsTrigger>
                </TabsList>
                {/* Stat Card for selected metric */}
                <div className="mb-8">
                  <ScoreCard {...statCards[{coherence: 0, politeness: 1, relevance: 2}[activeTab]]} />
                  {/* Score Breakdown Card */}
                  <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/90 dark:border-gray-700 shadow p-6 mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-app-text dark:text-white">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-300">{scoreBreakdown.low.count}</div>
                          <div className="text-sm text-muted-foreground dark:text-gray-200">Low (1-2)</div>
                          <div className="text-xs text-muted-foreground dark:text-gray-400">{scoreBreakdown.low.pct.toFixed(1)}%</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-200">{scoreBreakdown.medium.count}</div>
                          <div className="text-sm text-muted-foreground dark:text-gray-200">Medium (3)</div>
                          <div className="text-xs text-muted-foreground dark:text-gray-400">{scoreBreakdown.medium.pct.toFixed(1)}%</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-300">{scoreBreakdown.high.count}</div>
                          <div className="text-sm text-muted-foreground dark:text-gray-200">High (4-5)</div>
                          <div className="text-xs text-muted-foreground dark:text-gray-400">{scoreBreakdown.high.pct.toFixed(1)}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Distribution Chart */}
                <div className="mb-8">
                  <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/80 shadow p-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-app-text dark:text-white">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] md:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributions[activeTab]} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="name" name="Score" stroke="hsl(var(--foreground))" fontSize={12} />
                          <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} label={{ value: 'Chatlog Count', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))'} }}/>
                          <Tooltip wrapperStyle={{ color: '#333', fontSize: '12px' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                          <Bar dataKey="count" fill={activeTab === 'coherence' ? '#fdd7e8' : activeTab === 'politeness' ? '#c3d8fe' : '#bdeff2'} name="Count" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                {/* Quick Filters and Export */}
                <div className="flex flex-wrap gap-4 mb-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Score</label>
                    <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                      <option value="">All</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Resolution</label>
                    <select value={resolutionFilter} onChange={e => setResolutionFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                      <option value="">All</option>
                      <option value="1">Resolved</option>
                      <option value="0">Unresolved</option>
                    </select>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                      <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
                      <Download className="h-4 w-4 mr-2" /> Export Excel
                    </Button>
                  </div>
                </div>
                {/* Chatlogs Table */}
                <div className="rounded-2xl border border-border/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 shadow-md overflow-hidden">
                  <div className="[&_th]:bg-white/60 dark:[&_th]:bg-gray-900/80 [&_th]:text-muted-foreground dark:[&_th]:text-gray-100 [&_th]:font-medium [&_th]:text-base [&_th]:border-border/40 dark:[&_th]:border-gray-700 [&_td]:border-border/40 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-white/80 dark:[&_tr:hover]:bg-gray-800/60">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr>
                          {getColumnsForMetric(activeTab).map((columnDef) => (
                            <th key={String(columnDef.accessorKey)} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.length > 0 ? (
                          filteredResults.map((rowItem, rowIndex) => (
                            <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                {getColumnsForMetric(activeTab).map((columnDef) => (
                                  <td key={String(columnDef.accessorKey)} className="p-4 align-middle">
                                    {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                  </td>
                                ))}
                              </tr>
                              {expandedChatlog?.tab === activeTab && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                <tr key={rowItem.originalIndex + '-expanded'} className="bg-muted/50">
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
                {/* Trends tab for each metric */}
                <TabsContent value={activeTab + '-trends'}>
                  <Card className="rounded-2xl border-0 bg-white/60 shadow p-6 mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-app-text">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] md:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendsData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="name" name="Group" stroke="hsl(var(--foreground))" fontSize={12} />
                          <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} label={{ value: 'Avg. Score', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))'} }}/>
                          <Tooltip wrapperStyle={{ color: '#333', fontSize: '12px' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                          <Bar dataKey="avg" fill="#8884d8" name="Avg. Score" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar (1 column) */}
        <div className="flex flex-col gap-8">
          {/* Quick Actions */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">Navigate to other views</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-4 bg-white/70 dark:bg-gray-900/60 rounded-2xl p-4 shadow-sm">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/satisfaction')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Customer Satisfaction
                </Button>
                <Button 
                  onClick={() => navigate('/resolution-details')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Resolution Details
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Needs Attention card */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Needs Attention</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">Lowest scoring chatlogs for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2 bg-white/70 dark:bg-gray-900/60 rounded-2xl p-4 shadow-sm">
                {needsAttention.length === 0 ? (
                  <span className="text-base text-muted-foreground">No chatlogs need attention.</span>
                ) : (
                  needsAttention.map((item, idx) => (
                    <div key={item.originalIndex} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="text-base font-medium text-app-text-secondary">Chatlog #{item.originalIndex! + 1}</span>
                      <span className="text-base font-semibold text-red-600">Score: {item[activeTab].toFixed(1)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Scenario Performance Chart */}
      <Card className="mb-8 mt-12">
        <CardHeader>
          <CardTitle>Performance by Scenario</CardTitle>
          <CardDescription>Average scores across different scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scenarioMetrics}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold">{label}</p>
                          <p className="text-sm">Coherence: {data.coherence.toFixed(1)}</p>
                          <p className="text-sm">Politeness: {data.politeness.toFixed(1)}</p>
                          <p className="text-sm">Relevance: {data.relevance.toFixed(1)}</p>
                          <p className="text-sm">Total Chatlogs: {data.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="coherence" name="Coherence" fill="#0A2463" />
                <Bar dataKey="politeness" name="Politeness" fill="#FFD166" />
                <Bar dataKey="relevance" name="Relevance" fill="#247BA0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="coherence" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coherence">Coherence</TabsTrigger>
          <TabsTrigger value="politeness">Politeness</TabsTrigger>
          <TabsTrigger value="relevance">Relevance</TabsTrigger>
        </TabsList>

        <TabsContent value="coherence">
          <Card>
            <CardHeader>
              <CardTitle>Low Scoring Chatlogs by Scenario</CardTitle>
              <CardDescription>Detailed view of chatlog coherence scores. Use the selector to filter by score.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Score</label>
                <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                  <option value="">All</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {validResults
                  .filter(item => item.coherence <= 2 && (!scoreFilter || Math.round(item.coherence) === Number(scoreFilter)))
                  .map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Scenario: {item.scenario}</span>
                          <span className="ml-4 text-sm font-medium text-muted-foreground">Score: {item.coherence}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedChatlog(expandedChatlog && expandedChatlog.tab === 'coherence' && expandedChatlog.originalIndex === item.originalIndex ? null : { tab: 'coherence', originalIndex: item.originalIndex! })}
                        >
                          {expandedChatlog?.tab === 'coherence' && expandedChatlog?.originalIndex === item.originalIndex ? 'Hide' : 'View'}
                        </Button>
                      </div>
                      {expandedChatlog?.tab === 'coherence' && expandedChatlog?.originalIndex === item.originalIndex && (
                        <div className="mt-4">
                          <ChatBubbleView chatlogText={item.chatlog} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="politeness">
          <Card>
            <CardHeader>
              <CardTitle>Low Scoring Chatlogs by Scenario</CardTitle>
              <CardDescription>Detailed view of chatlog politeness scores. Use the selector to filter by score.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Score</label>
                <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                  <option value="">All</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {validResults
                  .filter(item => item.politeness <= 2 && (!scoreFilter || Math.round(item.politeness) === Number(scoreFilter)))
                  .map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Scenario: {item.scenario}</span>
                          <span className="ml-4 text-sm font-medium text-muted-foreground">Score: {item.politeness}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedChatlog(expandedChatlog && expandedChatlog.tab === 'politeness' && expandedChatlog.originalIndex === item.originalIndex ? null : { tab: 'politeness', originalIndex: item.originalIndex! })}
                        >
                          {expandedChatlog?.tab === 'politeness' && expandedChatlog?.originalIndex === item.originalIndex ? 'Hide' : 'View'}
                        </Button>
                      </div>
                      {expandedChatlog?.tab === 'politeness' && expandedChatlog?.originalIndex === item.originalIndex && (
                        <div className="mt-4">
                          <ChatBubbleView chatlogText={item.chatlog} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relevance">
          <Card>
            <CardHeader>
              <CardTitle>Low Scoring Chatlogs by Scenario</CardTitle>
              <CardDescription>Detailed view of chatlog relevance scores. Use the selector to filter by score.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Score</label>
                <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                  <option value="">All</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {validResults
                  .filter(item => item.relevance <= 2 && (!scoreFilter || Math.round(item.relevance) === Number(scoreFilter)))
                  .map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Scenario: {item.scenario}</span>
                          <span className="ml-4 text-sm font-medium text-muted-foreground">Score: {item.relevance}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedChatlog(expandedChatlog && expandedChatlog.tab === 'relevance' && expandedChatlog.originalIndex === item.originalIndex ? null : { tab: 'relevance', originalIndex: item.originalIndex! })}
                        >
                          {expandedChatlog?.tab === 'relevance' && expandedChatlog?.originalIndex === item.originalIndex ? 'Hide' : 'View'}
                        </Button>
                      </div>
                      {expandedChatlog?.tab === 'relevance' && expandedChatlog?.originalIndex === item.originalIndex && (
                        <div className="mt-4">
                          <ChatBubbleView chatlogText={item.chatlog} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CPRDetailsPage;

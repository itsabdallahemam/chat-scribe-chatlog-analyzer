import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gauge, Smile, MessageCircle, CheckCircle } from 'lucide-react';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import ChatBubbleView from '@/components/ChatBubbleView';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Select } from '@/components/ui/select';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-app-bg text-app-text">
        <div className="max-w-md text-center">
          <h3 className="text-xl font-medium mb-4">No Evaluation Results</h3>
          <p className="text-muted-foreground mb-6">
            Please upload or paste chatlogs on the home page to see evaluation results.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-app-blue hover:bg-app-blue-light text-white"
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
  const RESOLVED_COLOR = "#0A2463";
  const UNRESOLVED_COLOR = "#FFD166";
  const BAR_CHART_COLOR = "#247BA0"; // app-blue-light

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
      accessorKey: 'coherence',
      header: 'Coherence',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1.5 rounded-md text-sm ${
          row.original.coherence <= 2 ? 'bg-red-50 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          row.original.coherence === 3 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200' : 
          'bg-green-50 text-green-700 dark:bg-green-900/60 dark:text-green-200'
        }`}>
          {row.original.coherence.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'politeness',
      header: 'Politeness',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1.5 rounded-md text-sm ${
          row.original.politeness <= 2 ? 'bg-red-50 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          row.original.politeness === 3 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200' : 
          'bg-green-50 text-green-700 dark:bg-green-900/60 dark:text-green-200'
        }`}>
          {row.original.politeness.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'relevance',
      header: 'Relevance',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[3rem] font-medium px-2.5 py-1.5 rounded-md text-sm ${
          row.original.relevance <= 2 ? 'bg-red-50 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          row.original.relevance === 3 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200' : 
          'bg-green-50 text-green-700 dark:bg-green-900/60 dark:text-green-200'
        }`}>
          {row.original.relevance.toFixed(0)}
        </div>
      ),
    },
    {
      accessorKey: 'resolution',
      header: 'Resolution',
      cell: ({ row }) => (
        <div className={`inline-flex items-center justify-center min-w-[4.5rem] font-medium px-2.5 py-1.5 rounded-md text-sm ${
          row.original.resolution === 1 ? 'bg-green-50 text-green-700 dark:bg-green-800/70 dark:text-green-200' : 'bg-red-50 text-red-700 dark:bg-red-800/70 dark:text-red-200'
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
            className="border-app-blue text-app-blue hover:bg-app-blue/10 text-sm font-medium dark:bg-app-blue/80 dark:text-white dark:border-app-blue dark:hover:bg-app-blue/60"
          >
            {expandedChatlogIndex === row.original.originalIndex ? 'Hide' : 'View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteChatLog(row.original.id as number)}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-medium dark:bg-red-800/80 dark:text-white dark:border-red-700 dark:hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">Dashboard Overview</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Analyzing {totalLogs} chatlogs with {selectedModel ? selectedModel.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Selected Model'}</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Main Content (2 columns) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ScoreCard
              title="Coherence"
              value={isNaN(avgCoherence) ? 'N/A' : avgCoherence.toFixed(2)}
              subtitle="Avg. Score"
              gradient="bg-gradient-to-br from-[#f8e3ff] via-[#ffd1dc] to-[#ffd6d6]"
              icon={<Gauge className="w-6 h-6 text-[#0A2463]" />}
            />
            <ScoreCard
              title="Politeness"
              value={isNaN(avgPoliteness) ? 'N/A' : avgPoliteness.toFixed(2)}
              subtitle="Avg. Score"
              gradient="bg-gradient-to-br from-[#d4e7fe] via-[#b6ccfe] to-[#b0e5e9]"
              icon={<Smile className="w-6 h-6 text-[#247BA0]" />}
            />
            <ScoreCard
              title="Relevance"
              value={isNaN(avgRelevance) ? 'N/A' : avgRelevance.toFixed(2)}
              subtitle="Avg. Score"
              gradient="bg-gradient-to-br from-[#d1fae5] via-[#6ee7b7] to-[#34d399]"
              icon={<MessageCircle className="w-6 h-6 text-[#FFD166]" />}
            />
            <ScoreCard
              title="Resolution"
              value={isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`}
              subtitle={`${resolvedCount} of ${validResults.length} resolved`}
              gradient="bg-gradient-to-br from-[#fff8c9] via-[#ffeaa0] to-[#ffd166]"
              icon={<CheckCircle className="w-6 h-6 text-[#2B2D42]" />}
            />
          </div>
          {/* Score Distributions */}
          <Card className="rounded-3xl bg-white/60 dark:bg-gray-800/90 dark:shadow-2xl shadow-xl p-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-gray-100">Score Distributions</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Breakdown of scores across evaluation metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Coherence", data: coherenceDistribution },
                  { title: "Politeness", data: politenessDistribution },
                  { title: "Relevance", data: relevanceDistribution },
                ].map((chart, index) => (
                  <div key={index} className="h-[200px] bg-white/70 dark:bg-gray-900/80 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                    <h4 className="text-base font-semibold mb-2 text-center text-muted-foreground dark:text-gray-100">{chart.title}</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          vertical={false} 
                          stroke="hsl(var(--border))" 
                          opacity={0.3} 
                        />
                        <XAxis 
                          dataKey="name" 
                          fontSize={12}
                          strokeOpacity={0.75}
                          tick={{ fill: '#e5e7eb' }}
                        />
                        <YAxis 
                          allowDecimals={false} 
                          fontSize={12}
                          strokeOpacity={0.75}
                          tick={{ fill: '#e5e7eb' }}
                        />
                        <Tooltip 
                          wrapperStyle={{ 
                            fontSize: '14px', 
                            color: 'hsl(var(--popover-foreground))' 
                          }} 
                          contentStyle={{ 
                            background: 'hsl(var(--popover))', 
                            borderRadius: 'var(--radius)', 
                            border: '1px solid hsl(var(--border))', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill={BAR_CHART_COLOR} 
                          name="Count" 
                          radius={[8, 8, 0, 0]} 
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Performance by Scenario (moved and styled) */}
          <Card className="rounded-3xl bg-white/60 dark:bg-gray-800/90 dark:shadow-2xl shadow-xl p-8">
            <CardHeader>
              <CardTitle>Performance by Scenario</CardTitle>
              <CardDescription>Resolution rates and average scores across different scenarios</CardDescription>
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
                    <YAxis yAxisId="left" orientation="left" stroke={RESOLVED_COLOR} />
                    <YAxis yAxisId="right" orientation="right" stroke={BAR_CHART_COLOR} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm">Resolution Rate: {data.resolutionRate.toFixed(1)}%</p>
                              <p className="text-sm">Avg Coherence: {data.avgCoherence.toFixed(1)}</p>
                              <p className="text-sm">Avg Politeness: {data.avgPoliteness.toFixed(1)}</p>
                              <p className="text-sm">Avg Relevance: {data.avgRelevance.toFixed(1)}</p>
                              <p className="text-sm">Total Chatlogs: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="resolutionRate"
                      name="Resolution Rate (%)"
                      fill={RESOLVED_COLOR}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgCoherence"
                      name="Avg Coherence"
                      fill={BAR_CHART_COLOR}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Chatlogs Table */}
          <Card className="rounded-3xl bg-white/60 dark:bg-gray-900/80 dark:shadow-2xl shadow-xl p-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-gray-100">Recent Chatlogs</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                View and analyze individual chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-4 mb-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Coherence</label>
                  <select value={coherenceFilter} onChange={e => setCoherenceFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                    <option value="">All</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Politeness</label>
                  <select value={politenessFilter} onChange={e => setPolitenessFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
                    <option value="">All</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Relevance</label>
                  <select value={relevanceFilter} onChange={e => setRelevanceFilter(e.target.value)} className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400">
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
              </div>
              {/* Filtered DataTable */}
              <div className="rounded-2xl border border-border/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 shadow-md overflow-hidden">
                <div className="[&_th]:bg-white/60 dark:[&_th]:bg-gray-800/80 [&_th]:text-muted-foreground dark:[&_th]:text-gray-100 [&_th]:font-medium [&_th]:text-base [&_th]:border-border/40 dark:[&_th]:border-gray-700 [&_td]:border-border/40 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-white/80 dark:[&_tr:hover]:bg-gray-800/60">
                  <DataTable 
                    columns={columns}
                    data={validResults.filter(item =>
                      (!coherenceFilter || Math.round(item.coherence) === Number(coherenceFilter)) &&
                      (!politenessFilter || Math.round(item.politeness) === Number(politenessFilter)) &&
                      (!relevanceFilter || Math.round(item.relevance) === Number(relevanceFilter)) &&
                      (!resolutionFilter || String(item.resolution) === resolutionFilter)
                    ).map((item, index) => ({
                      ...item,
                      expandedContent: expandedChatlogIndex === index ? (
                        <div className="rounded-lg border border-border/40 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 p-4 shadow-sm">
                          <ChatBubbleView chatlogText={item.chatlog} />
                        </div>
                      ) : null
                    })) as DashboardTableRow[]}
                    expandedRowIndex={expandedChatlogIndex}
                    onRowExpand={handleToggleChatlogView}
                    exportFilename="chatlog-analysis"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar (1 column) */}
        <div className="flex flex-col gap-8">
          {/* Resolution Overview */}
          <Card className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl p-8 flex flex-col justify-between border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-gray-100">Resolution Overview</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Breakdown of resolved vs. unresolved chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-medium text-app-text-secondary">Resolved</span>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-app-blue dark:text-green-400">{resolvedCount}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-200 via-cyan-100 to-green-200 text-app-blue dark:from-green-900 dark:to-blue-900 dark:text-green-200 border border-transparent">
                      {resolutionRate.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-medium text-app-text-secondary">Unresolved</span>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-yellow-500 dark:text-yellow-300">{unresolvedCount}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-yellow-200 via-orange-100 to-orange-300 text-yellow-700 dark:from-yellow-900 dark:to-orange-900 dark:text-yellow-200 border border-transparent">
                      {(100 - resolutionRate).toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="w-full h-7 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center shadow-inner relative overflow-hidden mt-2 border border-gray-200 dark:border-gray-700">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${resolutionRate}%`,
                      borderTopLeftRadius: '9999px',
                      borderBottomLeftRadius: '9999px',
                      borderTopRightRadius: resolutionRate === 100 ? '9999px' : 0,
                      borderBottomRightRadius: resolutionRate === 100 ? '9999px' : 0,
                      background: 'linear-gradient(90deg, #0A2463 0%, #247BA0 50%, #34d399 100%)',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${100 - resolutionRate}%`,
                      borderTopRightRadius: '9999px',
                      borderBottomRightRadius: '9999px',
                      borderTopLeftRadius: resolutionRate === 0 ? '9999px' : 0,
                      borderBottomLeftRadius: resolutionRate === 0 ? '9999px' : 0,
                      background: 'linear-gradient(90deg, #FFD166 0%, #ffeaa0 100%)',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card className="rounded-3xl bg-white/60 dark:bg-gray-800/90 dark:shadow-2xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-gray-100">Quick Actions</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">Navigate to detailed views</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col space-y-3 bg-white/70 dark:bg-gray-700/80 rounded-2xl p-4 shadow-sm">
                <Button 
                  onClick={() => navigate('/satisfaction')}
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-700/80 dark:text-white dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Customer Satisfaction
                </Button>
                <Button 
                  onClick={() => navigate('/cpr-details')}
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-700/80 dark:text-white dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View CPR Details
                </Button>
                <Button 
                  onClick={() => navigate('/resolution-details')}
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-700/80 dark:text-white dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Resolution Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

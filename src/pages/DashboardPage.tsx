import React, { useState } from 'react';
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
          <Card className="rounded-3xl bg-white/60 dark:bg-gray-800/90 dark:shadow-2xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-gray-100">Resolution Overview</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Breakdown of resolved vs. unresolved chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-4 bg-white/70 dark:bg-gray-700/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-app-text-secondary">Resolved</span>
                  <span className="text-base font-semibold" style={{ color: RESOLVED_COLOR }}>{resolvedCount} ({resolutionRate.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-app-text-secondary">Unresolved</span>
                  <span className="text-base font-semibold" style={{ color: UNRESOLVED_COLOR }}>{unresolvedCount} ({(100 - resolutionRate).toFixed(1)}%)</span>
                </div>
                <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full"
                    style={{
                      width: `${resolutionRate}%`,
                      backgroundColor: RESOLVED_COLOR,
                      transition: 'width 0.5s',
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${100 - resolutionRate}%`,
                      backgroundColor: UNRESOLVED_COLOR,
                      transition: 'width 0.5s',
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

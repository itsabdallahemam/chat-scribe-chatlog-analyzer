// src/pages/ResolutionPage.tsx
import React, { useMemo, useState, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';
import { Download, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Define colors
const RESOLVED_COLOR = "#0A2463";
const UNRESOLVED_COLOR = "#FFD166";
const BAR_CHART_COLOR = "#247BA0";

// Define types
interface EvaluationResultItem {
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  originalIndex?: number;
}

interface ColumnDefinition<TData extends object> {
  accessorKey: keyof TData | 'actions';
  header: string | (() => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
}

interface TrendsDataItem {
  name: string;
  Resolved: number;
  Unresolved: number;
}

const ResolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved' | 'trends'>('unresolved');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-app-bg text-app-text">
        <div className="max-w-md text-center">
          <PageTitle title="Resolution Details" description="No evaluations yet." />
          <h3 className="text-xl font-medium mb-4 mt-8">No Evaluation Results</h3>
          <p className="text-muted-foreground mb-6">
            Please upload or paste chatlogs on the home page to see resolution details.
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

  const resolvedLogs = useMemo(() => validResults.filter(item => item.resolution === 1), [validResults]);
  const unresolvedLogs = useMemo(() => validResults.filter(item => item.resolution === 0), [validResults]);
  const totalValidLogs = validResults.length;
  const resolutionRate = totalValidLogs > 0 ? (resolvedLogs.length / totalValidLogs) * 100 : 0;

  // Stat cards
  const statCards = [
    {
      title: 'Resolution Rate',
      value: isNaN(resolutionRate) ? 'N/A' : `${resolutionRate.toFixed(1)}%`,
      subtitle: `${resolvedLogs.length} of ${totalValidLogs} resolved`,
      gradient: 'bg-gradient-to-br from-[#fff8c9] via-[#ffeaa0] to-[#ffd166]',
      icon: <CheckCircle className="w-6 h-6 text-[#2B2D42]" />,
    },
    {
      title: 'Unresolved',
      value: unresolvedLogs.length,
      subtitle: 'Currently unresolved',
      gradient: 'bg-gradient-to-br from-[#ffeaea] via-[#fff5c9] to-[#ffd166]',
      icon: <AlertTriangle className="w-6 h-6 text-[#FFD166]" />,
    },
    {
      title: 'Resolved',
      value: resolvedLogs.length,
      subtitle: 'Resolved chatlogs',
      gradient: 'bg-gradient-to-br from-[#d1fae5] via-[#6ee7b7] to-[#34d399]',
      icon: <CheckCircle className="w-6 h-6 text-[#34d399]" />,
    },
  ];

  // Needs Attention: longest unresolved or lowest scores
  const needsAttention = useMemo(() => {
    return unresolvedLogs
      .slice()
      .sort((a, b) => (a.coherence + a.politeness + a.relevance) - (b.coherence + b.politeness + b.relevance))
      .slice(0, 5);
  }, [unresolvedLogs]);

  // Table columns (reuse existing logic)
  const getColumns = (tabType: 'resolved' | 'unresolved'): ColumnDefinition<EvaluationResultItem>[] => [
    {
      accessorKey: 'actions',
      header: 'Chatlog #',
      cell: (row: EvaluationResultItem) => (
        <div className="text-center">{row.originalIndex !== undefined ? row.originalIndex + 1 : 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'coherence',
      header: 'C',
      cell: (row: EvaluationResultItem) => <div className="text-center">{typeof row.coherence === 'number' ? row.coherence.toFixed(0) : 'N/A'}</div>,
    },
    {
      accessorKey: 'politeness',
      header: 'P',
      cell: (row: EvaluationResultItem) => <div className="text-center">{typeof row.politeness === 'number' ? row.politeness.toFixed(0) : 'N/A'}</div>,
    },
    {
      accessorKey: 'relevance',
      header: 'R',
      cell: (row: EvaluationResultItem) => <div className="text-center">{typeof row.relevance === 'number' ? row.relevance.toFixed(0) : 'N/A'}</div>,
    },
    {
      accessorKey: 'actions',
      header: "View Chat",
      cell: (row: EvaluationResultItem) => (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedChatlog(expandedChatlog && expandedChatlog.tab === tabType && expandedChatlog.originalIndex === row.originalIndex ? null : { tab: tabType, originalIndex: row.originalIndex! })}
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white dark:bg-app-blue/80 dark:text-white dark:border-app-blue dark:hover:bg-app-blue/60"
          >
            {expandedChatlog?.tab === tabType && expandedChatlog?.originalIndex === row.originalIndex ? 'Hide' : 'View'}
          </Button>
        </div>
      )
    }
  ];

  // Trends data (if timestamps available, otherwise by index)
  const trendsData: TrendsDataItem[] = useMemo(() => {
    // If you have timestamps, group by day/week/month
    // For now, just show resolved/unresolved counts by index
    return validResults.map((item, idx) => ({
      name: `#${idx + 1}`,
      Resolved: item.resolution === 1 ? 1 : 0,
      Unresolved: item.resolution === 0 ? 1 : 0,
    }));
  }, [validResults]);

  // Calculate scenario-based resolution rates
  const scenarioResolutionData = useMemo(() => {
    const scenarios = [...new Set(validResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = validResults.filter(item => item.scenario === scenario);
      const resolvedInScenario = scenarioLogs.filter(item => item.resolution === 1).length;
      const rate = scenarioLogs.length > 0 ? (resolvedInScenario / scenarioLogs.length) * 100 : 0;
      return { name: scenario, value: rate };
    });
  }, [validResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">Resolution Details</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Deep dive into resolved and unresolved chatlogs, trends, and actionable insights.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Main Content (2 columns) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((card, idx) => (
              <div key={card.title} className={`relative rounded-2xl shadow-lg p-6 min-w-[180px] min-h-[180px] flex flex-col justify-between ${card.gradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
                <div className="flex justify-between items-start">
                  <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{card.title}</div>
                  <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow absolute top-4 right-4">
                    {card.icon}
                  </div>
                </div>
                <div className="mt-8">
                  <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{card.value}</div>
                  <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{card.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Tabs for Resolved/Unresolved/Trends */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Resolution Insights</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Explore unresolved, resolved, and trends in chatlog resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unresolved' | 'resolved' | 'trends')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-card border rounded-lg shadow-sm mb-6">
                  <TabsTrigger value="unresolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Unresolved</TabsTrigger>
                  <TabsTrigger value="resolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Resolved</TabsTrigger>
                  <TabsTrigger value="trends" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Trends</TabsTrigger>
                </TabsList>
                <TabsContent value="unresolved">
                  <div className="rounded-2xl border border-border/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 shadow-md overflow-hidden">
                    <div className="[&_th]:bg-white/60 dark:[&_th]:bg-gray-900/80 [&_th]:text-muted-foreground dark:[&_th]:text-gray-100 [&_th]:font-medium [&_th]:text-base [&_th]:border-border/40 dark:[&_th]:border-gray-700 [&_td]:border-border/40 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-white/80 dark:[&_tr:hover]:bg-gray-800/60">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr>
                            {getColumns('unresolved').map((columnDef) => (
                              <th key={String(columnDef.accessorKey)} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {unresolvedLogs.length > 0 ? (
                            unresolvedLogs.map((rowItem, rowIndex) => (
                              <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  {getColumns('unresolved').map((columnDef) => (
                                    <td key={String(columnDef.accessorKey)} className="p-4 align-middle">
                                      {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                    </td>
                                  ))}
                                </tr>
                                {expandedChatlog?.tab === 'unresolved' && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                  <tr key={rowItem.originalIndex + '-expanded'} className="bg-muted/50">
                                    <td colSpan={getColumns('unresolved').length} className="p-2 border-t">
                                      <ChatBubbleView chatlogText={rowItem.chatlog} />
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={getColumns('unresolved').length} className="p-4 h-24 text-center text-muted-foreground">
                                No unresolved chatlogs found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="resolved">
                  <div className="rounded-2xl border border-border/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 shadow-md overflow-hidden">
                    <div className="[&_th]:bg-white/60 dark:[&_th]:bg-gray-900/80 [&_th]:text-muted-foreground dark:[&_th]:text-gray-100 [&_th]:font-medium [&_th]:text-base [&_th]:border-border/40 dark:[&_th]:border-gray-700 [&_td]:border-border/40 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-white/80 dark:[&_tr:hover]:bg-gray-800/60">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr>
                            {getColumns('resolved').map((columnDef) => (
                              <th key={String(columnDef.accessorKey)} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resolvedLogs.length > 0 ? (
                            resolvedLogs.map((rowItem, rowIndex) => (
                              <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  {getColumns('resolved').map((columnDef) => (
                                    <td key={String(columnDef.accessorKey)} className="p-4 align-middle">
                                      {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                    </td>
                                  ))}
                                </tr>
                                {expandedChatlog?.tab === 'resolved' && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                  <tr key={rowItem.originalIndex + '-expanded'} className="bg-muted/50">
                                    <td colSpan={getColumns('resolved').length} className="p-2 border-t">
                                      <ChatBubbleView chatlogText={rowItem.chatlog} />
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={getColumns('resolved').length} className="p-4 h-24 text-center text-muted-foreground">
                                No resolved chatlogs found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="trends">
                  <div className="rounded-2xl border border-border/40 bg-white/70 dark:bg-gray-900/80 shadow-md overflow-hidden p-8">
                    <div className="text-lg font-semibold mb-4 dark:text-white">Resolution Trends</div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={trendsData}
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
                          <YAxis />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const resolvedValue = payload[0].value as number;
                                const unresolvedValue = payload[1].value as number;
                                return (
                                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                    <p className="font-semibold">{label}</p>
                                    <p className="text-sm">Resolved: {resolvedValue}</p>
                                    <p className="text-sm">Unresolved: {unresolvedValue}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="Resolved" name="Resolved" fill={RESOLVED_COLOR} />
                          <Bar dataKey="Unresolved" name="Unresolved" fill={UNRESOLVED_COLOR} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar (1 column) */}
        <div className="flex flex-col gap-8">
          {/* Needs Attention Card */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Needs Attention</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">Lowest scoring unresolved chatlogs</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2 bg-white/70 dark:bg-gray-900/60 rounded-2xl p-4 shadow-sm">
                {needsAttention.length === 0 ? (
                  <span className="text-base text-muted-foreground">No unresolved chatlogs need attention.</span>
                ) : (
                  needsAttention.map((item, idx) => (
                    <div key={item.originalIndex} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="text-base font-medium text-app-text-secondary">Chatlog #{item.originalIndex! + 1}</span>
                      <span className="text-base font-semibold text-red-600">Score: {(item.coherence + item.politeness + item.relevance).toFixed(1)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">Navigate to other views</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col space-y-3 bg-white/70 dark:bg-gray-900/60 rounded-2xl p-4 shadow-sm">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/cpr-details')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View CPR Details
                </Button>
                <Button 
                  onClick={() => navigate('/satisfaction')} 
                  variant="outline"
                  className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-app-blue/20 justify-start text-base font-medium"
                >
                  View Customer Satisfaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Scenario Resolution Chart */}
      <Card className="mb-8 mt-12">
        <CardHeader>
          <CardTitle>Resolution Rate by Scenario</CardTitle>
          <CardDescription>Percentage of resolved issues for each scenario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scenarioResolutionData}
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
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <p className="font-semibold">{label}</p>
                          <p className="text-sm">Resolution Rate: {Number(data.resolutionRate).toFixed(1)}%</p>
                          <p className="text-sm">Avg Coherence: {Number(data.avgCoherence).toFixed(1)}</p>
                          <p className="text-sm">Avg Politeness: {Number(data.avgPoliteness).toFixed(1)}</p>
                          <p className="text-sm">Avg Relevance: {Number(data.avgRelevance).toFixed(1)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" name="Resolution Rate (%)" fill={RESOLVED_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResolutionPage;

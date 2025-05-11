// src/pages/SatisfactionPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';
import { Smile, CheckCircle, Download, MessageCircle } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Icons for pagination buttons (example using lucide-react)
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';


interface EvaluationResultItem {
  chatlog: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  originalIndex?: number;
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

  const handleToggleChatlogView = (index: number) => {
    setExpandedChatlogIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const attentionColumns: ColumnType<EvaluationResultItem>[] = [ /* ... (keep as is) ... */
    {
      accessorKey: 'politeness',
      header: () => <div className="text-center">Politeness</div>,
      cell: (row: EvaluationResultItem) => {
        const politenessValue = row.politeness;
        return <div className={`text-center font-medium p-2 rounded-md w-24 mx-auto ${
          politenessValue <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200' : 
          politenessValue === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-200' : 
          'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200'
        }`}>{typeof politenessValue === 'number' ? politenessValue.toFixed(0) : 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'resolution',
      header: () => <div className="text-center">Resolution</div>,
      cell: (row: EvaluationResultItem) => {
        const resolutionValue = row.resolution;
        const isResolved = typeof resolutionValue === 'number' && resolutionValue === 1;
        return <div className={`text-center font-semibold p-2 rounded-md w-28 mx-auto ${
          isResolved ? 'bg-green-100 text-green-700 dark:bg-green-800/70 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-800/70 dark:text-red-200'
        }`}>{typeof resolutionValue === 'number' ? (isResolved ? 'Resolved' : 'Unresolved') : 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center">View Chat</div>,
      cell: (row: EvaluationResultItem) => (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleChatlogView(row.originalIndex as number)}
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white dark:bg-app-blue/80 dark:text-white dark:border-app-blue dark:hover:bg-app-blue/60"
          >
            {expandedChatlogIndex === row.originalIndex ? 'Hide' : 'View'}
          </Button>
        </div>
      ),
    }
  ];

  // --- Pagination Logic for Attention Table ---
  const attentionPageCount = Math.ceil(attentionRequired.length / ATTENTION_TABLE_PAGE_SIZE);
  const attentionStartIndex = attentionTableCurrentPage * ATTENTION_TABLE_PAGE_SIZE;
  const attentionEndIndex = Math.min(attentionStartIndex + ATTENTION_TABLE_PAGE_SIZE, attentionRequired.length);
  const attentionPageData = attentionRequired.slice(attentionStartIndex, attentionEndIndex);
  const [showAllAttentionLogs, setShowAllAttentionLogs] = useState(false);


  const BAR_CHART_COLOR_POLITENESS = "#FFD166";
  const RESOLVED_COLOR = "#0A2463";
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

  // 3. Trends data for politeness
  const politenessTrends = useMemo(() => {
    const groupSize = 10;
    const data: { name: string; avg: number }[] = [];
    for (let i = 0; i < validResults.length; i += groupSize) {
      const group = validResults.slice(i, i + groupSize);
      const avg = group.length > 0 ? group.reduce((sum, item) => sum + item.politeness, 0) / group.length : 0;
      data.push({ name: `#${i + 1}-${i + group.length}`, avg });
    }
    return data;
  }, [validResults]);

  // 4. Needs Attention: lowest politeness chatlogs
  const needsAttention = useMemo(() => {
    return validResults
      .slice()
      .sort((a, b) => a.politeness - b.politeness)
      .slice(0, 5);
  }, [validResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">Customer Satisfaction Insights</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Analysis of politeness scores and resolution rates across all chatlogs.</p>
      </div>
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <ScoreCard
          title="Average Politeness"
          value={isNaN(avgPoliteness) ? 'N/A' : avgPoliteness.toFixed(2)}
          subtitle="Out of 5 (Higher is better)"
          gradient="bg-gradient-to-br from-[#d4e7fe] via-[#b6ccfe] to-[#b0e5e9]"
          icon={<Smile className="w-6 h-6 text-[#247BA0]" />}
        />
        <ScoreCard
          title="Resolution"
          value={isNaN(resolutionRate) ? 'N/A' : resolutionRate.toFixed(2) + '%'}
          subtitle={`${resolvedCount} of ${totalValidLogs} resolved`}
          gradient="bg-gradient-to-br from-[#fff8c9] via-[#ffeaa0] to-[#ffd166]"
          icon={<CheckCircle className="w-6 h-6 text-[#2B2D42]" />}
        />
        <ScoreCard
          title="Avg. Turns per Resolution"
          value={isNaN(avgTurnsPerResolution) ? 'N/A' : avgTurnsPerResolution.toFixed(1)}
          subtitle="Turns in resolved chatlogs"
          gradient="bg-gradient-to-br from-[#e0f7fa] via-[#b2ebf2] to-[#80deea]"
          icon={<MessageCircle className="w-6 h-6 text-[#00bcd4]" />}
        />
      </div>
      {/* Main Content Grid: 2/3 left, 1/3 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Main Insights */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Score Distribution */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Politeness Score Distribution</CardTitle>
              <CardDescription className="text-base text-muted-foreground">Frequency of each politeness score (1-5).</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={politenessDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5}/>
                  <XAxis dataKey="name" name="Score" stroke="hsl(var(--foreground))" fontSize={14} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={14} label={{ value: 'Number of Chatlogs', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '14px', fill: 'hsl(var(--foreground))'} }}/>
                  <Tooltip wrapperStyle={{ color: '#333', fontSize: '14px' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                  <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '14px'}}/>
                  <Bar dataKey="count" fill={BAR_CHART_COLOR_POLITENESS} name="Chatlog Count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Trends card for politeness */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/80 shadow p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Politeness Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={politenessTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" name="Group" stroke="hsl(var(--foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} label={{ value: 'Avg. Politeness', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))'} }}/>
                  <Tooltip wrapperStyle={{ color: '#333', fontSize: '12px' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                  <Bar dataKey="avg" fill="#FFD166" name="Avg. Politeness" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Score Breakdown card */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/90 dark:border-gray-700 shadow p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Politeness Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-300">{politenessScoreBreakdown.low.count}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-200">Low (1-2)</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">{politenessScoreBreakdown.low.pct.toFixed(1)}%</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-200">{politenessScoreBreakdown.medium.count}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-200">Medium (3)</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">{politenessScoreBreakdown.medium.pct.toFixed(1)}%</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">{politenessScoreBreakdown.high.count}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-200">High (4-5)</div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">{politenessScoreBreakdown.high.pct.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right: Summary/Diagnostic Cards */}
        <div className="flex flex-col gap-8">
          {/* Politeness Breakdown */}
          <Card className="rounded-3xl border-0 bg-white dark:bg-gray-900 shadow-xl p-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Politeness Breakdown</CardTitle>
              <CardDescription className="text-base text-muted-foreground">Chatlogs by politeness category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-base">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Excellent (4-5)</span>
                  <span className="font-semibold text-green-600">{excellentPolitenessCount}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalValidLogs > 0 ? (excellentPolitenessCount / totalValidLogs) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Average (3)</span>
                  <span className="font-semibold text-yellow-500">{averagePolitenessCount}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalValidLogs > 0 ? (averagePolitenessCount / totalValidLogs) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #facc15 0%, #fbbf24 100%)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Poor (1-2)</span>
                  <span className="font-semibold text-red-500">{poorPolitenessCount}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalValidLogs > 0 ? (poorPolitenessCount / totalValidLogs) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Needs Attention card */}
          <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-app-text">Needs Attention</CardTitle>
              <CardDescription className="text-base text-app-text-secondary">Lowest politeness chatlogs</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-4 bg-white/70 dark:bg-gray-900/60 rounded-2xl p-4 shadow-sm">
                {needsAttention.length === 0 ? (
                  <span className="text-base text-muted-foreground">No chatlogs need attention.</span>
                ) : (
                  needsAttention.map((item, idx) => (
                    <div key={item.originalIndex} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="text-base font-medium text-app-text-secondary">Chatlog #{item.originalIndex! + 1}</span>
                      <span className="text-base font-semibold text-red-600">Score: {item.politeness.toFixed(1)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Chatlogs Requiring Attention Table with Pagination (full width) */}
      <Card className="rounded-3xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl p-8 mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Chatlogs Requiring Attention ({attentionRequired.length})</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Low politeness (≤ 2) or unresolved issues. Click 'View' to see chat.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(attentionRequired, 'attention-required')}
                className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(attentionRequired, 'attention-required')}
                className="border-app-blue text-app-blue hover:bg-app-blue/10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {attentionColumns.map((columnDef) => (
                    <th
                      key={String(columnDef.accessorKey)}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >
                      {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attentionPageData.length > 0 ? (
                  attentionPageData.map((rowItem, rowIndex) => (
                    <React.Fragment key={rowItem.originalIndex ?? (attentionStartIndex + rowIndex)}>
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        {attentionColumns.map((columnDef) => (
                          <td
                            key={String(columnDef.accessorKey)}
                            className="p-4 align-middle"
                          >
                            {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                          </td>
                        ))}
                      </tr>
                      {expandedChatlogIndex === (rowItem.originalIndex) && (
                        <tr key={rowItem.originalIndex + '-expanded'} className="bg-muted/50">
                          <td colSpan={attentionColumns.length} className="p-2 border-t">
                            <ChatBubbleView chatlogText={rowItem.chatlog} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={attentionColumns.length}
                      className="p-4 h-24 text-center text-muted-foreground"
                    >
                      No chatlogs require immediate attention based on current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {attentionPageCount > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {attentionTableCurrentPage + 1} of {attentionPageCount}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(0)}
                  disabled={attentionTableCurrentPage === 0}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={attentionTableCurrentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(prev => Math.min(attentionPageCount - 1, prev + 1))}
                  disabled={attentionTableCurrentPage >= attentionPageCount - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttentionTableCurrentPage(attentionPageCount - 1)}
                  disabled={attentionTableCurrentPage >= attentionPageCount - 1}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionPage;

// src/pages/SatisfactionPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import ChatBubbleView from '@/components/ChatBubbleView';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
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
          <PageTitle title="Customer Satisfaction" description="No evaluations yet." />
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
        return <div className={`text-center font-medium p-2 rounded-md w-24 mx-auto ${politenessValue <= 2 ? 'bg-red-100 text-red-700' : politenessValue === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{typeof politenessValue === 'number' ? politenessValue.toFixed(0) : 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'resolution',
      header: () => <div className="text-center">Resolution</div>,
      cell: (row: EvaluationResultItem) => {
        const resolutionValue = row.resolution;
        const isResolved = typeof resolutionValue === 'number' && resolutionValue === 1;
        return <div className={`text-center font-semibold p-2 rounded-md w-28 mx-auto ${isResolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{typeof resolutionValue === 'number' ? (isResolved ? "Resolved" : "Unresolved") : 'N/A'}</div>;
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
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white"
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
  const PIE_RESOLVED_COLOR = "#0A2463";
  const PIE_UNRESOLVED_COLOR = "#FFD166";
  const excellentPolitenessCount = validResults.filter(i => i.politeness >= 4).length;
  const averagePolitenessCount = validResults.filter(i => i.politeness === 3).length;
  const poorPolitenessCount = validResults.filter(i => i.politeness <= 2).length;
  const statCardGradients = [ /* ... */ 
    "bg-gradient-to-br from-sky-100 via-cyan-50 to-teal-100",
    "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 bg-app-bg min-h-screen text-app-text">
      <PageTitle
        title="Customer Satisfaction Insights"
        description="Analysis of politeness scores and resolution rates across all chatlogs."
      />

      {/* Top Stat Cards Section (keep as is) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ... StatCards ... */}
        <Card className={`overflow-hidden rounded-xl shadow-lg border-0 ${statCardGradients[0]}`}>
            <CardHeader className="pb-2 items-center flex-row justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-700">Average Politeness</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-app-text">
                {isNaN(avgPoliteness) ? "N/A" : avgPoliteness.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">Out of 5 (Higher is better)</p>
            </CardContent>
        </Card>
        <Card className={`overflow-hidden rounded-xl shadow-lg border-0 ${statCardGradients[1]}`}>
            <CardHeader className="pb-2 items-center flex-row justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-700">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-app-text">
                {isNaN(resolutionRate) ? "N/A" : `${resolutionRate.toFixed(1)}%`}
                </div>
                <p className="text-xs text-gray-600">{`${resolvedCount} of ${totalValidLogs} resolved`}</p>
            </CardContent>
        </Card>
      </div>

      {/* Main Content Grid (keep as is) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Politeness Score Distribution Card (keep as is) */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm bg-card text-card-foreground p-1">
            {/* ... Bar Chart ... */}
            <CardHeader>
            <CardTitle className="text-lg">Politeness Score Distribution</CardTitle>
            <CardDescription className="text-muted-foreground">Frequency of each politeness score (1-5).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={politenessDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5}/>
                <XAxis dataKey="name" name="Score" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} label={{ value: 'Number of Chatlogs', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))'} }}/>
                <Tooltip
                    wrapperStyle={{ color: '#333', fontSize: '12px' }}
                    contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}}/>
                <Bar dataKey="count" fill={BAR_CHART_COLOR_POLITENESS} name="Chatlog Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Satisfaction Summary Cards (keep as is) */}
        <div className="space-y-6">
            {/* ... Politeness Breakdown Card ... */}
            <Card className="rounded-xl shadow-sm bg-card text-card-foreground p-1">
              <CardHeader>
                <CardTitle className="text-lg">Politeness Breakdown</CardTitle>
                <CardDescription className="text-muted-foreground">Chatlogs by politeness category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Excellent (4-5)</span>
                    <span className="font-semibold text-green-600">{excellentPolitenessCount}</span>
                  </div>
                  <Progress value={totalValidLogs > 0 ? (excellentPolitenessCount / totalValidLogs) * 100 : 0} className="h-2 [&>div]:bg-green-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Average (3)</span>
                    <span className="font-semibold text-yellow-500">{averagePolitenessCount}</span>
                  </div>
                  <Progress value={totalValidLogs > 0 ? (averagePolitenessCount / totalValidLogs) * 100 : 0} className="h-2 [&>div]:bg-yellow-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Poor (1-2)</span>
                    <span className="font-semibold text-red-500">{poorPolitenessCount}</span>
                  </div>
                  <Progress value={totalValidLogs > 0 ? (poorPolitenessCount / totalValidLogs) * 100 : 0} className="h-2 [&>div]:bg-red-500" />
                </div>
              </CardContent>
            </Card>
            {/* ... Resolution Status Card (Pie Chart) ... */}
            <Card className="rounded-xl shadow-sm bg-card text-card-foreground p-1">
              <CardHeader>
                <CardTitle className="text-lg">Resolution Status</CardTitle>
                <CardDescription className="text-muted-foreground">Overall problem resolution.</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={[{ name: 'Resolved', value: resolvedCount }, { name: 'Unresolved', value: validResults.length - resolvedCount }]}
                        cx="50%" cy="50%" labelLine={false} outerRadius={70} dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        fontSize={12}
                        >
                        <Cell key={`cell-resolved`} fill={PIE_RESOLVED_COLOR} />
                        <Cell key={`cell-unresolved`} fill={PIE_UNRESOLVED_COLOR} />
                        </Pie>
                        <Tooltip wrapperStyle={{ fontSize: '12px', color: '#333' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                    </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Chatlogs Requiring Attention Table with Pagination */}
      <Card className="rounded-xl shadow-sm mt-6 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg">Chatlogs Requiring Attention ({attentionRequired.length})</CardTitle>
          <CardDescription className="text-muted-foreground">
            Low politeness (≤ 2) or unresolved issues. Click 'View' to see chat.
          </CardDescription>
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
              <tbody className="[&_tr:last-child]:border-0">
                {attentionPageData.length > 0 ? ( // Use attentionPageData here
                  attentionPageData.map((rowItem, rowIndex) => (
                    <React.Fragment key={rowItem.originalIndex ?? (attentionStartIndex + rowIndex)}> {/* More robust key */}
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
                      {expandedChatlogIndex === (rowItem.originalIndex) && ( // Check against originalIndex
                        <tr className="bg-muted/50">
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
          {/* Conditional "View All" button - now handled by pagination */}
          {!showAllAttentionLogs && attentionRequired.length > ATTENTION_TABLE_PAGE_SIZE && attentionPageCount <= 1 && (
             <div className="mt-4 text-center">
                {/* This button might be redundant if pagination is always shown for >1 page */}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionPage;

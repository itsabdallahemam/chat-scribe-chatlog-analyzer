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

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Define types
interface EvaluationResultItem {
  chatlog: string;
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


const CPRDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const [activeTab, setActiveTab] = useState<'coherence' | 'politeness' | 'relevance'>('coherence');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);

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
    .map((item, index) => ({ ...item, originalIndex: index })) // Add originalIndex
    .filter(item =>
      item &&
      typeof item.coherence === 'number' && !isNaN(item.coherence) &&
      typeof item.politeness === 'number' && !isNaN(item.politeness) &&
      typeof item.relevance === 'number' && !isNaN(item.relevance)
  ), [evaluationResults]);

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

  const avgScores = useMemo(() => {
    if (validResults.length === 0) return { coherence: NaN, politeness: NaN, relevance: NaN };
    return {
      coherence: validResults.reduce((sum, item) => sum + item.coherence, 0) / validResults.length,
      politeness: validResults.reduce((sum, item) => sum + item.politeness, 0) / validResults.length,
      relevance: validResults.reduce((sum, item) => sum + item.relevance, 0) / validResults.length,
    };
  }, [validResults]);

  const handleToggleChatlogView = (tab: string, originalIndex: number) => {
    if (expandedChatlog?.tab === tab && expandedChatlog?.originalIndex === originalIndex) {
      setExpandedChatlog(null);
    } else {
      setExpandedChatlog({ tab, originalIndex });
    }
  };
  
  const getColumnsForMetric = (metric: 'coherence' | 'politeness' | 'relevance'): ColumnDefinition<EvaluationResultItem>[] => [
    {
      accessorKey: metric,
      header: metric.charAt(0).toUpperCase() + metric.slice(1),
      cell: (row: EvaluationResultItem) => {
        const score = row[metric];
        return <div className={`text-center font-medium p-2 rounded-md w-20 mx-auto ${score <= 2 ? 'bg-red-100 text-red-700' : score === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{typeof score === 'number' && !isNaN(score) ? score.toFixed(0) : 'N/A'}</div>;
      }
    },
    {
      accessorKey: 'actions', // For the view button
      header: "View Chat",
      cell: (row: EvaluationResultItem) => (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleChatlogView(metric, row.originalIndex as number)}
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white"
          >
            {expandedChatlog?.tab === metric && expandedChatlog?.originalIndex === row.originalIndex ? 'Hide' : 'View'}
          </Button>
        </div>
      )
    }
  ];


  // Define specific colors for each metric's chart and progress bar
  const METRIC_COLORS = {
    coherence: "#fdd7e8", // Your specified pinkish color
    politeness: "#c3d8fe", // Your specified light blue
    relevance: "#bdeff2",  // Your specified light teal/cyan
  };
  const PROGRESS_BAR_COLORS = { // For the overview card progress
    coherence: "app-blue", // Example, can use a specific hex or Tailwind class
    politeness: "app-yellow",
    relevance: "app-teal-accent", // Assuming you have this in Tailwind config
  }


  const renderTabContent = (metric: 'coherence' | 'politeness' | 'relevance') => {
    const averageScore = avgScores[metric];
    const distributionData = distributions[metric];
    const sortedData = [...validResults].sort((a, b) => a[metric] - b[metric]);
    const currentColumns = getColumnsForMetric(metric);
    const barColor = METRIC_COLORS[metric];
    const progressBgClass = `[&>div]:bg-${PROGRESS_BAR_COLORS[metric]}`;


    return (
      <div className="space-y-6">
        {/* Row 1: Overview Card and Distribution Chart Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-xl shadow-sm bg-card text-card-foreground p-1">
            <CardHeader>
              <CardTitle className="text-lg">{metric.charAt(0).toUpperCase() + metric.slice(1)} Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <div className="text-4xl font-bold text-app-text">
                  {isNaN(averageScore) ? "N/A" : averageScore.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5</p>
              </div>
              <Progress value={isNaN(averageScore) ? 0 : (averageScore / 5) * 100} className={`h-3 ${progressBgClass}`} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low (1-2)</span>
                <span>Medium (3)</span>
                <span>High (4-5)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-xl shadow-sm bg-card text-card-foreground p-1">
            <CardHeader>
              <CardTitle className="text-lg">{metric.charAt(0).toUpperCase() + metric.slice(1)} Score Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" name="Score" stroke="hsl(var(--foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} label={{ value: 'Chatlog Count', angle: -90, position: 'insideLeft', offset: 0, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))'} }}/>
                  <Tooltip wrapperStyle={{ color: '#333', fontSize: '12px' }} contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                  <Bar dataKey="count" fill={barColor} name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Details Table Card for the Metric */}
        <Card className="rounded-xl shadow-sm bg-card text-card-foreground mt-6">
          <CardHeader>
            <CardTitle className="text-lg">All Chatlogs by {metric.charAt(0).toUpperCase() + metric.slice(1)} Score</CardTitle>
            <CardDescription className="text-muted-foreground">Sorted by {metric} score (ascending). Click 'View' to see chat.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    {currentColumns.map((columnDef) => (
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
                  {sortedData.length > 0 ? (
                    // Implement pagination for sortedData if it's long, or show all
                    sortedData.map((rowItem, rowIndex) => (
                      <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          {currentColumns.map((columnDef) => (
                            <td
                              key={String(columnDef.accessorKey)}
                              className="p-4 align-middle"
                            >
                              {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                            </td>
                          ))}
                        </tr>
                        {expandedChatlog?.tab === metric && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                          <tr className="bg-muted/50">
                            <td colSpan={currentColumns.length} className="p-2 border-t">
                              <ChatBubbleView chatlogText={rowItem.chatlog} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={currentColumns.length}
                        className="p-4 h-24 text-center text-muted-foreground"
                      >
                        No data available for this metric.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Add pagination controls for sortedData if needed */}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-app-bg min-h-screen text-app-text">
      <PageTitle
        title="Coherence, Politeness, & Relevance Details"
        description="Detailed analysis of CPR metrics across all evaluated chatlogs."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'coherence' | 'politeness' | 'relevance')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border rounded-lg shadow-sm">
          <TabsTrigger value="coherence" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Coherence</TabsTrigger>
          <TabsTrigger value="politeness" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Politeness</TabsTrigger>
          <TabsTrigger value="relevance" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Relevance</TabsTrigger>
        </TabsList>

        <TabsContent value="coherence" className="mt-6">
          {renderTabContent('coherence')}
        </TabsContent>
        <TabsContent value="politeness" className="mt-6">
          {renderTabContent('politeness')}
        </TabsContent>
        <TabsContent value="relevance" className="mt-6">
          {renderTabContent('relevance')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CPRDetailsPage;

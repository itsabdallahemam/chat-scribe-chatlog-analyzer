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

// Import Recharts components for Pie Chart
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector // Added Sector for active shape
} from 'recharts';

// Define types
interface EvaluationResultItem {
  chatlog: string;
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

// ExpandableChatlog component (assuming it's in ChatBubbleView.tsx or defined here)
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


const ResolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const [activeTab, setActiveTab] = useState<'resolved' | 'unresolved'>('resolved');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // For active pie segment

  const onPieEnter = useCallback((_: any, index: number) => { // _ for unused data param
    setActiveIndex(index);
  }, [setActiveIndex]);


  if (!evaluationResults || evaluationResults.length === 0) {
    // ... (no results message) ...
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

  const handleToggleChatlogView = (tab: string, originalIndex: number) => {
    if (expandedChatlog?.tab === tab && expandedChatlog?.originalIndex === originalIndex) {
      setExpandedChatlog(null);
    } else {
      setExpandedChatlog({ tab, originalIndex });
    }
  };

  const getColumns = (tabType: 'resolved' | 'unresolved'): ColumnDefinition<EvaluationResultItem>[] => [
    // ... (columns definition as before) ...
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
            onClick={() => handleToggleChatlogView(tabType, row.originalIndex as number)}
            className="border-app-blue text-app-blue hover:bg-app-blue-light hover:text-white"
          >
            {expandedChatlog?.tab === tabType && expandedChatlog?.originalIndex === row.originalIndex ? 'Hide' : 'View'}
          </Button>
        </div>
      )
    }
  ];

  // --- Updated Colors for Pie Chart ---
  const PIE_CHART_COLORS = {
    resolved: "#ffcc00", // A vibrant blue (Tailwind blue-500) - was app-blue
    unresolved: "#f1345d", // A vibrant yellow/amber (Tailwind amber-500) - was app-yellow
  };

  const pieData = [
    { name: 'Resolved', value: resolvedLogs.length, color: PIE_CHART_COLORS.resolved },
    { name: 'Unresolved', value: unresolvedLogs.length, color: PIE_CHART_COLORS.unresolved },
  ];

  // Custom Active Shape for Pie Chart
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos; // Adjusted for slight pop
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 15) * cos; // Line further out
    const my = cy + (outerRadius + 15) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 18; // Line length
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold" fontSize={16}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 3} // Make active segment slightly larger
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff" // White border for separation
          strokeWidth={2}
        />
        {/* Optional: Line and label for active segment - can be complex to position perfectly */}
        {/* <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{`${value} (${(percent * 100).toFixed(0)}%)`}</text> */}
      </g>
    );
  };


  const renderTabContent = (tabType: 'resolved' | 'unresolved') => {
    // ... (renderTabContent logic as before, using getColumns) ...
    const dataForTable = tabType === 'resolved' ? resolvedLogs : unresolvedLogs;
    const currentColumns = getColumns(tabType);

    return (
      <Card className="rounded-xl shadow-sm bg-card text-card-foreground mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {tabType === 'resolved' ? 'Resolved' : 'Unresolved'} Chatlogs ({dataForTable.length})
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Chatlogs marked as {tabType}. Click 'View' to see the full conversation.
          </CardDescription>
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
                {dataForTable.length > 0 ? (
                  dataForTable.map((rowItem, rowIndex) => (
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
                      {expandedChatlog?.tab === tabType && expandedChatlog?.originalIndex === rowItem.originalIndex && (
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
                      No {tabType} chatlogs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Add pagination controls here if dataForTable can be long */}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-app-bg min-h-screen text-app-text">
      <PageTitle
        title="Resolution Details"
        description="Analysis of resolved and unresolved customer service interactions."
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-sm bg-card text-card-foreground p-1">
          <CardHeader>
            <CardTitle className="text-lg">Resolution Rate Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Overall Resolution Rate</p>
              <div className="text-4xl font-bold text-app-text">
                {isNaN(resolutionRate) ? "N/A" : `${resolutionRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">{`${resolvedLogs.length} of ${totalValidLogs} resolved`}</p>
            </div>
            <Progress value={isNaN(resolutionRate) ? 0 : resolutionRate} className="h-3 [&>div]:bg-app-blue" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0% (Unresolved)</span>
              <span>100% (Resolved)</span>
            </div>
          </CardContent>
        </Card>

        {/* Modernized Pie Chart Card */}
        <Card className="rounded-xl shadow-sm bg-card text-card-foreground p-1">
          <CardHeader>
            <CardTitle className="text-lg">Resolution Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[230px] md:h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50} // Creates the donut hole
                  outerRadius={80} // Outer size of the pie
                  fill="#8884d8" // Default fill, overridden by Cell
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  paddingAngle={2} // Small gap between segments
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ fontSize: '12px' }}
                  contentStyle={{ background: 'hsl(var(--popover))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [`${value} (${(value / totalValidLogs * 100).toFixed(0)}%)`, name]}
                />
                 {/* Optional: Legend if labels on active shape are not enough */}
                {/* <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '10px'}} iconSize={10}/> */}
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Resolved/Unresolved Tables */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resolved' | 'unresolved')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border rounded-lg shadow-sm">
          <TabsTrigger value="resolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Resolved Chatlogs ({resolvedLogs.length})</TabsTrigger>
          <TabsTrigger value="unresolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Unresolved Chatlogs ({unresolvedLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resolved" className="mt-6">
          {renderTabContent('resolved')}
        </TabsContent>
        <TabsContent value="unresolved" className="mt-6">
          {renderTabContent('unresolved')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResolutionPage;

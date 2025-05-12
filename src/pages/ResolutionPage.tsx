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
import { Download, CheckCircle, AlertTriangle, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

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
  accessorKey: keyof TData | 'actions' | 'chatlogNumber';
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'unresolved' | 'resolved' | 'trends'>('unresolved');
  const [expandedChatlog, setExpandedChatlog] = useState<{ tab: string; originalIndex: number } | null>(null);
  
  // Pagination state
  const ITEMS_PER_PAGE = 5; // Show 5 items per page
  const [unresolvedCurrentPage, setUnresolvedCurrentPage] = useState(0);
  const [resolvedCurrentPage, setResolvedCurrentPage] = useState(0);

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
      accessorKey: 'chatlogNumber',
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

  // Pagination logic for unresolved table
  const unresolvedPageCount = Math.ceil(unresolvedLogs.length / ITEMS_PER_PAGE);
  const unresolvedStartIndex = unresolvedCurrentPage * ITEMS_PER_PAGE;
  const unresolvedEndIndex = Math.min(unresolvedStartIndex + ITEMS_PER_PAGE, unresolvedLogs.length);
  const unresolvedPageData = unresolvedLogs.slice(unresolvedStartIndex, unresolvedEndIndex);

  // Pagination logic for resolved table
  const resolvedPageCount = Math.ceil(resolvedLogs.length / ITEMS_PER_PAGE);
  const resolvedStartIndex = resolvedCurrentPage * ITEMS_PER_PAGE;
  const resolvedEndIndex = Math.min(resolvedStartIndex + ITEMS_PER_PAGE, resolvedLogs.length);
  const resolvedPageData = resolvedLogs.slice(resolvedStartIndex, resolvedEndIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">Resolution Details</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Deep dive into resolved and unresolved chatlogs, trends, and actionable insights.</p>
      </div>
      
      {/* Stat Cards - Full Width Row */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto mb-8">
        <div className="col-span-12 md:col-span-4">
          <div className={`relative rounded-2xl shadow-lg p-6 min-h-[180px] flex flex-col justify-between ${statCards[0].gradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
            <div className="flex justify-between items-start">
              <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{statCards[0].title}</div>
              <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow absolute top-4 right-4">
                {statCards[0].icon}
              </div>
            </div>
            <div className="mt-8">
              <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{statCards[0].value}</div>
              <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{statCards[0].subtitle}</div>
            </div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4">
          <div className={`relative rounded-2xl shadow-lg p-6 min-h-[180px] flex flex-col justify-between ${statCards[1].gradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
            <div className="flex justify-between items-start">
              <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{statCards[1].title}</div>
              <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow absolute top-4 right-4">
                {statCards[1].icon}
              </div>
            </div>
            <div className="mt-8">
              <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{statCards[1].value}</div>
              <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{statCards[1].subtitle}</div>
            </div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4">
          <div className={`relative rounded-2xl shadow-lg p-6 min-h-[180px] flex flex-col justify-between ${statCards[2].gradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
            <div className="flex justify-between items-start">
              <div className="text-lg font-semibold text-black/90 dark:text-white drop-shadow-sm">{statCards[2].title}</div>
              <div className="bg-white/60 dark:bg-gray-900/70 rounded-full p-2 shadow absolute top-4 right-4">
                {statCards[2].icon}
              </div>
            </div>
            <div className="mt-8">
              <div className="text-4xl font-bold text-black/90 dark:text-white drop-shadow-sm">{statCards[2].value}</div>
              <div className="text-sm text-black/60 dark:text-gray-300 font-medium">{statCards[2].subtitle}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Main Tabs Section */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl overflow-hidden h-full">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-2xl font-bold text-app-text dark:text-white">Resolution Insights</CardTitle>
              <CardDescription className="text-base text-app-text-secondary dark:text-gray-300">
                Explore unresolved, resolved, and trends in chatlog resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unresolved' | 'resolved' | 'trends')} className="w-full">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <TabsList className="grid w-full grid-cols-3 bg-card border rounded-lg shadow-sm">
                    <TabsTrigger value="unresolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Unresolved</TabsTrigger>
                    <TabsTrigger value="resolved" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Resolved</TabsTrigger>
                    <TabsTrigger value="trends" className="data-[state=active]:bg-app-blue data-[state=active]:text-white data-[state=active]:shadow-md">Trends</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  {/* Unresolved Tab */}
                  <TabsContent value="unresolved" className="mt-0">
                    <div className="grid grid-cols-12 gap-4 mb-6">
                      <div className="col-span-12">
                        <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                          <CardHeader className="pb-0 pt-4">
                            <CardTitle className="text-base font-medium text-app-text dark:text-white">
                              Unresolved Chatlogs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 pb-2 px-0">
                            <div className="rounded-md overflow-hidden">
                              <div className="[&_th]:bg-gray-50 dark:[&_th]:bg-gray-800/80 [&_th]:text-gray-500 dark:[&_th]:text-gray-300 [&_th]:font-medium [&_th]:text-xs [&_th]:border-gray-200 dark:[&_th]:border-gray-700 [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-gray-50/80 dark:[&_tr:hover]:bg-gray-800/30">
                                <table className="w-full caption-bottom text-sm">
                                  <thead>
                                    <tr>
                                      {getColumns('unresolved').map((columnDef) => (
                                        <th key={String(columnDef.accessorKey)} className="h-10 px-4 text-left align-middle">
                                          {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {unresolvedPageData.length > 0 ? (
                                      unresolvedPageData.map((rowItem, rowIndex) => (
                                        <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                                          <tr className="border-b transition-colors">
                                            {getColumns('unresolved').map((columnDef) => (
                                              <td key={String(columnDef.accessorKey)} className="p-2 align-middle">
                                                {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                              </td>
                                            ))}
                                          </tr>
                                          {expandedChatlog?.tab === 'unresolved' && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                            <tr key={rowItem.originalIndex + '-expanded'} className="bg-gray-50/80 dark:bg-gray-800/30">
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
                            
                            {/* Pagination Controls for Unresolved */}
                            {unresolvedPageCount > 1 && (
                              <div className="flex items-center justify-between mt-4 px-4 pt-2 pb-2 border-t dark:border-gray-700">
                                <div className="text-sm text-muted-foreground">
                                  Page {unresolvedCurrentPage + 1} of {unresolvedPageCount}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUnresolvedCurrentPage(0)}
                                    disabled={unresolvedCurrentPage === 0}
                                    className="dark:border-gray-700 h-8 w-8 p-0"
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUnresolvedCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={unresolvedCurrentPage === 0}
                                    className="dark:border-gray-700"
                                  >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUnresolvedCurrentPage(prev => Math.min(unresolvedPageCount - 1, prev + 1))}
                                    disabled={unresolvedCurrentPage >= unresolvedPageCount - 1}
                                    className="dark:border-gray-700"
                                  >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUnresolvedCurrentPage(unresolvedPageCount - 1)}
                                    disabled={unresolvedCurrentPage >= unresolvedPageCount - 1}
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
                  </TabsContent>

                  {/* Resolved Tab */}
                  <TabsContent value="resolved" className="mt-0">
                    <div className="grid grid-cols-12 gap-4 mb-6">
                      <div className="col-span-12">
                        <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                          <CardHeader className="pb-0 pt-4">
                            <CardTitle className="text-base font-medium text-app-text dark:text-white">
                              Resolved Chatlogs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 pb-2 px-0">
                            <div className="rounded-md overflow-hidden">
                              <div className="[&_th]:bg-gray-50 dark:[&_th]:bg-gray-800/80 [&_th]:text-gray-500 dark:[&_th]:text-gray-300 [&_th]:font-medium [&_th]:text-xs [&_th]:border-gray-200 dark:[&_th]:border-gray-700 [&_td]:border-gray-200 dark:[&_td]:border-gray-700 [&_tr:hover]:bg-gray-50/80 dark:[&_tr:hover]:bg-gray-800/30">
                                <table className="w-full caption-bottom text-sm">
                                  <thead>
                                    <tr>
                                      {getColumns('resolved').map((columnDef) => (
                                        <th key={String(columnDef.accessorKey)} className="h-10 px-4 text-left align-middle">
                                          {typeof columnDef.header === 'function' ? columnDef.header() : columnDef.header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {resolvedPageData.length > 0 ? (
                                      resolvedPageData.map((rowItem, rowIndex) => (
                                        <React.Fragment key={rowItem.originalIndex ?? rowIndex}>
                                          <tr className="border-b transition-colors">
                                            {getColumns('resolved').map((columnDef) => (
                                              <td key={String(columnDef.accessorKey)} className="p-2 align-middle">
                                                {columnDef.cell ? columnDef.cell(rowItem) : (rowItem[columnDef.accessorKey as keyof EvaluationResultItem] as React.ReactNode)}
                                              </td>
                                            ))}
                                          </tr>
                                          {expandedChatlog?.tab === 'resolved' && expandedChatlog?.originalIndex === rowItem.originalIndex && (
                                            <tr key={rowItem.originalIndex + '-expanded'} className="bg-gray-50/80 dark:bg-gray-800/30">
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
                            
                            {/* Pagination Controls for Resolved */}
                            {resolvedPageCount > 1 && (
                              <div className="flex items-center justify-between mt-4 px-4 pt-2 pb-2 border-t dark:border-gray-700">
                                <div className="text-sm text-muted-foreground">
                                  Page {resolvedCurrentPage + 1} of {resolvedPageCount}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResolvedCurrentPage(0)}
                                    disabled={resolvedCurrentPage === 0}
                                    className="dark:border-gray-700 h-8 w-8 p-0"
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResolvedCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={resolvedCurrentPage === 0}
                                    className="dark:border-gray-700"
                                  >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResolvedCurrentPage(prev => Math.min(resolvedPageCount - 1, prev + 1))}
                                    disabled={resolvedCurrentPage >= resolvedPageCount - 1}
                                    className="dark:border-gray-700"
                                  >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResolvedCurrentPage(resolvedPageCount - 1)}
                                    disabled={resolvedCurrentPage >= resolvedPageCount - 1}
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
                  </TabsContent>

                  {/* Trends Tab */}
                  <TabsContent value="trends" className="mt-0">
                    <div className="grid grid-cols-12 gap-4 mb-6">
                      <div className="col-span-12">
                        <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                          <CardHeader className="pb-0 pt-4">
                            <CardTitle className="text-base font-medium text-app-text dark:text-white">
                              Resolution Trends
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-[320px] py-4">
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
                                          <p className="font-medium">Chatlog: {label}</p>
                                          <p className="text-sm text-green-600 dark:text-green-400">Resolved: {payload[0].value as number}</p>
                                          <p className="text-sm text-amber-600 dark:text-amber-400">Unresolved: {payload[1].value as number}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="Resolved" fill={RESOLVED_COLOR} radius={[4, 4, 0, 0]} name="Resolved" />
                                <Bar dataKey="Unresolved" fill={UNRESOLVED_COLOR} radius={[4, 4, 0, 0]} name="Unresolved" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Scenario Resolution Breakdown */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12">
                        <Card className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm">
                          <CardHeader className="pb-0 pt-4">
                            <CardTitle className="text-base font-medium text-app-text dark:text-white">
                              Resolution Rate by Scenario
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="h-[320px] py-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={scenarioResolutionData}
                                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
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
                                      return (
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                          <p className="font-medium">{label}</p>
                                          <p className="text-sm">Resolution Rate: {Number(payload[0].value).toFixed(1)}%</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" name="Resolution Rate (%)" fill={RESOLVED_COLOR} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
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
                Lowest scoring unresolved chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                {needsAttention.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No unresolved chatlogs</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {needsAttention.map((item) => (
                      <div key={item.originalIndex} className="flex justify-between items-center py-2.5 px-1">
                        <div className="text-sm">Chatlog #{item.originalIndex! + 1}</div>
                        <div className="flex gap-1.5">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                            C: {item.coherence.toFixed(1)}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                            P: {item.politeness.toFixed(1)}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300">
                            R: {item.relevance.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Export Options */}
          <Card className="rounded-2xl border-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-app-text dark:text-white">Export Data</CardTitle>
              <CardDescription className="text-sm text-app-text-secondary dark:text-gray-300">
                Download chatlog analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  <Download className="w-4 h-4 mr-2 text-indigo-500" />
                  Export as CSV
                </Button>
                <Button
                  onClick={() => handleExport('excel')}
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  <Download className="w-4 h-4 mr-2 text-indigo-500" />
                  Export as Excel
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Navigation */}
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
                  Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/cpr-details')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  CPR Details
                </Button>
                <Button 
                  onClick={() => navigate('/satisfaction')} 
                  variant="outline"
                  className="w-full border-gray-200 dark:border-gray-800 justify-start text-sm"
                >
                  Satisfaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResolutionPage;

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { 
  Eye, 
  Calendar, 
  Star, 
  Filter, 
  SlidersHorizontal, 
  InfoIcon, 
  Check, 
  BarChart,
  AlertTriangle,
  FileText,
  Ban,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Progress } from './ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import api from '@/lib/axios';
import { ChatLogEvaluation, getAgentChatLogEvaluations } from '@/services/chatLogEvaluationService';
import ChatBubbleView from './ChatBubbleView';

// Helper function to generate a simple ID
const generateId = () => {
  return 'id_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Interface for evaluation model, extends ChatLogEvaluation to ensure compatibility
interface Evaluation {
  id: string;
  evaluationDate: string;
  model: string;
  overallScore: number;
  coherenceScore: number;
  politenessScore: number;
  relevanceScore: number;
  resolutionScore: number;
  feedbackNotes?: string;
  status: 'Completed' | 'In Progress' | 'Failed' | '';
  chatlog?: string; // Full chatlog text
  scenario?: string; // Scenario description
}

// Props for the component
interface EvaluationsTabProps {
  userId?: string;
}

const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ userId }) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterModel, setFilterModel] = useState<string>('all');
  const [noData, setNoData] = useState(false);
  
  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<'evaluationDate' | 'overallScore'>('evaluationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  
  const prevPage = () => {
    setCurrentPage(currentPage - 1);
  };
  
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        
        if (!userId) {
          setNoData(true);
          setLoading(false);
          return;
        }

        // Fetch evaluations using the chatLogEvaluationService
        try {
          console.log(`Fetching evaluations for user ${userId}`);
          const chatLogEvaluations = await getAgentChatLogEvaluations(userId);
          
          if (chatLogEvaluations && chatLogEvaluations.length > 0) {
            console.log(`Found ${chatLogEvaluations.length} evaluations for user ${userId}`);
            
            // Convert the ChatLogEvaluation objects to Evaluation format
            const formattedEvaluations: Evaluation[] = chatLogEvaluations.map(chatEval => ({
              id: chatEval.id || generateId(),
              evaluationDate: chatEval.dateTime || chatEval.createdAt || new Date().toISOString(), 
              model: chatEval.scenario || 'Unknown Scenario',
              overallScore: calculateAverageScore(chatEval),
              coherenceScore: chatEval.coherence,
              politenessScore: chatEval.politeness,
              relevanceScore: chatEval.relevance,
              resolutionScore: chatEval.resolution,
              feedbackNotes: chatEval.feedback,
              status: chatEval.status === 'Completed' ? '' : chatEval.status || '',
              chatlog: chatEval.chatlog,
              scenario: chatEval.scenario
            }));
            
            // Sort evaluations by dateTime, most recent first
            formattedEvaluations.sort((a, b) => 
              new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime()
            );
            
            setEvaluations(formattedEvaluations);
            setNoData(false);
          } else {
            console.log(`No evaluations found for user ${userId}`);
            setEvaluations([]);
            setNoData(true);
          }
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          
          if (apiError.response && apiError.response.status === 404) {
            // 404 means the endpoint doesn't exist or user has no evaluations
            console.warn('API endpoint returned 404. The user likely has no evaluations.');
            setEvaluations([]);
            setNoData(true);
          } else {
            // Other API errors
            setError('Failed to fetch evaluations: ' + (apiError.message || 'Unknown error'));
            setEvaluations([]);
            setNoData(true);
          }
        }
      } catch (error) {
        console.error('Error in evaluation component:', error);
        setError('Failed to fetch evaluations');
        setEvaluations([]);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluations();
  }, [userId]);
  
  // Helper function to calculate average score from evaluation metrics
  const calculateAverageScore = (chatEval: ChatLogEvaluation): number => {
    const { coherence, politeness, relevance, resolution } = chatEval;
    return Number(((coherence + politeness + relevance + resolution) / 4).toFixed(1));
  };
  
  // Handle opening the details dialog
  const handleViewDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setDialogOpen(true);
  };
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-gray-400';
    if (score >= 4.5) return 'text-green-600 dark:text-green-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  // Get background color based on score
  const getScoreBgColor = (score: number) => {
    if (score === 0) return 'bg-gray-100 text-gray-500';
    if (score >= 4.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 3.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };
  
  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score === 0) return 'bg-gray-300';
    if (score >= 4.5) return 'bg-green-600';
    if (score >= 3.5) return 'bg-blue-600';
    if (score >= 2.5) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Check className="h-3.5 w-3.5" />;
      case 'In Progress':
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case 'Failed':
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <InfoIcon className="h-3.5 w-3.5" />;
    }
  };
  
  // Apply filters
  const filteredEvaluations = evaluations.filter(evaluation => {
    const modelMatch = filterModel === 'all' || evaluation.model === filterModel;
    return modelMatch;
  });
  
  // Apply sorting
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    if (sortField === 'evaluationDate') {
      const dateA = new Date(a.evaluationDate).getTime();
      const dateB = new Date(b.evaluationDate).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'overallScore') {
      return sortDirection === 'asc' ? a.overallScore - b.overallScore : b.overallScore - a.overallScore;
    }
    return 0;
  });
  
  // Get current items for pagination
  const currentItems = sortedEvaluations.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);
  
  // Get unique scenarios for filter
  const uniqueScenarios = ['all', ...new Set(evaluations.map(e => e.model))];
  
  // Toggle sort direction
  const toggleSort = (field: 'evaluationDate' | 'overallScore') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Error Loading Evaluations</h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }
  
  if (noData || filteredEvaluations.length === 0) {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
        <FileText className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-amber-700 dark:text-amber-400 mb-2">
          {noData ? 'No Evaluation Data Uploaded' : 'No Matching Evaluations'}
        </h3>
        <p className="text-amber-600 dark:text-amber-500 mb-4">
          {noData 
            ? 'This agent has not uploaded any chat logs for evaluation yet.' 
            : 'No evaluations match your current filters.'}
        </p>
        {!noData && (
          <Button 
            variant="outline" 
            className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
            onClick={() => {
              setFilterModel('all');
            }}
          >
            <Ban className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
        {noData && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto mt-4">
            <p className="mb-2"><strong>To see evaluations:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              <li>Go to the <strong>Chat Evaluation</strong> page</li>
              <li>Upload CSV files with chat logs</li>
              <li>Run the evaluations using any available model</li>
            </ol>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-full md:w-[200px]">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-purple-500" />
              <SelectValue placeholder="Filter by scenario" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scenarios</SelectItem>
            {uniqueScenarios
              .filter(model => model !== 'all')
              .map(model => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>
        
        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => toggleSort('evaluationDate')}
          >
            <Calendar className="h-3.5 w-3.5" />
            Date
            {sortField === 'evaluationDate' && (
              sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => toggleSort('overallScore')}
          >
            <Star className="h-3.5 w-3.5" />
            Score
            {sortField === 'overallScore' && (
              sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Evaluations list */}
      <div className="space-y-3">
        {currentItems.map((evaluation) => (
          <div 
            key={evaluation.id} 
            className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <BarChart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[#252A3A] dark:text-white">{evaluation.model}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(evaluation.evaluationDate), 'MMM d, yyyy • h:mm a')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {evaluation.status !== 'Failed' && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className={`font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore.toFixed(1)}
                  </span>
                </div>
              )}
              
              {evaluation.status && (
                <Badge className={`px-2.5 py-1 ${getStatusColor(evaluation.status)}`}>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(evaluation.status)}
                    <span>{evaluation.status}</span>
                  </div>
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => handleViewDetails(evaluation)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center pt-4 text-sm text-gray-500 dark:text-gray-400">
        <div>
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEvaluations.length)} of {filteredEvaluations.length} evaluations
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Evaluation Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedEvaluation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Evaluation Details</DialogTitle>
                <DialogDescription className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {format(new Date(selectedEvaluation.evaluationDate), 'MMMM d, yyyy • h:mm a')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Header with model info and overall score */}
                <div className="flex flex-col md:flex-row md:items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/30">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="p-2 rounded-full bg-white dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mr-3">
                      <BarChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#252A3A] dark:text-purple-300">{selectedEvaluation.model}</h3>
                      {selectedEvaluation.status && (
                        <Badge className={`mt-1 ${getStatusColor(selectedEvaluation.status)}`}>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(selectedEvaluation.status)}
                            <span>{selectedEvaluation.status}</span>
                          </div>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {selectedEvaluation.status !== 'Failed' && (
                    <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 px-5 shadow-sm border border-purple-200 dark:border-purple-800/30">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Score</div>
                      <div className={`text-3xl font-bold ${getScoreColor(selectedEvaluation.overallScore)}`}>
                        {selectedEvaluation.overallScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">out of 5.0</div>
                    </div>
                  )}
                </div>
                
                {selectedEvaluation.status === 'Failed' ? (
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Evaluation Failed</h3>
                    <p className="text-red-600 dark:text-red-300">
                      This evaluation could not be completed. This may be due to issues with the chat log format or system errors.
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="scores">
                    <TabsList className="mb-4">
                      <TabsTrigger value="scores">Scores & Metrics</TabsTrigger>
                      <TabsTrigger value="feedback">Feedback & Notes</TabsTrigger>
                      <TabsTrigger value="chatlog">View Chatlog</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="scores">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Individual metrics cards */}
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Coherence</CardTitle>
                            <CardDescription>How well the conversation flows</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-2xl font-bold ${getScoreColor(selectedEvaluation.coherenceScore)}`}>
                                {selectedEvaluation.coherenceScore.toFixed(1)}
                              </span>
                              <Badge className={getScoreBgColor(selectedEvaluation.coherenceScore)}>
                                {selectedEvaluation.coherenceScore >= 4.5 ? 'Excellent' : 
                                 selectedEvaluation.coherenceScore >= 3.5 ? 'Good' : 
                                 selectedEvaluation.coherenceScore >= 2.5 ? 'Average' : 'Poor'}
                              </Badge>
                            </div>
                            <Progress 
                              value={selectedEvaluation.coherenceScore * 20} 
                              className={`h-2 ${getProgressColor(selectedEvaluation.coherenceScore)}`}
                            />
                          </CardContent>
                        </Card>
                        
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Politeness</CardTitle>
                            <CardDescription>Courtesy and respectfulness</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-2xl font-bold ${getScoreColor(selectedEvaluation.politenessScore)}`}>
                                {selectedEvaluation.politenessScore.toFixed(1)}
                              </span>
                              <Badge className={getScoreBgColor(selectedEvaluation.politenessScore)}>
                                {selectedEvaluation.politenessScore >= 4.5 ? 'Excellent' : 
                                 selectedEvaluation.politenessScore >= 3.5 ? 'Good' : 
                                 selectedEvaluation.politenessScore >= 2.5 ? 'Average' : 'Poor'}
                              </Badge>
                            </div>
                            <Progress 
                              value={selectedEvaluation.politenessScore * 20} 
                              className={`h-2 ${getProgressColor(selectedEvaluation.politenessScore)}`}
                            />
                          </CardContent>
                        </Card>
                        
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Relevance</CardTitle>
                            <CardDescription>Addressing customer's questions</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-2xl font-bold ${getScoreColor(selectedEvaluation.relevanceScore)}`}>
                                {selectedEvaluation.relevanceScore.toFixed(1)}
                              </span>
                              <Badge className={getScoreBgColor(selectedEvaluation.relevanceScore)}>
                                {selectedEvaluation.relevanceScore >= 4.5 ? 'Excellent' : 
                                 selectedEvaluation.relevanceScore >= 3.5 ? 'Good' : 
                                 selectedEvaluation.relevanceScore >= 2.5 ? 'Average' : 'Poor'}
                              </Badge>
                            </div>
                            <Progress 
                              value={selectedEvaluation.relevanceScore * 20} 
                              className={`h-2 ${getProgressColor(selectedEvaluation.relevanceScore)}`}
                            />
                          </CardContent>
                        </Card>
                        
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Resolution</CardTitle>
                            <CardDescription>Problem-solving effectiveness</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-2xl font-bold ${getScoreColor(selectedEvaluation.resolutionScore)}`}>
                                {selectedEvaluation.resolutionScore.toFixed(1)}
                              </span>
                              <Badge className={getScoreBgColor(selectedEvaluation.resolutionScore)}>
                                {selectedEvaluation.resolutionScore >= 4.5 ? 'Excellent' : 
                                 selectedEvaluation.resolutionScore >= 3.5 ? 'Good' : 
                                 selectedEvaluation.resolutionScore >= 2.5 ? 'Average' : 'Poor'}
                              </Badge>
                            </div>
                            <Progress 
                              value={selectedEvaluation.resolutionScore * 20} 
                              className={`h-2 ${getProgressColor(selectedEvaluation.resolutionScore)}`}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="feedback">
                      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Feedback Notes</CardTitle>
                          <CardDescription>
                            Auto-generated recommendations and observations
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {selectedEvaluation.feedbackNotes ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                {selectedEvaluation.feedbackNotes}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                              No feedback notes available for this evaluation.
                            </div>
                          )}
                          
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                            <ul className="space-y-2 text-sm">
                              {selectedEvaluation.relevanceScore < 4.0 && (
                                <li className="flex items-start">
                                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-2 mt-0.5">
                                    <InfoIcon className="h-3 w-3" />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Focus on addressing the customer's questions more directly.
                                  </span>
                                </li>
                              )}
                              {selectedEvaluation.resolutionScore < 4.0 && (
                                <li className="flex items-start">
                                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-2 mt-0.5">
                                    <InfoIcon className="h-3 w-3" />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Work on resolving issues more efficiently to improve resolution score.
                                  </span>
                                </li>
                              )}
                              {(selectedEvaluation.politenessScore >= 4.0 && selectedEvaluation.coherenceScore >= 4.0) && (
                                <li className="flex items-start">
                                  <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-2 mt-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Strong communication style and politeness. Keep up the good work!
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="chatlog">
                      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-base">Chat Log</CardTitle>
                              <CardDescription>
                                Complete conversation transcript
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedEvaluation.scenario && (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1">
                                  {selectedEvaluation.scenario}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {selectedEvaluation.chatlog ? (
                            <ChatBubbleView chatlogText={selectedEvaluation.chatlog} />
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No chat log available for this evaluation.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationsTab; 
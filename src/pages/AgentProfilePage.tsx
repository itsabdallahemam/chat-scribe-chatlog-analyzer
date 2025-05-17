import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Mail, Calendar, ArrowLeft, User as UserIcon, BarChart2, CheckCircle, Trash2, Shield, Bell, Flag, Star, MessageSquare, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { User as UserType } from '@/lib/types';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import RatingsTab from '@/components/RatingsTab';
import { useAuth } from '@/contexts/AuthContext';
import EvaluationsTab from '@/components/EvaluationsTab';
import { ChatLogEvaluation } from '@/services/chatLogEvaluationService';

// Extend the UserType interface to include employeeId
declare global {
  interface User extends UserType {
    employeeId?: string;
  }
}

// Performance stats interface
interface PerformanceStats {
  averageScore: number;
  completedChats: number;
  resolutionRate: number;
  responseTime: number;
}

const AgentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [agent, setAgent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('performance');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    averageScore: 0,
    completedChats: 0,
    resolutionRate: 0,
    responseTime: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Check if user is viewing their own profile
  const isSelfView = currentUser?.id === id;
  // Check if user is a Team Leader
  const isTeamLeader = currentUser?.role === 'Team Leader';

  useEffect(() => {
    const fetchAgentProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get<User>(`/auth/users/${id}`);
        setAgent(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch agent profile');
        console.error('Error fetching agent profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAgentProfile();
    }
  }, [id]);

  useEffect(() => {
    const fetchPerformanceStats = async () => {
      if (!id) return;
      
      try {
        setStatsLoading(true);
        // Try to fetch evaluations to calculate metrics
        const response = await api.get<ChatLogEvaluation[]>(`/chat-log-evaluations/user/${id}`);
        const evaluations: ChatLogEvaluation[] = response.data || [];
        
        if (evaluations.length > 0) {
          // Calculate average score
          const totalScore = evaluations.reduce((sum: number, evaluation: ChatLogEvaluation) => 
            sum + ((evaluation.coherence + evaluation.politeness + evaluation.relevance + evaluation.resolution) / 4), 0);
          const avgScore = Number((totalScore / evaluations.length).toFixed(1));
          
          // Calculate resolution rate
          const resolvedChats = evaluations.filter((evaluation: ChatLogEvaluation) => evaluation.resolution >= 4).length;
          const resolutionRate = Math.round((resolvedChats / evaluations.length) * 100);
          
          // Get completed chats count (assuming all evaluations are from the last 30 days)
          const completedChats = evaluations.length;
          
          // For response time, we'd normally calculate from actual data
          // Using a placeholder value for now
          const responseTime = 1.8;
          
          setPerformanceStats({
            averageScore: avgScore,
            completedChats,
            resolutionRate,
            responseTime
          });
        }
      } catch (err) {
        console.error('Error fetching performance stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchPerformanceStats();
  }, [id]);

  const handleGoBack = () => {
    // If Team Leader, go back to agents dashboard
    // If Agent viewing self, go back to profile
    if (isTeamLeader) {
      navigate('/agents-dashboard');
    } else {
      navigate('/profile');
    }
  };

  const handleDeleteAgent = async () => {
    if (!agent) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/auth/users/${id}`);
      toast({
        title: "Agent deleted",
        description: `${agent.fullName || agent.email} has been deleted successfully.`,
      });
      navigate('/agents-dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete agent';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      {/* Header Section with Improved Alignment */}
      <div className="mb-6 max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={handleGoBack} 
          className="mb-6 group hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:text-blue-500" />
          <span className="group-hover:text-blue-500">
            {isTeamLeader ? 'Back to Agents Dashboard' : 'Back to Profile'}
          </span>
        </Button>

        {agent && !loading && !error && (
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-md">
                <AvatarFallback className="bg-blue-500 text-white text-lg">
                  {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">
                  {isSelfView ? 'Your Profile' : agent.fullName || 'Unnamed Agent'}
                </h1>
                <p className="mt-1 text-[#667085] dark:text-gray-300">
                  {isSelfView 
                    ? 'View and manage your profile information and performance metrics.' 
                    : `View ${agent.fullName || 'this agent'}'s profile and performance metrics.`}
                </p>
              </div>
            </div>
            <Badge 
              className={`mt-2 md:mt-0 md:ml-auto px-4 py-2 rounded-lg flex items-center ${
                agent.role === 'Team Leader' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {agent.role === 'Team Leader' ? (
                <><UserIcon className="h-4 w-4 mr-2" /> Team Leader</>
              ) : (
                <><UserIcon className="h-4 w-4 mr-2" /> Agent</>
              )}
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onBack={handleGoBack} />
      ) : agent ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Agent Info Card - 3 columns on desktop */}
          <div className="md:col-span-3">
            <Card className="border-border/40 shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-white/90 dark:ring-gray-800 shadow-md">
                    <AvatarFallback className="bg-blue-500 text-white text-2xl">
                      {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl text-[#252A3A] dark:text-white mb-1">
                    {isSelfView ? 'Your Profile' : agent.fullName || 'Unnamed Agent'}
                  </CardTitle>
                  <div className="text-sm text-[#667085] dark:text-gray-400 mt-1 mb-3">{agent.email}</div>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1">
                    {agent.role}
                  </Badge>
                </div>
                
                <div className="p-5">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3 text-[#252A3A] dark:text-white">Account Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                            <User className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                          </div>
                          <span className="text-[#667085] dark:text-gray-300 flex-1">Full Name</span>
                          <span className="font-medium text-[#252A3A] dark:text-white">{agent.fullName || 'Not set'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                            <Mail className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />
                          </div>
                          <span className="text-[#667085] dark:text-gray-300 flex-1">Email</span>
                          <span className="font-medium text-[#252A3A] dark:text-white">{agent.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-3">
                            <Calendar className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                          </div>
                          <span className="text-[#667085] dark:text-gray-300 flex-1">Joined</span>
                          <span className="font-medium text-[#252A3A] dark:text-white">{format(new Date(agent.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3 text-[#252A3A] dark:text-blue-300">Quick Actions</h3>
                      <div className="space-y-2">
                        {/* Removed 'View Dashboard' button for agents, replaced with 'View Performance' button */}
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-start border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/20"
                          size="sm"
                          onClick={() => setActiveTab && setActiveTab('performance')}
                        >
                          <BarChart2 className="h-3.5 w-3.5 mr-2" />
                          View Performance
                        </Button>
                        {isTeamLeader && (
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-start border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/20"
                            size="sm"
                            onClick={() => navigate('/agents-dashboard')}
                          >
                            <User className="h-3.5 w-3.5 mr-2" />
                            Manage Agents
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Only show delete button for Team Leaders */}
                    {isTeamLeader && !isSelfView && (
                      <Button 
                        variant="destructive" 
                        className="w-full flex items-center justify-center"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Agent
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - 9 columns on desktop */}
          <div className="md:col-span-9">
            <Card className="border-border/40 shadow-md h-full">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-medium text-[#252A3A] dark:text-white">
                  {isSelfView ? 'Your Performance' : 'Agent Details'}
                </h3>
                <CardDescription>
                  {isSelfView 
                    ? 'Track your performance metrics and evaluation results' 
                    : `View ${agent.fullName || 'this agent'}'s performance metrics and evaluation results`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 p-1 bg-gray-100 dark:bg-gray-800">
                    {/* Only show overview tab for Team Leaders */}
                    {(isTeamLeader || !isSelfView) && (
                      <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                        <User className="h-4 w-4" />
                        Overview
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                      <BarChart2 className="h-4 w-4" />
                      Performance
                    </TabsTrigger>
                    {/* Only show evaluations tab for Team Leaders */}
                    {(isTeamLeader || !isSelfView) && (
                      <TabsTrigger value="evaluations" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                        <CheckCircle className="h-4 w-4" />
                        Evaluations
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Only render overview tab for Team Leaders */}
                  {(isTeamLeader || !isSelfView) && (
                    <TabsContent value="overview">
                      <div className="space-y-6">
                        {/* Agent Stats */}
                        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 p-5 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-3">
                              <User className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-medium text-[#252A3A] dark:text-blue-300">Agent Profile</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Full Name</div>
                                <span className="text-[#252A3A] dark:text-white font-medium">{agent.fullName}</span>
                              </div>
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Email</div>
                                <span className="text-[#252A3A] dark:text-white font-medium">{agent.email}</span>
                              </div>
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Role</div>
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {agent.role}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Status</div>
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Active
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Joined</div>
                                <span className="text-[#252A3A] dark:text-white font-medium">
                                  {agent.createdAt ? format(new Date(agent.createdAt), 'MMM d, yyyy') : 'Not available'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                                <div className="text-sm text-[#667085] dark:text-gray-400">Employee ID</div>
                                <span className="text-[#252A3A] dark:text-white font-medium">
                                  {agent.employeeId || agent.id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Added button to view performance directly */}
                        <div className="flex justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border-blue-200 dark:border-blue-800/30"
                            onClick={() => setActiveTab('performance')}
                          >
                            <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                            View Performance Metrics
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                  
                  <TabsContent value="performance">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-3">
                            <BarChart2 className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-medium text-[#252A3A] dark:text-blue-300">Performance Metrics</h3>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-900/60 p-5 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                          <p className="text-sm text-[#667085] dark:text-gray-400 mb-4">
                            These metrics are calculated from <strong>{agent.fullName || "this agent"}'s</strong> chat evaluations.
                            The ratings reflect customer interactions across different metrics.
                          </p>
                          <RatingsTab userId={id} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Only render evaluations tab for Team Leaders */}
                  {(isTeamLeader || !isSelfView) && (
                    <TabsContent value="evaluations">
                      <div className="rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/30 p-5 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="p-2 rounded-full bg-white/60 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mr-3">
                            <Flag className="h-5 w-5" />
                          </div>
                          <h3 className="text-base font-medium text-[#252A3A] dark:text-purple-300">Recent Evaluations</h3>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg p-5">
                          <EvaluationsTab userId={id} />
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/40 shadow-md max-w-2xl mx-auto">
          <CardHeader className="text-center pb-2">
            <CardTitle>Agent Not Found</CardTitle>
            <CardDescription>The agent you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-2">
            <Button variant="default" onClick={handleGoBack}>
              {isTeamLeader ? 'Return to Agents Dashboard' : 'Return to Profile'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {agent?.fullName || agent?.email} and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <span className="animate-spin">⊚</span>
                </>
              ) : (
                'Delete Agent'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
    {/* Left column - Agent info card */}
    <div className="md:col-span-3">
      <Card className="border-border/40 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mx-auto mb-2" />
            <Skeleton className="h-4 w-60 mx-auto mb-3" />
            <Skeleton className="h-6 w-20 mx-auto mb-6" />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-3">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Right column - Details content */}
    <div className="md:col-span-9">
      <Card className="border-border/40 shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ error, onBack }: { error: string; onBack: () => void }) => (
  <Card className="border-red-200/40 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 shadow-sm max-w-2xl mx-auto">
    <CardHeader className="text-center pb-2">
      <CardTitle className="text-red-700 dark:text-red-400">Error Loading Profile</CardTitle>
      <CardDescription className="text-red-600 dark:text-red-500">{error}</CardDescription>
    </CardHeader>
    <CardFooter className="flex justify-center pt-2">
      <Button variant="outline" onClick={onBack} className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
        Return to Agents Dashboard
      </Button>
    </CardFooter>
  </Card>
);

export default AgentProfilePage;
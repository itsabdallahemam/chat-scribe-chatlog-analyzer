import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Mail, Calendar, ArrowLeft, User as UserIcon, BarChart2, CheckCircle, Trash2 } from 'lucide-react';
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

const AgentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [agent, setAgent] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('performance');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if user is viewing their own profile
  const isSelfView = currentUser?.id === id;
  // Check if user is a Team Leader
  const isTeamLeader = currentUser?.role === 'Team Leader';

  useEffect(() => {
    const fetchAgentProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get<UserType>(`/auth/users/${id}`);
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
    <div className="container py-10">
      <Button 
        variant="ghost" 
        onClick={handleGoBack} 
        className="mb-6 group hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:text-blue-500" />
        <span className="group-hover:text-blue-500">
          {isTeamLeader ? 'Back to Agents Dashboard' : 'Back to Profile'}
        </span>
      </Button>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onBack={handleGoBack} />
      ) : agent ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent Info Card */}
          <Card className="border border-gray-200 dark:border-gray-800 md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-md">
                  <AvatarFallback className="bg-blue-500 text-white text-2xl">
                    {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">
                {isSelfView ? 'Your Profile' : agent.fullName || 'Unnamed Agent'}
              </CardTitle>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{agent.email}</div>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1">
                {agent.role}
              </Badge>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
                  <h3 className="text-sm font-medium mb-3">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 flex-1">Full Name</span>
                      <span className="font-medium">{agent.fullName || 'Not set'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 flex-1">Email</span>
                      <span className="font-medium">{agent.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300 flex-1">Joined</span>
                      <span className="font-medium">{format(new Date(agent.createdAt), 'MMM d, yyyy')}</span>
                    </div>
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
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="border border-gray-200 dark:border-gray-800 h-full">
              <CardHeader>
                <h3 className="text-lg font-medium">
                  {isSelfView ? 'Your Performance' : 'Agent Details'}
                </h3>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    {/* Only show overview tab for Team Leaders */}
                    {(isTeamLeader || !isSelfView) && (
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Overview
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="performance" className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Performance
                    </TabsTrigger>
                    {/* Only show evaluations tab for Team Leaders */}
                    {(isTeamLeader || !isSelfView) && (
                      <TabsTrigger value="evaluations" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Evaluations
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Only render overview tab for Team Leaders */}
                  {(isTeamLeader || !isSelfView) && (
                    <TabsContent value="overview">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 text-center">
                        <p className="text-gray-600 dark:text-gray-300">
                          Additional agent information and statistics will be displayed here.
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          This feature is under development.
                        </p>
                      </div>
                    </TabsContent>
                  )}
                  
                  <TabsContent value="performance">
                    <RatingsTab userId={id} />
                  </TabsContent>
                  
                  {/* Only render evaluations tab for Team Leaders */}
                  {(isTeamLeader || !isSelfView) && (
                    <TabsContent value="evaluations">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 text-center">
                        <p className="text-gray-600 dark:text-gray-300">
                          Chat log evaluations and feedback will be displayed here.
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          This feature is under development.
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
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
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Left column - Agent info card */}
    <Card className="border border-gray-200 dark:border-gray-800 md:col-span-1">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <Skeleton className="h-6 w-40 mx-auto" />
        <Skeleton className="h-4 w-60 mx-auto mt-2 mb-3" />
        <Skeleton className="h-6 w-20 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
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

    {/* Right column - Details content */}
    <Card className="border border-gray-200 dark:border-gray-800 md:col-span-2">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </CardContent>
    </Card>
  </div>
);

// Error State Component
const ErrorState = ({ error, onBack }: { error: string; onBack: () => void }) => (
  <Card className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 shadow-sm">
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
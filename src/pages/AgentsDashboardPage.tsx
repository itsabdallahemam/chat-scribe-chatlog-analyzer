import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { User as UserType } from '@/lib/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getUserPerformanceMetrics, PerformanceMetrics } from '@/services/performanceService';

// Interface for agent with performance metrics
interface AgentWithMetrics extends UserType {
  performanceMetrics?: PerformanceMetrics;
}

const AgentsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await api.get<UserType[]>('/auth/users');
        // Filter out team leaders, only show agents
        const agentsList = response.data.filter(user => user.role === 'Agent');
        
        // Fetch performance metrics for each agent
        const agentsWithMetrics = await Promise.all(
          agentsList.map(async (agent) => {
            try {
              const metrics = await getUserPerformanceMetrics(agent.id);
              return { ...agent, performanceMetrics: metrics };
            } catch (err) {
              console.error(`Error fetching metrics for agent ${agent.id}:`, err);
              return agent;
            }
          })
        );
        
        setAgents(agentsWithMetrics);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch agents');
        console.error('Error fetching agents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent => 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (agent.fullName && agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Add a function to handle row clicks
  const handleAgentClick = (agentId: string) => {
    navigate(`/agent/${agentId}`);
  };

  // Helper function to get rating color
  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-500 dark:text-gray-400';
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="container py-10">
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Agents Dashboard</CardTitle>
              <CardDescription className="mt-1 text-gray-500 dark:text-gray-400">
                Manage and monitor your team of agents
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search agents..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-md border border-gray-200 dark:border-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[140px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-[80px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <TableRow 
                      key={agent.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => handleAgentClick(agent.id)}
                    >
                      <TableCell>
                        <Avatar className="h-10 w-10 bg-primary/10">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-blue-500 mr-2" />
                          {agent.fullName || 'No name set'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                          {agent.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                          {format(new Date(agent.createdAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className={`font-bold ${getRatingColor(agent.performanceMetrics?.averageScore)}`}>
                            {agent.performanceMetrics?.averageScore ? agent.performanceMetrics.averageScore.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {agent.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
                          <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No agents found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'Try adjusting your search terms' : 'No agents have been added yet'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentsDashboardPage; 
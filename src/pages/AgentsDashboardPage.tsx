import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Search, Star, ArrowUpDown, FilterX, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axios';
import { User as UserType } from '@/lib/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getUserPerformanceMetrics, PerformanceMetrics } from '@/services/performanceService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface for agent with performance metrics
interface AgentWithMetrics extends UserType {
  performanceMetrics?: PerformanceMetrics;
}

// Type for sort direction
type SortDirection = 'asc' | 'desc';

// Type for sort field
type SortField = 'name' | 'joinDate' | 'rating';

// Type for rating filter
type RatingFilter = 'all' | '4+' | '3+' | 'below3';

const AgentsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filtering state
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

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

  // Toggle sort direction or set a new sort field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply search filter
  const searchFilteredAgents = agents.filter(agent => 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (agent.fullName && agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Apply rating filter
  const ratingFilteredAgents = searchFilteredAgents.filter(agent => {
    const rating = agent.performanceMetrics?.averageScore;
    
    switch (ratingFilter) {
      case '4+':
        return rating !== undefined && rating >= 4.0;
      case '3+':
        return rating !== undefined && rating >= 3.0 && rating < 4.0;
      case 'below3':
        return rating !== undefined && rating < 3.0;
      case 'all':
      default:
        return true;
    }
  });

  // Apply sorting
  const sortedAgents = [...ratingFilteredAgents].sort((a, b) => {
    if (sortField === 'name') {
      const nameA = a.fullName || a.email;
      const nameB = b.fullName || b.email;
      
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    } 
    else if (sortField === 'joinDate') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    }
    else if (sortField === 'rating') {
      const ratingA = a.performanceMetrics?.averageScore || 0;
      const ratingB = b.performanceMetrics?.averageScore || 0;
      
      if (sortDirection === 'asc') {
        return ratingA - ratingB;
      } else {
        return ratingB - ratingA;
      }
    }
    
    return 0;
  });

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

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortField('name');
    setSortDirection('asc');
    setRatingFilter('all');
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
            
            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Rating filter */}
              <div className="flex items-center gap-2">
                <Select value={ratingFilter} onValueChange={(value) => setRatingFilter(value as RatingFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <div className="flex items-center">
                      <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter by rating" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4+">4.0 and above</SelectItem>
                    <SelectItem value="3+">3.0 to 3.9</SelectItem>
                    <SelectItem value="below3">Below 3.0</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Reset filters button */}
                {(searchTerm || ratingFilter !== 'all' || sortField !== 'name' || sortDirection !== 'asc') && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={resetFilters}
                    className="h-10 w-10 text-gray-500"
                    title="Reset filters"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'name' ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('joinDate')}
                    >
                      Joined
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'joinDate' ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort('rating')}
                    >
                      Rating
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === 'rating' ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                  </TableHead>
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
                ) : sortedAgents.length > 0 ? (
                  sortedAgents.map((agent) => (
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
                          {searchTerm || ratingFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'No agents have been added yet'
                          }
                        </p>
                        {(searchTerm || ratingFilter !== 'all') && (
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={resetFilters}
                          >
                            <FilterX className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                        )}
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
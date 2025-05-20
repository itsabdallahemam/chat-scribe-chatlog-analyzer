import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Team, User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, UserPlus, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const ManagerHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalAgents: 0,
    totalLeaders: 0,
    unassignedAgents: 0,
    averageTeamSize: 0,
    teamUtilization: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, usersRes] = await Promise.all([
          api.get<Team[]>('/team/all'),
          api.get<User[]>('/auth/users'),
        ]);
        setTeams(teamsRes.data);
        setUsers(usersRes.data);
        
        // Calculate stats
        const agents = usersRes.data.filter(u => u.role === 'Agent');
        const leaders = usersRes.data.filter(u => u.role === 'Team Leader');
        const assignedAgentIds = new Set(
          teamsRes.data.flatMap(team => team.agents?.map(agent => agent.id) || [])
        );
        
        const totalAgents = agents.length;
        const assignedAgents = agents.filter(agent => assignedAgentIds.has(agent.id)).length;
        const averageTeamSize = teamsRes.data.length > 0 
          ? teamsRes.data.reduce((acc, team) => acc + (team.agents?.length || 0), 0) / teamsRes.data.length 
          : 0;
        
        setStats({
          totalTeams: teamsRes.data.length,
          totalAgents,
          totalLeaders: leaders.length,
          unassignedAgents: totalAgents - assignedAgents,
          averageTeamSize: Math.round(averageTeamSize * 10) / 10,
          teamUtilization: totalAgents > 0 ? Math.round((assignedAgents / totalAgents) * 100) : 0
        });
        
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch data';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Card */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.fullName || 'Manager'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <Badge variant="secondary" className="mt-1">Manager</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teams')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Teams</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all teams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teams/create')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UserPlus className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Team</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Set up a new team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold">View Analytics</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check team performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Overview</CardTitle>
              <CardDescription>Current team statistics and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Team Utilization</span>
                    <span className="text-sm font-medium">{stats.teamUtilization}%</span>
                  </div>
                  <Progress value={stats.teamUtilization} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Teams</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalTeams}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Team Size</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.averageTeamSize}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Management</CardTitle>
              <CardDescription>Agent and leader distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Agents</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalAgents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Leaders</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.totalLeaders}</p>
                  </div>
                </div>
                {stats.unassignedAgents > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unassigned Agents</AlertTitle>
                    <AlertDescription>
                      {stats.unassignedAgents} agent{stats.unassignedAgents === 1 ? ' is' : 's are'} not assigned to any team.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Teams</CardTitle>
            <CardDescription>Your most recently updated teams</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-700" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">No teams found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.slice(0, 6).map((team) => (
                  <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/teams')}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">{team.name}</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Leader: {team.leader?.fullName || team.leader?.email || 'Unassigned'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Agents: {team.agents?.length || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerHomePage;

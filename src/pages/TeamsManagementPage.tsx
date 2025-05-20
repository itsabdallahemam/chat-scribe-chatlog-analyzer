import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Team, User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TeamsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editLeaderId, setEditLeaderId] = useState<string>('__none__');
  const [editAgentIds, setEditAgentIds] = useState<string[]>([]);
  const [editTeamName, setEditTeamName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalAgents: 0,
    totalLeaders: 0,
    unassignedAgents: 0
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
        
        // Get all agent IDs that are assigned to teams
        const assignedAgentIds = new Set(
          teamsRes.data.flatMap(team => team.agents?.map(agent => agent.id) || [])
        );
        
        setStats({
          totalTeams: teamsRes.data.length,
          totalAgents: agents.length,
          totalLeaders: leaders.length,
          unassignedAgents: agents.filter(agent => !assignedAgentIds.has(agent.id)).length
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

  const openEditModal = (team: Team) => {
    setEditTeamId(team.id);
    setEditLeaderId(team.leader?.id || '__none__');
    setEditAgentIds(team.agents?.map(a => a.id) || []);
    setEditTeamName(team.name);
  };

  const closeEditModal = () => {
    setEditTeamId(null);
    setEditLeaderId('__none__');
    setEditAgentIds([]);
    setEditTeamName('');
  };

  const handleSaveEdit = async () => {
    if (!editTeamId) return;
    
    setIsUpdating(true);
    try {
      const response = await api.post<Team>('/team/update', {
        teamId: editTeamId,
        name: editTeamName,
        leaderId: editLeaderId === '__none__' ? null : editLeaderId,
        agentIds: editAgentIds
      });

      // Update the teams list with the updated team
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === editTeamId ? response.data : team
        )
      );

      // Update stats
      const assignedAgentIds = new Set(
        teams.map(team => team.agents?.map(agent => agent.id) || []).flat()
      );
      setStats(prev => ({
        ...prev,
        unassignedAgents: users.filter(u => u.role === 'Agent' && !assignedAgentIds.has(u.id)).length
      }));

      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      
      closeEditModal();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update team';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await api.delete(`/team/${teamId}`);
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      
      // Update stats
      const assignedAgentIds = new Set(
        teams.filter(team => team.id !== teamId)
          .flatMap(team => team.agents?.map(agent => agent.id) || [])
      );
      setStats(prev => ({
        ...prev,
        totalTeams: prev.totalTeams - 1,
        unassignedAgents: users.filter(u => u.role === 'Agent' && !assignedAgentIds.has(u.id)).length
      }));
      
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete team';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setShowDeleteConfirm(null);
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.leader?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.leader?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.agents?.some(agent => 
      agent.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">Team Management</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Create teams, assign team leaders and agents, and manage all teams in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teams</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalTeams}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Agents</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalAgents}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Leaders</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalLeaders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned Agents</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.unassignedAgents}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search teams, leaders, or agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button onClick={() => navigate('/teams/create')} variant="default" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Team
              </Button>
            </div>

            {stats.unassignedAgents > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unassigned Agents</AlertTitle>
                <AlertDescription>
                  There {stats.unassignedAgents === 1 ? 'is' : 'are'} {stats.unassignedAgents} unassigned agent{stats.unassignedAgents === 1 ? '' : 's'}.
                  Consider assigning them to teams.
                </AlertDescription>
              </Alert>
            )}

            {/* Teams Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-700" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? 'No teams match your search.' : 'No teams found.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.leader ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-blue-600 dark:text-blue-300">
                                  {team.leader.fullName || team.leader.email}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Team Leader</p>
                                <p className="text-xs text-gray-500">{team.leader.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {team.agents?.length ? (
                            team.agents.map(a => (
                              <TooltipProvider key={a.id}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                                      {a.fullName || a.email}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Agent</p>
                                    <p className="text-xs text-gray-500">{a.email}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-gray-500">No agents</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={team.agents?.length ? "success" : "secondary"}>
                          {team.agents?.length ? `${team.agents.length} agent${team.agents.length === 1 ? '' : 's'}` : 'No agents'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEditModal(team)} 
                            disabled={user?.role !== 'Manager'}
                          >
                            Manage
                          </Button>
                          {user?.role === 'Manager' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setShowDeleteConfirm(team.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Team Dialog */}
        <Dialog open={!!editTeamId} onOpenChange={(open) => {
          if (!open && !isUpdating) {
            closeEditModal();
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update team details, leader, and assign agents to this team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Leader</label>
                <Select value={editLeaderId} onValueChange={setEditLeaderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {users.filter(u => u.role === 'Team Leader').map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Agents</label>
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                    {users.filter(u => u.role === 'Agent').map(u => (
                      <label key={u.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={editAgentIds.includes(u.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditAgentIds(prev => [...prev, u.id]);
                            } else {
                              setEditAgentIds(prev => prev.filter(id => id !== u.id));
                            }
                          }}
                        />
                        <span className="text-sm">{u.fullName || u.email}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditModal} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Team</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this team? This action cannot be undone.
                All agents in this team will become unassigned.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => showDeleteConfirm && handleDeleteTeam(showDeleteConfirm)}
              >
                Delete Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TeamsManagementPage;

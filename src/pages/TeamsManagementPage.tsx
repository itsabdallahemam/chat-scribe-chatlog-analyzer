import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Team, User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

const TeamsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editLeaderId, setEditLeaderId] = useState<string>('');
  const [editAgentIds, setEditAgentIds] = useState<string[]>([]);

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
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openEditModal = (team: Team) => {
    setEditTeamId(team.id);
    setEditLeaderId(team.leader?.id || '');
    setEditAgentIds(team.agents?.map(a => a.id) || []);
  };

  const closeEditModal = () => {
    setEditTeamId(null);
    setEditLeaderId('');
    setEditAgentIds([]);
  };

  const handleSaveEdit = async () => {
    if (!editTeamId) return;
    try {
      await api.post('/team/update', {
        teamId: editTeamId,
        leaderId: editLeaderId || undefined,
        agentIds: editAgentIds
      });
      // Refresh teams
      const teamsRes = await api.get<Team[]>('/team/all');
      setTeams(teamsRes.data);
      closeEditModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update team');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">Team Management</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Create teams, assign team leaders and agents, and manage all teams in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <Button onClick={() => navigate('/teams/create')} variant="default">+ Create New Team</Button>
              <div className="flex gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Total Teams:</span>
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{teams.length}</span>
              </div>
            </div>
            {/* Teams Table */}
            {loading ? (
              <div className="text-center py-8">Loading teams...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">No teams found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.leader?.fullName || team.leader?.email || 'Unassigned'}</TableCell>
                      <TableCell>
                        {team.agents?.map(a => (
                          <span key={a.id}>
                            <span
                              className="underline text-blue-600 dark:text-blue-300 cursor-pointer hover:text-blue-800 dark:hover:text-blue-400 mr-2"
                              onClick={() => {
                                if (user?.role === 'Team Leader') {
                                  navigate(`/agent/${a.id}`);
                                }
                              }}
                            >
                              {a.fullName || a.email}
                            </span>
                          </span>
                        )) || 'None'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openEditModal(team)} disabled={user?.role !== 'Manager'}>Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {editTeamId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-bold mb-4">Edit Team</h2>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Team Leader</label>
                <select
                  className="w-full border rounded p-2"
                  value={editLeaderId}
                  onChange={e => setEditLeaderId(e.target.value)}
                >
                  <option value="">None</option>
                  {users.filter(u => u.role === 'Team Leader').map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Agents</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-900">
                  {users.filter(u => u.role === 'Agent').map(u => (
                    <label key={u.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAgentIds.includes(u.id)}
                        onChange={e => {
                          if (e.target.checked) setEditAgentIds(ids => [...ids, u.id]);
                          else setEditAgentIds(ids => ids.filter(id => id !== u.id));
                        }}
                      />
                      <span>{u.fullName || u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save</Button>
              </div>
              {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsManagementPage;

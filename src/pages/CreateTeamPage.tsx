import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { User } from '@/lib/types';

const CreateTeamPage: React.FC = () => {
  console.log('CreateTeamPage mounted');
  const [users, setUsers] = useState<User[]>([]);
  const [teamName, setTeamName] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await api.get<User[]>('/auth/users');
        setUsers(res.data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Create the team with leader
      const leaderValue = leaderId === "__none__" ? undefined : leaderId;
      const res = await api.post<{ id: string }>('/team/create', { name: teamName, leaderId: leaderValue });
      const teamId = res.data.id;
      // Assign agents
      for (const agentId of agentIds) {
        await api.post('/team/assign-agent', { agentId, teamId });
      }
      navigate('/teams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">Create New Team</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Enter team details and assign a leader and agents.</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading && (
            <div className="text-center py-8">Loading users...</div>
          )}
          {error && (
            <div className="text-red-600 text-center py-8">{error}</div>
          )}
          {!usersLoading && !error && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Team Name</label>
                <Input value={teamName} onChange={e => setTeamName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Team Leader</label>
                <Select value={leaderId} onValueChange={setLeaderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team leader (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {users.filter(u => u.role === 'Team Leader' && u.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Agents</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white dark:bg-gray-900">
                  {users.filter(u => u.role === 'Agent').map(u => (
                    <label key={u.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agentIds.includes(u.id)}
                        onChange={e => {
                          if (e.target.checked) setAgentIds(ids => [...ids, u.id]);
                          else setAgentIds(ids => ids.filter(id => id !== u.id));
                        }}
                      />
                      <span>{u.fullName || u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading || !teamName}>{loading ? 'Creating...' : 'Create Team'}</Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/teams')}>Cancel</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTeamPage;

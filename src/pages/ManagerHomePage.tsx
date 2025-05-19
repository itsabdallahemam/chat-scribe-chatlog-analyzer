import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Team, User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

const ManagerHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState<string>('');

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

  const handleCreateTeam = async () => {
    try {
      await api.post('/team/create', { name: newTeamName, leaderId: newTeamLeader || undefined });
      setShowCreateDialog(false);
      setNewTeamName('');
      setNewTeamLeader('');
      // Refresh teams
      const teamsRes = await api.get<Team[]>('/team/all');
      setTeams(teamsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/30 p-4">
      <Card className="w-full max-w-2xl shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold mb-2 text-purple-700 dark:text-purple-300">Welcome, Manager</CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
            {user?.fullName ? `Hello, ${user.fullName}!` : 'You are logged in as a Manager.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-700 dark:text-gray-200">
            <p>Welcome to your dashboard. Use the navigation bar to manage teams, view reports, and monitor your organization.</p>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/teams-management')}
            >
              Manage Teams
            </Button>
            {/* Add more quick links as needed */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerHomePage;

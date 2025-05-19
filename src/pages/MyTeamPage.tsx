import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MyTeamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamAgents = async () => {
      setLoading(true);
      try {
        const res = await api.get<User[]>('/team/my-agents');
        setAgents(res.data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load your team agents');
      } finally {
        setLoading(false);
      }
    };
    fetchTeamAgents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-300">My Team</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              View and manage your agents. Click an agent to view their stats and metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading agents...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8">No agents found in your team.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <Card key={agent.id} className="cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate(`/agent/${agent.id}`)}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300">{agent.fullName || agent.email}</CardTitle>
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400">{agent.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700 dark:text-gray-200">Role: {agent.role}</div>
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

export default MyTeamPage;

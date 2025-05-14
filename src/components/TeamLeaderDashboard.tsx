import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from './ui/use-toast';
import api from '../lib/axios';
import type { User, ApiError } from '../lib/types';

export const TeamLeaderDashboard: React.FC = () => {
  const { user, isTeamLeader } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (isTeamLeader) {
      fetchTeamMembers();
    }
  }, [isTeamLeader]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<User[]>('/api/auth/team-members');
      setTeamMembers(response.data);
    } catch (error) {
      const apiError = error as { response?: { data: ApiError } };
      const errorMessage = apiError.response?.data?.message || 'Failed to fetch team members';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent) {
      toast({
        title: 'Error',
        description: 'Please select an agent to assign',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/api/auth/assign-agent', { agentId: selectedAgent });
      toast({
        title: 'Success',
        description: 'Agent assigned successfully',
      });
      fetchTeamMembers();
      setSelectedAgent(null);
    } catch (error) {
      const apiError = error as { response?: { data: ApiError } };
      const errorMessage = apiError.response?.data?.message || 'Failed to assign agent';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (!isTeamLeader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be a team leader to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredTeamMembers = teamMembers.filter(member =>
    member.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={fetchTeamMembers} variant="outline">
                Refresh
              </Button>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Assign New Agent</label>
                <Select value={selectedAgent || ''} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers
                      .filter(member => !member.teamLeaderId)
                      .map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.email} ({member.fullName || 'No name'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignAgent} disabled={!selectedAgent}>
                Assign Agent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading team members...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.fullName || 'No name'}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No team members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
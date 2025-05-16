import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { UserIcon, UsersIcon } from 'lucide-react';

export const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Agent');
  const { signup, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, name, role);
      navigate('/');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 transition-colors duration-500">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-500 dark:from-blue-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="name" className="font-medium text-gray-700 dark:text-gray-200">Name</label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-200">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-200">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="font-medium text-gray-700 dark:text-gray-200">Select Your Role</label>
              <div className="flex gap-3">
                <Button 
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm ${role === 'Agent' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                  onClick={() => setRole('Agent')}
                >
                  <UserIcon size={18} />
                  Agent
                </Button>
                <Button 
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm ${role === 'Team Leader' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                  onClick={() => setRole('Team Leader')}
                >
                  <UsersIcon size={18} />
                  Team Leader
                </Button>
                <Button 
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm ${role === 'Manager' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                  onClick={() => setRole('Manager')}
                >
                  <UsersIcon size={18} />
                  Manager
                </Button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full text-base py-3 font-semibold">Sign Up</Button>
          </form>
          <div className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{' '}
            <span
              className="text-blue-600 hover:underline cursor-pointer dark:text-cyan-400"
              onClick={() => navigate('/login')}
            >
              Login
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
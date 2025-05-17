import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demosOpen, setDemosOpen] = useState(false);
  const { login, error, setTestUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 transition-colors duration-500">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-500 dark:from-blue-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Login
          </CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full text-base py-3 font-semibold"
            >
              Login
            </Button>
          </form>
          <div className="text-center mt-6 text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <span
              className="text-blue-600 hover:underline cursor-pointer dark:text-cyan-400"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </span>
          </div>
        </CardContent>
        <div className="mt-4 px-6 pb-6">
          <Collapsible
            open={demosOpen}
            onOpenChange={setDemosOpen}
            className="border-t pt-4"
          >
            <CollapsibleTrigger className="flex items-center justify-center w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <span className="text-sm font-medium">Try a demo</span>
              <ChevronDown 
                className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                  demosOpen ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white py-4 w-full"
                onClick={() => { setTestUser('Agent'); navigate('/homepage/agent'); }}
              >
                Agent Demo
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white py-4 w-full"
                onClick={() => { setTestUser('Team Leader'); navigate('/homepage/team-leader'); }}
              >
                Team Leader Demo
              </Button>
              <Button
                className="bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 text-white py-4 w-full opacity-80 cursor-not-allowed"
                disabled
              >
                Manager Demo (coming soon)
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Card>
    </div>
  );
};
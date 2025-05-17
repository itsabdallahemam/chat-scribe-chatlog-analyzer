import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const TestLoginPage: React.FC = () => {
  const { setTestUser, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role: string) => {
    setTestUser(role);
    if (role === 'Agent') {
      navigate('/homepage/agent');
    } else if (role === 'Team Leader') {
      navigate('/homepage/team-leader');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Test User Login</CardTitle>
          <CardDescription>
            Select a role to test different homepages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Currently logged in as: <span className="font-bold">{user.fullName || user.email}</span>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Role: <span className="font-bold">{user.role}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Not currently logged in
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white py-6 w-full"
              onClick={() => handleSelectRole('Agent')}
            >
              Login as Agent Demo
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white py-6 w-full"
              onClick={() => handleSelectRole('Team Leader')}
            >
              Login as Team Leader Demo
            </Button>
            <Button 
              className="bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 text-white py-6 w-full opacity-80 cursor-not-allowed"
              disabled
            >
              Login as Manager Demo (coming soon)
            </Button>
            <Button 
              variant="outline"
              className="py-6 w-full"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log Out / View Public Homepage
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This is a test page for development purposes only.
            <br />
            No actual authentication happens here.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestLoginPage;
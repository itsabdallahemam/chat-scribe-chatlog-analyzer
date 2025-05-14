import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If no user, the ProtectedRoute component will handle redirection
  if (!user) {
    return <>{children}</>;
  }

  // Check if the user's role is allowed to access this route
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
            <CardTitle className="text-yellow-800 dark:text-yellow-500">Access Restricted</CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-600">
              This page is not accessible with your current role.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
              <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <span className="text-sm font-medium">
                Your role: <span className="font-semibold">{user.role}</span>
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-600">
              Please contact your administrator if you believe you should have access to this feature.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-0">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 
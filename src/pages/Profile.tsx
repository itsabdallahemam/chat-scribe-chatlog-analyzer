import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import api from '../lib/axios';
import { User } from '../lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  AlertCircle, 
  Moon, 
  Sun, 
  Shield, 
  LogOut,
  FileUp,
  FileDown,
  FileEdit,
  Trash2,
  Lightbulb,
  Bot,
  Users as UsersIcon,
  BarChart2,
  LockKeyhole,
  Eye,
  EyeOff
} from 'lucide-react';
import { useChatlog } from '../contexts/ChatlogContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchModels, testModel } from '../services/googleAI';
import { useToast } from '../hooks/use-toast';
import { getAllChatLogs, deleteAllChatLogs, db } from '../services/database';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { deleteAllChatLogEvaluations } from '../services/chatLogEvaluationService';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import RatingsTab from '../components/RatingsTab';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  // Set initial tab based on user role
  useEffect(() => {
    // Ensure Team Leaders can never have performance tab active
    if (user?.role === 'Team Leader' && activeTab === 'performance') {
      setActiveTab('profile');
    }
  }, [user?.role, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await api.put('/auth/profile', { name });
      updateUser(response.data as User);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Profile update failed');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fa] dark:bg-[#161925] p-4">
        <Card className="w-full max-w-md border-border/40 shadow-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="default" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      {/* Header Section with Improved Alignment */}
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full text-white shadow-md">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">
                {user.fullName ? `${user.fullName}'s Profile` : 'Your Profile'}
              </h1>
              <p className="mt-1 text-[#667085] dark:text-gray-300">
                {user.role === 'Team Leader' 
                  ? 'Manage your account, view settings and team performance metrics.' 
                  : 'Manage your account, view performance metrics and personal settings.'}
              </p>
            </div>
          </div>
          <Badge 
            className={`mt-2 md:mt-0 md:ml-auto px-4 py-2 rounded-lg flex items-center ${
              user.role === 'Team Leader' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
          >
            {user.role === 'Team Leader' ? (
              <><UsersIcon className="h-4 w-4 mr-2" /> Team Leader</>
            ) : (
              <><UserIcon className="h-4 w-4 mr-2" /> Agent</>
            )}
          </Badge>
        </div>
      </div>
      
      {/* Main Bento Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar - 3 columns on desktop */}
        <div className="md:col-span-3">
          <Card className="shadow-md border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-white/90 dark:ring-gray-800 shadow-md">
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-xl mb-1 text-[#252A3A] dark:text-white">{user.fullName || 'User'}</h3>
                <p className="text-sm text-[#667085] dark:text-gray-400 mb-3">{user.email}</p>
                <Badge 
                  variant="outline" 
                  className={`mb-2 ${
                    user.role === 'Team Leader' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {user.role === 'Team Leader' ? (
                    <><UsersIcon className="w-3 h-3 mr-1" /> Team Leader</>
                  ) : (
                    <><UserIcon className="w-3 h-3 mr-1" /> Agent</>
                  )}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Badge>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col w-full rounded-none bg-transparent gap-2">
                  <button 
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center justify-start px-4 py-2.5 rounded-md transition-colors w-full text-left ${
                      activeTab === "profile" 
                        ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <UserIcon className="w-5 h-5 mr-3" />
                    Profile
                  </button>
                  
                  {/* Only show Performance tab for Agents, not for Team Leaders */}
                  {user.role === 'Agent' && (
                    <button 
                      onClick={() => setActiveTab("performance")}
                      className={`flex items-center justify-start px-4 py-2.5 rounded-md transition-colors w-full text-left ${
                        activeTab === "performance" 
                          ? "bg-blue-100 dark:bg-blue-800/50 font-medium text-blue-700 dark:text-blue-300" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300"
                      }`}
                    >
                      <BarChart2 className="w-5 h-5 mr-3" />
                      Performance
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center justify-start px-4 py-2.5 rounded-md transition-colors w-full text-left ${
                      activeTab === "settings" 
                        ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300"
                    }`}
                  >
                    <SettingsIcon className="w-5 h-5 mr-3" />
                    Settings
                  </button>
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={logout} 
                  className="w-full mt-6 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area - 9 columns on desktop */}
        <div className="md:col-span-9">
          <Card className="shadow-md border-border/40 h-full">
            {(activeTab === "profile" || (activeTab === "performance" && user.role !== 'Agent')) && (
              <div className="p-6">
                <ProfileContent 
                  user={user} 
                  name={name} 
                  setName={setName} 
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  handleUpdateProfile={handleUpdateProfile}
                  error={error}
                />
              </div>
            )}
            {activeTab === "performance" && user.role === 'Agent' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="text-blue-500 mr-3">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1 text-[#252A3A] dark:text-white">Performance Metrics</h2>
                    <p className="text-[#667085] dark:text-gray-400">
                      View your performance based on chat evaluations
                    </p>
                  </div>
                </div>
                <RatingsTab userId={user.id} />
              </div>
            )}
            {activeTab === "settings" && (
              <div className="p-6">
                <SettingsTab />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// Profile Content Component
const ProfileContent: React.FC<{
  user: User;
  name: string;
  setName: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
  error: string | null;
}> = ({ user, name, setName, isEditing, setIsEditing, handleUpdateProfile, error }) => {
  const { toast } = useToast();
  const { changePassword } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  // Password change form schema
  const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordFormSchema>;

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setIsChangingPassword(true);
      const message = await changePassword(values.currentPassword, values.newPassword);
      toast({
        title: "Success",
        description: message || "Password changed successfully",
      });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="text-primary mr-3">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1 text-[#252A3A] dark:text-white">Profile Information</h2>
          <p className="text-[#667085] dark:text-gray-400">
            Manage your personal information and account settings
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Account Info Card */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 p-5 shadow-sm">
          <h3 className="text-lg font-medium mb-4 text-[#252A3A] dark:text-blue-300">Account Details</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#667085] dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="text-[#252A3A] dark:text-white text-sm p-3 bg-white/80 dark:bg-gray-900/60 rounded-md border border-blue-200/50 dark:border-blue-800/30 font-medium">
                {user.email}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#667085] dark:text-gray-300 mb-1.5">
                Full Name
              </label>
              {!isEditing ? (
                <div className="flex justify-between items-center">
                  <div className="text-[#252A3A] dark:text-white text-sm p-3 bg-white/80 dark:bg-gray-900/60 rounded-md border border-blue-200/50 dark:border-blue-800/30 font-medium flex-1">
                    {user.fullName || 'Not set'}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)} 
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <FileEdit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 bg-white/80 dark:bg-gray-900/60 border-blue-200/50 dark:border-blue-800/30"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Save</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.fullName || '');
                    }}
                    className="border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400"
                  >
                    Cancel
                  </Button>
                </form>
              )}
              {error && (
                <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 rounded-md">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    {error}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#667085] dark:text-gray-300 mb-1.5">
                Role
              </label>
              <div className={`inline-flex items-center text-sm p-2.5 rounded-md border ${
                user.role === 'Team Leader' 
                  ? 'text-green-700 border-green-200 bg-white/80 dark:bg-gray-900/60 dark:text-green-400 dark:border-green-800/30' 
                  : 'text-blue-700 border-blue-200 bg-white/80 dark:bg-gray-900/60 dark:text-blue-400 dark:border-blue-800/30'
              }`}>
                {user.role === 'Team Leader' ? (
                  <><UsersIcon className="w-3.5 h-3.5 mr-1.5" /> Team Leader</>
                ) : (
                  <><UserIcon className="w-3.5 h-3.5 mr-1.5" /> Agent</>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#667085] dark:text-gray-300 mb-1.5">
                Account Status
              </label>
              <div className="inline-flex items-center text-sm p-2.5 rounded-md border text-green-700 border-green-200 bg-white/80 dark:bg-gray-900/60 dark:text-green-400 dark:border-green-800/30">
                <Badge className="mr-1.5 bg-green-500 h-2 w-2 p-0 rounded-full" />
                Active
              </div>
            </div>
          </div>
        </div>
        
        {/* Security Settings Card */}
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 p-5 shadow-sm">
          <h3 className="text-lg font-medium mb-4 text-[#252A3A] dark:text-amber-300">Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/60 rounded-md border border-amber-200/50 dark:border-amber-800/30">
              <div>
                <h4 className="font-medium text-[#252A3A] dark:text-white">Password</h4>
                <p className="text-sm text-[#667085] dark:text-gray-400">Update your password regularly for security</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/60 rounded-md border border-amber-200/50 dark:border-amber-800/30">
              <div>
                <h4 className="font-medium text-[#252A3A] dark:text-white">Two-Factor Authentication</h4>
                <p className="text-sm text-[#667085] dark:text-gray-400">Enhance your account security</p>
              </div>
              <Button variant="outline" size="sm" className="border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400">
                Enable
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-amber-500" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 py-2">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter your current password" 
                          {...field} 
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter your new password" 
                          {...field} 
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password" 
                          {...field} 
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Password Requirements</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Your password must be at least 8 characters long and should include a mix of letters, numbers, and special characters for security.
                </AlertDescription>
              </Alert>

              <DialogFooter className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    passwordForm.reset();
                    setIsPasswordDialogOpen(false);
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <LoadingSpinner size={16} className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// SettingsTab component moved from SettingsPage
const SettingsTab: React.FC = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const {
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    modelOptions,
    setModelOptions,
    testPrompt,
    setTestPrompt,
    testResponse,
    setTestResponse,
    promptTemplate,
    setPromptTemplate,
    rubricText,
    setRubricText,
    setEvaluationResults,
    loadSavedChatLogs,
    evaluationResults,
  } = useChatlog();

  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [isKeyHidden, setIsKeyHidden] = useState<boolean>(true);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isTestingModel, setIsTestingModel] = useState<boolean>(false);
  
  // Check if user is a team leader
  const isTeamLeader = user?.role === 'Team Leader';

  // Load API key from database when component mounts
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await api.get<any[]>('/user-features');
        const features = response.data;
        const apiKeyFeature = features.find((f: any) => f.featureName === 'google_api_key');
        
        if (apiKeyFeature) {
          setApiKey(apiKeyFeature.featureValue);
          setTempApiKey(apiKeyFeature.featureValue);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      }
    };

    fetchApiKey();
  }, [setApiKey]);

  // Load models when API key is available
  useEffect(() => {
    if (apiKey) {
      loadModels();
    }
    // eslint-disable-next-line
  }, [apiKey]);

  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Save API key to the database
      await api.post('/user-features', {
        featureName: 'google_api_key',
        featureValue: tempApiKey,
      });

      // Update the local state
      setApiKey(tempApiKey);
      
      toast({
        title: "Success",
        description: "API key saved successfully to your account"
      });
      
      await loadModels();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key to your account",
        variant: "destructive"
      });
    }
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await fetchModels(apiKey || tempApiKey);
      setModelOptions(models);
      toast({
        title: "Models Loaded",
        description: `Successfully loaded ${models.length} models`
      });
    } catch (error) {
      console.error("Error loading models:", error);
      toast({
        title: "Error",
        description: "Failed to load models. Check your API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelTest = async () => {
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Please select a model first",
        variant: "destructive"
      });
      return;
    }
    if (!testPrompt.trim()) {
      toast({
        title: "Error",
        description: "Test prompt cannot be empty",
        variant: "destructive"
      });
      return;
    }
    setIsTestingModel(true);
    try {
      const response = await testModel(apiKey, selectedModel, testPrompt);
      setTestResponse(response);
    } catch (error) {
      console.error("Error testing model:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test model",
        variant: "destructive"
      });
    } finally {
      setIsTestingModel(false);
    }
  };

  const setDefaultModel = () => {
    if (selectedModel) {
      localStorage.setItem("selectedModel", selectedModel);
      toast({
        title: "Success",
        description: `Set ${selectedModel.split('/').pop()} as default model`
      });
    }
  };

  const handleSavePrompt = () => {
    // Add check to ensure only team leaders can save changes
    if (!isTeamLeader) {
      toast({
        title: "Permission Denied",
        description: "Only team leaders can modify prompt templates",
        variant: "destructive"
      });
      return;
    }
    
    if (!promptTemplate.trim()) {
      toast({
        title: "Error",
        description: "Prompt template cannot be empty",
        variant: "destructive"
      });
      return;
    }
    setPromptTemplate(promptTemplate);
    toast({
      title: "Success",
      description: "Prompt template saved successfully"
    });
  };

  const handleSaveRubric = () => {
    // Add check to ensure only team leaders can save changes
    if (!isTeamLeader) {
      toast({
        title: "Permission Denied",
        description: "Only team leaders can modify scoring rubrics",
        variant: "destructive"
      });
      return;
    }
    
    if (!rubricText.trim()) {
      toast({
        title: "Error",
        description: "Rubric text cannot be empty",
        variant: "destructive"
      });
      return;
    }
    setRubricText(rubricText);
    toast({
      title: "Success",
      description: "Rubric saved successfully"
    });
  };

  const handleDeleteAllChatlogs = async () => {
    try {
      if (user) {
        // User is logged in - delete from server
        await deleteAllChatLogEvaluations();
      } else {
        // User is not logged in - delete from local database
        await deleteAllChatLogs();
      }
      
      setEvaluationResults([]);
      await loadSavedChatLogs();
      toast({ 
        title: 'All chatlogs deleted', 
        description: 'All chatlogs have been removed from the database.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete all chatlogs.', 
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadBackup = async () => {
    try {
      // Get evaluations from current state
      const allLogs = evaluationResults;
      const json = JSON.stringify(allLogs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatlogs-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Downloaded', description: 'A backup JSON file has been downloaded.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download backup.', variant: 'destructive' });
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a backup JSON file to import.', variant: 'destructive' });
      return;
    }
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        toast({ title: 'Invalid JSON', description: 'The selected file is not valid JSON.', variant: 'destructive' });
        return;
      }
      if (!Array.isArray(data)) {
        toast({ title: 'Invalid backup format', description: 'Backup file must be a JSON array of chatlogs.', variant: 'destructive' });
        return;
      }
      if (data.length === 0) {
        toast({ title: 'Empty backup', description: 'The backup file contains no chatlogs.', variant: 'destructive' });
        return;
      }
      const requiredFields = ['chatlog', 'coherence', 'politeness', 'relevance', 'resolution'];
      const missingFields = requiredFields.filter(f => !(f in data[0]));
      if (missingFields.length > 0) {
        toast({ title: 'Invalid backup structure', description: `Missing fields: ${missingFields.join(', ')}`, variant: 'destructive' });
        return;
      }
      
      // Process the data to ensure dateTime is properly formatted
      const processedData = data.map(item => {
        // Keep the original structure but process dateTime if present
        const processed = { ...item };
        
        // Convert dateTime string to proper format if it exists
        if (processed.dateTime && typeof processed.dateTime === 'string') {
          try {
            // Ensure it's a valid date string
            const dateObj = new Date(processed.dateTime);
            if (!isNaN(dateObj.getTime())) {
              processed.dateTime = processed.dateTime;
            }
          } catch (e) {
            // If parsing fails, leave as is
            console.warn('Failed to parse dateTime:', processed.dateTime);
          }
        }
        
        return processed;
      });
      
      if (user) {
        // User is logged in - restore directly via setEvaluationResults
        setEvaluationResults(processedData);
      } else {
        // User is not logged in - restore to local database
        await deleteAllChatLogs();
        const logsToAdd = processedData.map(({ id, timestamp, ...rest }) => {
          let validTimestamp = timestamp;
          if (!validTimestamp || isNaN(new Date(validTimestamp).getTime())) {
            validTimestamp = new Date();
          }
          return { ...rest, timestamp: validTimestamp };
        });
        
        try {
          await db.chatLogs.bulkAdd(logsToAdd);
        } catch (bulkAddErr) {
          toast({ title: 'Database Error', description: 'Failed to write chatlogs to the database.', variant: 'destructive' });
          return;
        }
      }
      
      await new Promise(res => setTimeout(res, 200));
      await loadSavedChatLogs();
      toast({ title: 'Backup Restored', description: `Imported ${processedData.length} chatlogs from backup.`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore from backup. Ensure the file is a valid backup JSON.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="text-amber-500 mr-3">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1 text-[#252A3A] dark:text-white">Settings</h2>
          <p className="text-[#667085] dark:text-gray-400">
            Manage your preferences, API settings, and data
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {/* Theme Settings Card */}
        <Card className="col-span-12 md:col-span-6 bg-gradient-to-r from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-blue-300">
              <div className="flex items-center p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-2">
                <Sun className="h-4 w-4 text-amber-500 mr-1" />
                <Moon className="h-4 w-4 text-indigo-400" />
              </div>
              <span>Theme Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/60 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <div>
                <h3 className="font-medium text-sm text-[#252A3A] dark:text-white">Current Theme</h3>
                <p className="text-xs text-[#667085] dark:text-gray-400">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full border-blue-200 dark:border-blue-800/30"
                size="icon"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-600" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Key Card */}
        <Card className="col-span-12 md:col-span-6 bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-green-300">
              <div className="p-2 rounded-full bg-white/60 dark:bg-green-900/40 text-green-600 dark:text-green-400 mr-2">
                <Shield className="h-4 w-4" />
              </div>
              <span>API Key</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertTitle className="text-xs font-medium">Security Notice</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">
                Your API key is stored securely in your account.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type={isKeyHidden ? "password" : "text"}
                  placeholder="Enter your Google API Key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="flex-1 text-xs bg-white/80 dark:bg-gray-900/60 border-green-200/50 dark:border-green-800/30"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsKeyHidden(!isKeyHidden)}
                  className="min-w-[70px] border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400"
                  size="sm"
                >
                  {isKeyHidden ? "Show" : "Hide"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-[#252A3A] dark:text-white">
                  Status: 
                  <Badge variant={apiKey ? "success" : "secondary"} className="ml-2 text-[10px] py-0">
                    {apiKey ? "Saved" : "Not Set"}
                  </Badge>
                </div>
                <Button 
                  onClick={saveApiKey} 
                  variant="default"
                  size="sm"
                  className="h-7 text-xs bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  Save Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Model Selection */}
        <Card className="col-span-12 bg-gradient-to-r from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-purple-300">
              <div className="p-2 rounded-full bg-white/60 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mr-2">
                <Bot className="h-4 w-4" />
              </div>
              <span>Model Selection & Testing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 bg-white/80 dark:bg-gray-900/60 p-4 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <div>
                  <label className="block text-xs font-medium mb-1 text-[#252A3A] dark:text-white">Select Model</label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      disabled={modelOptions.length === 0 || isLoadingModels}
                    >
                      <SelectTrigger className="w-full text-xs border-purple-200/50 dark:border-purple-800/30">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((model) => (
                          <SelectItem key={model.id} value={model.id} className="text-xs">
                            {model.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={loadModels}
                      disabled={!apiKey || isLoadingModels}
                      size="icon"
                      className="w-8 h-8 border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-400"
                    >
                      {isLoadingModels ? <LoadingSpinner size={18} /> : "↻"}
                    </Button>
                  </div>
                  {!apiKey && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Set your API key first to load models
                    </p>
                  )}
                </div>
                
                <div className="pt-1">
                  <Button 
                    onClick={setDefaultModel}
                    disabled={!selectedModel}
                    variant="outline"
                    className="w-full h-8 text-xs border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-400"
                    size="sm"
                  >
                    Set as Default Model
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 bg-white/80 dark:bg-gray-900/60 p-4 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <div>
                  <label className="block text-xs font-medium mb-1 text-[#252A3A] dark:text-white">Test Prompt</label>
                  <Textarea
                    placeholder="Enter a test prompt..."
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="min-h-[80px] resize-none text-xs border-purple-200/50 dark:border-purple-800/30"
                  />
                </div>
                
                <div>
                  <Button 
                    onClick={handleModelTest}
                    disabled={!selectedModel || !testPrompt || isTestingModel}
                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                    size="sm"
                  >
                    {isTestingModel ? <LoadingSpinner size={18} /> : 'Test Model'}
                  </Button>
                </div>
              </div>
            </div>
            
            {testResponse && (
              <div className="mt-4 p-4 bg-white/80 dark:bg-gray-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <h3 className="text-xs font-medium mb-2 text-[#252A3A] dark:text-white">Test Response</h3>
                <div className="bg-purple-50/80 dark:bg-purple-900/30 p-3 rounded-md border border-purple-200/50 dark:border-purple-800/30 text-xs font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                  {testResponse}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Evaluation Templates */}
        <Card className="col-span-12 md:col-span-6 bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-amber-300">
              <div className="p-2 rounded-full bg-white/60 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mr-2">
                <FileEdit className="h-4 w-4" />
              </div>
              <span>Prompt Template</span>
              {!isTeamLeader && (
                <Badge variant="outline" className="ml-2 text-[10px] py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Read-only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#667085] dark:text-gray-400">
              Use <span className="font-mono bg-white/60 dark:bg-gray-900/60 px-1 rounded text-[10px]">{'{chatlog_text}'}</span> and <span className="font-mono bg-white/60 dark:bg-gray-900/60 px-1 rounded text-[10px]">{'{rubric_text}'}</span> as placeholders.
              {!isTeamLeader && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Only team leaders can modify prompt templates.
                </span>
              )}
            </p>
            <Textarea
              value={promptTemplate}
              onChange={(e) => isTeamLeader && setPromptTemplate(e.target.value)}
              className={`min-h-[120px] font-mono text-xs bg-white/80 dark:bg-gray-900/60 border-amber-200/50 dark:border-amber-800/30 ${!isTeamLeader ? 'cursor-not-allowed' : ''}`}
              placeholder="Enter prompt template..."
              readOnly={!isTeamLeader}
            />
            {isTeamLeader && (
              <Button 
                onClick={handleSavePrompt}
                className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                size="sm"
              >
                Save Template
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Rubric Template */}
        <Card className="col-span-12 md:col-span-6 bg-gradient-to-r from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-blue-300">
              <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-2">
                <Lightbulb className="h-4 w-4" />
              </div>
              <span>Scoring Rubric</span>
              {!isTeamLeader && (
                <Badge variant="outline" className="ml-2 text-[10px] py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Read-only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#667085] dark:text-gray-400">
              Define the scoring criteria included in evaluation prompts.
              {!isTeamLeader && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  Only team leaders can modify scoring rubrics.
                </span>
              )}
            </p>
            <Textarea
              value={rubricText}
              onChange={(e) => isTeamLeader && setRubricText(e.target.value)}
              className={`min-h-[120px] font-mono text-xs bg-white/80 dark:bg-gray-900/60 border-blue-200/50 dark:border-blue-800/30 ${!isTeamLeader ? 'cursor-not-allowed' : ''}`}
              placeholder="Enter scoring rubric..."
              readOnly={!isTeamLeader}
            />
            {isTeamLeader && (
              <Button 
                onClick={handleSaveRubric}
                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                size="sm"
              >
                Save Rubric
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Data Management */}
        <Card className="col-span-12 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-900/40 dark:to-slate-900/30 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
              <div className="p-2 rounded-full bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 mr-2">
                <FileUp className="h-4 w-4" />
              </div>
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg border border-red-200/50 dark:border-red-800/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/30">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white/60 dark:bg-red-900/40 text-red-600 dark:text-red-400 mr-2">
                      <Trash2 className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-medium text-[#252A3A] dark:text-red-300">Delete Data</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#667085] dark:text-gray-400 mb-3">Remove all chatlog data permanently</p>
                  <Button 
                    onClick={handleDeleteAllChatlogs} 
                    variant="destructive"
                    className="w-full h-7 text-xs"
                    size="sm"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete All Chatlogs
                  </Button>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg border border-blue-200/50 dark:border-blue-800/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-2">
                      <FileDown className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-medium text-[#252A3A] dark:text-blue-300">Export Backup</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#667085] dark:text-gray-400 mb-3">Download your data as JSON</p>
                  <Button 
                    onClick={handleDownloadBackup} 
                    variant="outline"
                    className="w-full h-7 text-xs border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    size="sm"
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                    Download Backup
                  </Button>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg border border-green-200/50 dark:border-green-800/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/30">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white/60 dark:bg-green-900/40 text-green-600 dark:text-green-400 mr-2">
                      <FileUp className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-medium text-[#252A3A] dark:text-green-300">Import Backup</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#667085] dark:text-gray-400 mb-3">Restore from JSON backup</p>
                  <label className="w-full">
                    <input
                      type="file"
                      accept="application/json"
                      style={{ display: 'none' }}
                      onChange={handleUploadBackup}
                      id="import-backup-input"
                    />
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer h-7 text-xs border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => document.getElementById('import-backup-input')?.click()}
                      type="button"
                      size="sm"
                    >
                      <FileUp className="h-3.5 w-3.5 mr-1.5" />
                      Import Backup
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 
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
  BarChart2
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-3 bg-primary/10">
                  <AvatarFallback className="bg-purple-500 text-white text-2xl">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-xl mb-1">{user.fullName || 'User'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{user.email}</p>
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
                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground mb-5">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Badge>
                
                <div className="w-full">
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
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={logout} 
                  className="w-full mt-auto mt-4 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1 bg-white dark:bg-gray-900">
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
                      <h2 className="text-2xl font-bold mb-1">Performance Metrics</h2>
                      <p className="text-gray-500 dark:text-gray-400">
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
            </div>
          </div>
        </Card>
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
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
      
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-5">
          <h3 className="text-base font-medium mb-4">Account Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Email Address
              </label>
              <div className="text-gray-900 dark:text-white text-sm p-2.5 bg-white dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700/70">
                {user.email}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Full Name
              </label>
              {!isEditing ? (
                <div className="flex justify-between items-center">
                  <div className="text-gray-900 dark:text-white text-sm p-2.5 bg-white dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700/70 flex-1">
                    {user.fullName || 'Not set'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)} 
                    className="ml-2"
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
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">Save</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </form>
              )}
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Role
              </label>
              <div className={`inline-flex items-center text-sm p-2.5 rounded-md border bg-white dark:bg-gray-900/60 ${
                user.role === 'Team Leader' 
                  ? 'text-green-700 border-green-200 dark:text-green-400 dark:border-green-800/30' 
                  : 'text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800/30'
              }`}>
                {user.role === 'Team Leader' ? (
                  <><UsersIcon className="w-3.5 h-3.5 mr-1.5" /> Team Leader</>
                ) : (
                  <><UserIcon className="w-3.5 h-3.5 mr-1.5" /> Agent</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
      
      if (user) {
        // User is logged in - restore directly via setEvaluationResults
        setEvaluationResults(data);
      } else {
        // User is not logged in - restore to local database
        await deleteAllChatLogs();
        const logsToAdd = data.map(({ id, timestamp, ...rest }) => {
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
      toast({ title: 'Backup Restored', description: `Imported ${data.length} chatlogs from backup.`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore from backup. Ensure the file is a valid backup JSON.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      
      <div className="grid grid-cols-12 gap-4">
        {/* Theme Settings Card */}
        <Card className="col-span-12 md:col-span-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <div className="flex items-center mr-2">
                <Sun className="h-4 w-4 text-amber-500 mr-1" />
                <Moon className="h-4 w-4 text-indigo-400" />
              </div>
              <span>Theme Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
              <div>
                <h3 className="font-medium text-sm">Current Theme</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full"
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
        <Card className="col-span-12 md:col-span-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Shield className="h-4 w-4 text-emerald-500 mr-2" />
              <span>API Key</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 py-2">
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
                  className="flex-1 text-xs"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsKeyHidden(!isKeyHidden)}
                  className="min-w-[70px]"
                  size="sm"
                >
                  {isKeyHidden ? "Show" : "Hide"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs">
                  Status: 
                  <Badge variant={apiKey ? "success" : "secondary"} className="ml-2 text-[10px] py-0">
                    {apiKey ? "Saved" : "Not Set"}
                  </Badge>
                </div>
                <Button 
                  onClick={saveApiKey} 
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                >
                  Save Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Model Selection */}
        <Card className="col-span-12 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Bot className="h-4 w-4 text-indigo-500 mr-2" />
              <span>Model Selection & Testing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-medium mb-1">Select Model</label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      disabled={modelOptions.length === 0 || isLoadingModels}
                    >
                      <SelectTrigger className="w-full text-xs">
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
                      className="w-8 h-8"
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
                    className="w-full h-8 text-xs"
                    size="sm"
                  >
                    Set as Default Model
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-medium mb-1">Test Prompt</label>
                  <Textarea
                    placeholder="Enter a test prompt..."
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="min-h-[80px] resize-none text-xs"
                  />
                </div>
                
                <div>
                  <Button 
                    onClick={handleModelTest}
                    disabled={!selectedModel || !testPrompt || isTestingModel}
                    className="w-full h-8 text-xs"
                    size="sm"
                  >
                    {isTestingModel ? <LoadingSpinner size={18} /> : 'Test Model'}
                  </Button>
                </div>
              </div>
            </div>
            
            {testResponse && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700/70">
                <h3 className="text-xs font-medium mb-2">Test Response</h3>
                <div className="bg-white dark:bg-gray-800/70 p-3 rounded-md border border-gray-200 dark:border-gray-700/70 text-xs font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                  {testResponse}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Evaluation Templates */}
        <Card className="col-span-12 md:col-span-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <FileEdit className="h-4 w-4 text-amber-500 mr-2" />
              <span>Prompt Template</span>
              {!isTeamLeader && (
                <Badge variant="outline" className="ml-2 text-[10px] py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Read-only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded text-[10px]">{'{chatlog_text}'}</span> and <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded text-[10px]">{'{rubric_text}'}</span> as placeholders.
              {!isTeamLeader && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Only team leaders can modify prompt templates.
                </span>
              )}
            </p>
            <Textarea
              value={promptTemplate}
              onChange={(e) => isTeamLeader && setPromptTemplate(e.target.value)}
              className={`min-h-[120px] font-mono text-xs ${!isTeamLeader ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
              placeholder="Enter prompt template..."
              readOnly={!isTeamLeader}
            />
            {isTeamLeader && (
              <Button 
                onClick={handleSavePrompt}
                className="w-full h-8 text-xs"
                size="sm"
              >
                Save Template
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Rubric Template */}
        <Card className="col-span-12 md:col-span-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Lightbulb className="h-4 w-4 text-amber-500 mr-2" />
              <span>Scoring Rubric</span>
              {!isTeamLeader && (
                <Badge variant="outline" className="ml-2 text-[10px] py-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Read-only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define the scoring criteria included in evaluation prompts.
              {!isTeamLeader && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Only team leaders can modify scoring rubrics.
                </span>
              )}
            </p>
            <Textarea
              value={rubricText}
              onChange={(e) => isTeamLeader && setRubricText(e.target.value)}
              className={`min-h-[120px] font-mono text-xs ${!isTeamLeader ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
              placeholder="Enter scoring rubric..."
              readOnly={!isTeamLeader}
            />
            {isTeamLeader && (
              <Button 
                onClick={handleSaveRubric}
                className="w-full h-8 text-xs"
                size="sm"
              >
                Save Rubric
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Data Management */}
        <Card className="col-span-12 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <FileUp className="h-4 w-4 text-emerald-500 mr-2" />
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Card className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <CardHeader className="p-3 pb-1.5">
                  <CardTitle className="text-sm">Delete Data</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Remove all chatlog data</p>
                  <Button 
                    onClick={handleDeleteAllChatlogs} 
                    variant="destructive"
                    className="w-full h-7 text-xs"
                    size="sm"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete All Chatlogs
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <CardHeader className="p-3 pb-1.5">
                  <CardTitle className="text-sm">Export Backup</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Download your data as JSON</p>
                  <Button 
                    onClick={handleDownloadBackup} 
                    variant="outline"
                    className="w-full h-7 text-xs"
                    size="sm"
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                    Download Backup
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                <CardHeader className="p-3 pb-1.5">
                  <CardTitle className="text-sm">Import Backup</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Restore from JSON backup</p>
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
                      className="w-full cursor-pointer h-7 text-xs"
                      onClick={() => document.getElementById('import-backup-input')?.click()}
                      type="button"
                      size="sm"
                    >
                      <FileUp className="h-3.5 w-3.5 mr-1.5" />
                      Import Backup
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 
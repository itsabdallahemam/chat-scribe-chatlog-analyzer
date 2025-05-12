import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import api from '../lib/axios';
import { User } from '../lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { User as UserIcon, Settings as SettingsIcon, AlertCircle, Moon, Sun } from 'lucide-react';
import { useChatlog } from '../contexts/ChatlogContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchModels, testModel } from '../services/googleAI';
import { useToast } from '../hooks/use-toast';
import { getAllChatLogs, deleteAllChatLogs, db } from '../services/database';
import { Card as UICard } from '../components/ui/card';
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

export const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#18181a] py-12 px-2 md:px-0 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto rounded-2xl shadow-xl bg-white/90 dark:bg-[#232326] border border-gray-200 dark:border-gray-800 p-0 md:p-0">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full flex justify-center gap-2 bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-t-2xl px-4 pt-6">
            <TabsTrigger value="profile" className="px-6 py-2 rounded-full text-base font-medium transition-all data-[state=active]:bg-app-blue/10 dark:data-[state=active]:bg-app-blue-light/10 data-[state=active]:text-app-blue dark:data-[state=active]:text-app-blue-light data-[state=active]:border-b-2 data-[state=active]:border-app-blue/80 data-[state=active]:shadow-none shadow-none">
              <UserIcon className="w-5 h-5 mr-2" />Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-6 py-2 rounded-full text-base font-medium transition-all data-[state=active]:bg-app-blue/10 dark:data-[state=active]:bg-app-blue-light/10 data-[state=active]:text-app-blue dark:data-[state=active]:text-app-blue-light data-[state=active]:border-b-2 data-[state=active]:border-app-blue/80 data-[state=active]:shadow-none shadow-none">
              <SettingsIcon className="w-5 h-5 mr-2" />Settings
            </TabsTrigger>
          </TabsList>
          <div className="p-8 md:p-12">
            <TabsContent value="profile">
              {/* Profile Tab Content */}
              <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-app-blue/80 to-cyan-400 dark:from-app-blue-light/80 dark:to-cyan-300 flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
                  {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{user.fullName || 'No Name'}</h2>
                <p className="text-md text-gray-500 dark:text-gray-300 mb-2">{user.email}</p>
              </div>
              <div className="space-y-8 w-full max-w-lg mx-auto">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Account Information</h3>
                  <div className="bg-[#f7f6f3] dark:bg-[#232326] rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                    <div className="mb-4">
                      <span className="block text-xs text-gray-500 mb-1">Email</span>
                      <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Name</span>
                      {!isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{user.fullName || 'Not set'}</span>
                          <Button variant="outline" size="sm" className="ml-2 px-3 py-1 text-xs" onClick={() => setIsEditing(true)}>
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleUpdateProfile} className="flex items-center gap-2">
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="rounded-lg px-3 py-2 text-base border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181a]"
                          />
                          <Button type="submit" size="sm" className="px-3 py-1 text-xs">Save</Button>
                          <Button variant="outline" size="sm" className="px-3 py-1 text-xs" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                        </form>
                      )}
                      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button variant="destructive" onClick={logout} className="px-6 py-2 rounded-full text-base font-medium">
                    Logout
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              {/* Settings Tab Content */}
              <SettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

// SettingsTab component moved from SettingsPage
const SettingsTab: React.FC = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
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
  } = useChatlog();

  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [isKeyHidden, setIsKeyHidden] = useState<boolean>(true);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isTestingModel, setIsTestingModel] = useState<boolean>(false);

  useEffect(() => {
    if (apiKey) {
      loadModels();
    }
    // eslint-disable-next-line
  }, []);

  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive"
      });
      return;
    }
    setApiKey(tempApiKey);
    toast({
      title: "Success",
      description: "API key saved successfully"
    });
    await loadModels();
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
      await deleteAllChatLogs();
      setEvaluationResults([]);
      await loadSavedChatLogs();
      toast({ title: 'All chatlogs deleted', description: 'All chatlogs have been removed from the database.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete all chatlogs.', variant: 'destructive' });
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const allLogs = await getAllChatLogs();
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
      await new Promise(res => setTimeout(res, 200));
      await loadSavedChatLogs();
      toast({ title: 'Backup Restored', description: `Imported ${logsToAdd.length} chatlogs from backup.`, variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore from backup. Ensure the file is a valid backup JSON.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Settings */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col justify-between h-full">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Theme</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium dark:text-white">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={toggleTheme}
              className="w-12 h-12 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-6 w-6 text-yellow-500" />
              ) : (
                <Moon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </Button>
          </div>
        </UICard>

        {/* API Settings */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Google AI API Key</h2>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your API key will be stored in browser local storage. This is intended for personal, development,
              or testing use only. For production environments, a secure backend should be used.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Input
                type={isKeyHidden ? "password" : "text"}
                placeholder="Enter your Google API Key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
              <Button 
                variant="outline" 
                onClick={() => setIsKeyHidden(!isKeyHidden)}
                className="min-w-[100px] border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100"
              >
                {isKeyHidden ? "Show" : "Hide"}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={saveApiKey} 
                className="bg-app-blue hover:bg-app-blue/90 dark:bg-app-blue/80 dark:hover:bg-app-blue/70 text-white font-medium"
              >
                Save API Key
              </Button>
              <div className="text-sm dark:text-gray-300">
                API Key Status: 
                <span className={`ml-2 font-medium ${apiKey ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {apiKey ? "Saved" : "Not Set"}
                </span>
              </div>
            </div>
          </div>
        </UICard>

        {/* Model Selection & Testing */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Model Selection & Testing</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium dark:text-gray-200">Select Google Model</label>
              <div className="flex gap-4 items-start">
                <Select 
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={modelOptions.length === 0 || isLoadingModels}
                >
                  <SelectTrigger className="flex-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={loadModels}
                  disabled={!apiKey || isLoadingModels}
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100"
                >
                  {isLoadingModels ? <LoadingSpinner /> : "Refresh"}
                </Button>
              </div>
              {!apiKey && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Please set your API key above to load available models.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium dark:text-gray-200">Test Prompt Input</label>
              <Textarea
                placeholder="Enter a test prompt..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="min-h-[100px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <Button 
              onClick={handleModelTest}
              disabled={!selectedModel || !testPrompt || isTestingModel}
              className="bg-app-blue hover:bg-app-blue/90 dark:bg-app-blue/80 dark:hover:bg-app-blue/70 text-white font-medium"
            >
              {isTestingModel ? <LoadingSpinner /> : 'Test Selected Model'}
            </Button>
            {selectedModel && (
              <Button 
                variant="outline"
                onClick={setDefaultModel}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100"
              >
                Set as Default Model
              </Button>
            )}
          </div>
          {testResponse && (
            <div className="grid gap-2 mt-4">
              <label className="text-sm font-medium dark:text-gray-200">Test Response Output</label>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border dark:border-gray-700 text-sm font-mono whitespace-pre-wrap dark:text-gray-100">
                {testResponse}
              </div>
            </div>
          )}
        </UICard>

        {/* Evaluation Prompt Template */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Evaluation Prompt Template</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This template will be used when evaluating chatlogs. Use {'{chatlog_text}'} and {'{rubric_text}'} as placeholders.
          </p>
          <Textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="min-h-[180px] font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="Enter prompt template..."
          />
          <Button 
            onClick={handleSavePrompt}
            className="mt-4 bg-app-blue hover:bg-app-blue/90 dark:bg-app-blue/80 dark:hover:bg-app-blue/70 text-white font-medium"
          >
            Save Prompt Template
          </Button>
        </UICard>

        {/* Scoring Rubric */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Scoring Rubric</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Define the scoring rubric that will be included in the prompt sent to the model.
          </p>
          <Textarea
            value={rubricText}
            onChange={(e) => setRubricText(e.target.value)}
            className="min-h-[180px] font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="Enter scoring rubric..."
          />
          <Button 
            onClick={handleSaveRubric}
            className="mt-4 bg-app-blue hover:bg-app-blue/90 dark:bg-app-blue/80 dark:hover:bg-app-blue/70 text-white font-medium"
          >
            Save Rubric
          </Button>
        </UICard>

        {/* Chatlog Data Management */}
        <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Chatlog Data Management</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <Button 
              onClick={handleDeleteAllChatlogs} 
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium"
            >
              Delete All Chatlogs
            </Button>
            <Button 
              onClick={handleDownloadBackup} 
              variant="outline" 
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 font-medium"
            >
              Download Backup (JSON)
            </Button>
            <label className="inline-block">
              <span className="sr-only">Upload Backup</span>
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleUploadBackup}
                id="import-backup-input"
              />
              <Button
                variant="outline"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100 font-medium cursor-pointer"
                onClick={() => document.getElementById('import-backup-input')?.click()}
                type="button"
              >
                Import Backup (JSON)
              </Button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 dark:text-gray-400">Backup files contain all chatlog data needed to restore your workspace. Uploading a backup will replace all current chatlogs.</p>
        </UICard>
      </div>
    </div>
  );
}; 
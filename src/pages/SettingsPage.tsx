import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Moon, Sun } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchModels, testModel } from '@/services/googleAI';
import { useToast } from '@/hooks/use-toast';
import { getAllChatLogs, deleteAllChatLogs, db } from '@/services/database';

const SettingsPage: React.FC = () => {
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
    // Load models when API key is set and page loads
    if (apiKey) {
      loadModels();
    }
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
    
    // Load models with the new API key
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

  // Delete all chatlogs
  const handleDeleteAllChatlogs = async () => {
    try {
      await deleteAllChatLogs();
      await loadSavedChatLogs();
      toast({ title: 'All chatlogs deleted', description: 'All chatlogs have been removed from the database.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete all chatlogs.', variant: 'destructive' });
    }
  };

  // Download backup
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

  // Upload backup
  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Import] File input changed');
    const file = e.target.files?.[0];
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a backup JSON file to import.', variant: 'destructive' });
      console.warn('[Import] No file selected');
      return;
    }
    try {
      const text = await file.text();
      console.log('[Import] File read, content length:', text.length);
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        toast({ title: 'Invalid JSON', description: 'The selected file is not valid JSON.', variant: 'destructive' });
        console.error('[Import] JSON parse error:', parseErr);
        return;
      }
      if (!Array.isArray(data)) {
        toast({ title: 'Invalid backup format', description: 'Backup file must be a JSON array of chatlogs.', variant: 'destructive' });
        console.error('[Import] Data is not an array:', data);
        return;
      }
      if (data.length === 0) {
        toast({ title: 'Empty backup', description: 'The backup file contains no chatlogs.', variant: 'destructive' });
        console.warn('[Import] Backup array is empty');
        return;
      }
      // Validate structure of first item
      const requiredFields = ['chatlog', 'coherence', 'politeness', 'relevance', 'resolution'];
      const missingFields = requiredFields.filter(f => !(f in data[0]));
      if (missingFields.length > 0) {
        toast({ title: 'Invalid backup structure', description: `Missing fields: ${missingFields.join(', ')}`, variant: 'destructive' });
        console.error('[Import] Missing fields in first chatlog:', missingFields);
        return;
      }
      // Remove all current chatlogs, then add new ones
      await deleteAllChatLogs();
      // Remove id/timestamp to let Dexie auto-generate, but ensure valid timestamp
      const logsToAdd = data.map(({ id, timestamp, ...rest }) => {
        let validTimestamp = timestamp;
        // If timestamp is missing or invalid, assign new Date()
        if (!validTimestamp || isNaN(new Date(validTimestamp).getTime())) {
          validTimestamp = new Date();
        }
        return { ...rest, timestamp: validTimestamp };
      });
      let addResult;
      try {
        addResult = await db.chatLogs.bulkAdd(logsToAdd);
        console.log('[Import] bulkAdd result:', addResult);
      } catch (bulkAddErr) {
        toast({ title: 'Database Error', description: 'Failed to write chatlogs to the database.', variant: 'destructive' });
        console.error('[Import] bulkAdd error:', bulkAddErr);
        return;
      }
      // Check count after writing
      let countAfter;
      try {
        countAfter = await db.chatLogs.count();
        console.log('[Import] chatLogs count after import:', countAfter);
        // Log all chatlogs in DB
        const allLogs = await db.chatLogs.toArray();
        console.log('[Import] All chatlogs in DB after import:', allLogs);
      } catch (countErr) {
        toast({ title: 'Database Error', description: 'Could not verify chatlogs in the database.', variant: 'destructive' });
        console.error('[Import] count error:', countErr);
        return;
      }
      if (countAfter === 0) {
        toast({ title: 'Import Failed', description: 'No chatlogs were written to the database.', variant: 'destructive' });
        console.error('[Import] No chatlogs written to database.');
        return;
      }
      // Add a short delay before reading
      await new Promise(res => setTimeout(res, 200));
      await loadSavedChatLogs();
      toast({ title: 'Backup Restored', description: `Imported ${logsToAdd.length} chatlogs from backup.`, variant: 'default' });
      console.log(`[Import] Successfully imported ${logsToAdd.length} chatlogs.`);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore from backup. Ensure the file is a valid backup JSON.', variant: 'destructive' });
      console.error('[Import] Unexpected error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-app-blue dark:text-white mb-2">Settings</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Manage your preferences, API keys, and workspace data</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme Settings */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col justify-between h-full">
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
          </Card>

          {/* API Settings */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
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
          </Card>

          {/* Model Selection & Testing */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full md:col-span-2">
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
          </Card>

          {/* Evaluation Prompt Template */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
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
          </Card>

          {/* Scoring Rubric */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
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
          </Card>

          {/* Chatlog Data Management */}
          <Card className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full md:col-span-2">
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

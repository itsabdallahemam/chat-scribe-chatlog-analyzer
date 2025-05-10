import React, { useEffect, useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
import { fetchModels, testModel } from '@/services/googleAI';
import { useToast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
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

  return (
    <div>
      <PageTitle 
        title="Settings & Model Configuration" 
        description="Configure your Google AI API key and select models for chatlog evaluation."
      />

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Google AI API Key</h2>
          
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
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => setIsKeyHidden(!isKeyHidden)}
                className="min-w-[100px]"
              >
                {isKeyHidden ? "Show" : "Hide"}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={saveApiKey} 
                className="bg-app-blue hover:bg-app-blue-light"
              >
                Save API Key
              </Button>

              <div className="text-sm">
                API Key Status: 
                <span className={`ml-2 font-medium ${apiKey ? "text-green-600" : "text-amber-600"}`}>
                  {apiKey ? "Saved" : "Not Set"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Model Selection & Testing</h2>
          
          <div className="grid gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select Google Model</label>
              
              <div className="flex gap-4 items-start">
                <Select 
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={modelOptions.length === 0 || isLoadingModels}
                >
                  <SelectTrigger className="flex-1">
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
                >
                  {isLoadingModels ? <LoadingSpinner /> : "Refresh"}
                </Button>
              </div>

              {!apiKey && (
                <p className="text-sm text-amber-600 mt-1">
                  Please set your API key above to load available models.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Test Prompt Input</label>
              <Textarea
                placeholder="Enter a test prompt..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleModelTest}
              disabled={!selectedModel || !testPrompt || isTestingModel}
              className="bg-app-blue hover:bg-app-blue-light w-full md:w-auto"
            >
              {isTestingModel ? <LoadingSpinner /> : 'Test Selected Model'}
            </Button>

            {testResponse && (
              <div className="grid gap-2 mt-2">
                <label className="text-sm font-medium">Test Response Output</label>
                <div className="bg-gray-50 p-4 rounded-md border text-sm font-mono whitespace-pre-wrap">
                  {testResponse}
                </div>
              </div>
            )}

            {selectedModel && (
              <Button 
                variant="outline"
                onClick={setDefaultModel}
                className="w-full md:w-auto"
              >
                Set as Default Model
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

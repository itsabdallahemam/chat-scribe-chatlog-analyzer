
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
import { evaluateChatlogs } from '@/services/googleAI';
import { parseCSV } from '@/utils/csvParser';
import { useToast } from '@/hooks/use-toast';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    apiKey,
    selectedModel,
    promptTemplate,
    rubricText,
    setEvaluationResults,
    setIsLoading,
    isLoading,
    setError
  } = useChatlog();

  const [file, setFile] = useState<File | null>(null);
  const [pastedChatlog, setPastedChatlog] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleEvaluate = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your Google API key in the Settings page.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "Model Not Selected",
        description: "Please select a model in the Settings page.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let chatlogs: string[] = [];

      // Process the CSV file
      if (file) {
        const text = await file.text();
        try {
          chatlogs = parseCSV(text);
        } catch (error) {
          throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
        }
      } 
      // Process the pasted chatlog
      else if (pastedChatlog.trim()) {
        chatlogs = [pastedChatlog.trim()];
      } else {
        throw new Error("Please upload a CSV file or paste a chatlog.");
      }

      if (chatlogs.length === 0) {
        throw new Error("No valid chatlogs found in the input.");
      }

      // Evaluate each chatlog
      const results = await evaluateChatlogs(
        apiKey, 
        selectedModel, 
        promptTemplate, 
        rubricText, 
        chatlogs
      );

      // Update results in context
      setEvaluationResults(results);
      
      // Navigate to dashboard
      toast({
        title: "Evaluation Complete",
        description: `Successfully evaluated ${results.length} chatlogs.`
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Evaluation error:', error);
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isInputValid = file !== null || pastedChatlog.trim().length > 0;

  return (
    <div>
      <PageTitle 
        title="Chatlog Quality Analyzer" 
        description="Upload or paste customer service chatlogs to receive automated quality scores using Google's generative AI models."
      />

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Upload Chatlog CSV File</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with a 'Chatlog' column containing the conversation text.
          </p>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
              file:rounded-md file:border-0 file:text-sm file:font-medium
              file:bg-app-blue file:text-white hover:file:bg-app-blue-light"
          />
          
          {file && (
            <p className="mt-2 text-sm text-green-600">File selected: {file.name}</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Or Paste Single Chatlog Here</h2>
          <Textarea
            placeholder="Paste a single chatlog conversation here..."
            className="min-h-[150px]"
            value={pastedChatlog}
            onChange={(e) => setPastedChatlog(e.target.value)}
          />
        </Card>

        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleEvaluate} 
            disabled={!isInputValid || isLoading}
            className="bg-app-blue hover:bg-app-blue-light"
            size="lg"
          >
            {isLoading ? <LoadingSpinner /> : 'Evaluate Chatlogs'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

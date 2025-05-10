// src/pages/HomePage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Progress } from '@/components/ui/progress'; // Assuming you have this
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
// Using evaluateSingleChatlog for iterative processing to support pause/cancel
import { evaluateSingleChatlog } from '@/services/googleAI';
import { parseCSV } from '@/utils/csvParser'; // Assuming this is your robust parser
import { useToast } from '@/hooks/use-toast';

// Type for the raw result from googleAI.ts's evaluateChatlog/evaluateSingleChatlog
interface RawEvaluationResultFromAPI {
  original_chatlog: string;
  scores: {
    Coherence: number;
    Politeness: number;
    Relevance: number;
    Resolution: number;
  } | null;
  error: string | null;
  raw_response?: string | null;
}

// Type expected by the ChatlogContext for evaluationResults
interface EvaluationResultForContext {
  chatlog: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  // You could add an optional error field here if you want to store per-item errors in context
  // item_error?: string | null;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    apiKey,
    selectedModel,
    promptTemplate,
    rubricText,
    setEvaluationResults,
    setIsLoading: setGlobalIsLoading,
    isLoading: globalIsLoading,
    setError: setGlobalError,
  } = useChatlog();

  const [file, setFile] = useState<File | null>(null);
  const [pastedChatlog, setPastedChatlog] = useState<string>('');

  // State for detailed progress and control
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const cancelEvaluationRef = useRef<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPastedChatlog(''); // Clear pasted text if file is selected
    }
  };

  const handlePastedChatlogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedChatlog(e.target.value);
    if (e.target.value.trim()) {
      setFile(null); // Clear file if text is pasted
    }
  };

  const resetProcessState = () => {
    setIsProcessing(false);
    setGlobalIsLoading(false);
    setProgress(0);
    setCurrentStatus('');
    setIsPaused(false);
    cancelEvaluationRef.current = false;
  };

  const handleEvaluate = async () => {
    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Please add your Google API key in Settings.", variant: "destructive" });
      return;
    }
    if (!selectedModel) {
      toast({ title: "Model Not Selected", description: "Please select a model in Settings.", variant: "destructive" });
      return;
    }

    setGlobalIsLoading(true); // For initial button spinner
    setIsProcessing(true);
    setGlobalError(null);
    setProgress(0);
    setCurrentStatus('Preparing chatlogs...');
    cancelEvaluationRef.current = false;
    setIsPaused(false);

    let chatlogsToProcess: string[] = [];
    const processedResultsForContext: EvaluationResultForContext[] = [];
    let successfulEvals = 0;
    let failedEvals = 0;

    try {
      if (file) {
        const text = await file.text();
        try {
          chatlogsToProcess = parseCSV(text); // Assuming parseCSV returns string[]
          setCurrentStatus(`Parsed ${chatlogsToProcess.length} chatlogs from CSV.`);
        } catch (error) {
          throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else if (pastedChatlog.trim()) {
        chatlogsToProcess = [pastedChatlog.trim()];
        setCurrentStatus('Processing pasted chatlog.');
      } else {
        throw new Error("Please upload a CSV file or paste a chatlog.");
      }

      if (chatlogsToProcess.length === 0) {
        throw new Error("No valid chatlogs found in the input.");
      }

      setGlobalIsLoading(false); // Turn off initial button spinner, progress bar takes over

      for (let i = 0; i < chatlogsToProcess.length; i++) {
        if (cancelEvaluationRef.current) {
          setCurrentStatus('Evaluation cancelled by user.');
          toast({ title: "Evaluation Cancelled", description: `Processing stopped. ${successfulEvals} chatlogs evaluated.` });
          resetProcessState();
          return;
        }

        while (isPaused && !cancelEvaluationRef.current) {
          setCurrentStatus(`Evaluation paused at chatlog ${i + 1}/${chatlogsToProcess.length}. Click Resume.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (cancelEvaluationRef.current) {
            setCurrentStatus('Evaluation cancelled during pause.');
            toast({ title: "Evaluation Cancelled", description: `Processing stopped. ${successfulEvals} chatlogs evaluated.` });
            resetProcessState();
            return;
          }
        }
        
        const currentChatlog = chatlogsToProcess[i];
        setCurrentStatus(`Evaluating chatlog ${i + 1} of ${chatlogsToProcess.length} using ${selectedModel.split('/').pop()}...`);
        
        const apiResult: RawEvaluationResultFromAPI = await evaluateSingleChatlog(
          apiKey,
          selectedModel,
          promptTemplate,
          rubricText,
          currentChatlog
        );

        if (apiResult.scores && apiResult.error === null) {
          processedResultsForContext.push({
            chatlog: apiResult.original_chatlog, // Use original_chatlog from API result
            coherence: apiResult.scores.Coherence,
            politeness: apiResult.scores.Politeness,
            relevance: apiResult.scores.Relevance,
            resolution: apiResult.scores.Resolution,
          });
          successfulEvals++;
        } else {
          failedEvals++;
          console.warn(`Evaluation failed for chatlog index ${i}: ${apiResult.error || 'Unknown error'}. Chatlog: ${currentChatlog.substring(0,100)}... Raw Response: ${apiResult.raw_response?.substring(0,100)}`);
          // Optionally add a placeholder to processedResultsForContext or skip
          // For now, we only add successful evaluations to the context to avoid NaN issues.
          // If you want to show errors in the dashboard, the context and dashboard need to handle items with missing scores.
        }
        setProgress(Math.round(((i + 1) / chatlogsToProcess.length) * 100));
      }

      if (cancelEvaluationRef.current) { // Final check if cancelled during the last iteration
        setCurrentStatus('Evaluation cancelled by user.');
        toast({ title: "Evaluation Cancelled", description: `Processing stopped. ${successfulEvals} chatlogs evaluated.` });
        resetProcessState();
        return;
      }

      setEvaluationResults(processedResultsForContext);
      setCurrentStatus('Evaluation complete!');
      toast({
        title: "Evaluation Complete",
        description: `Successfully evaluated ${successfulEvals} chatlogs. ${failedEvals > 0 ? `${failedEvals} failed.` : ''}`
      });
      if (successfulEvals > 0) {
        navigate('/dashboard');
      } else {
        setGlobalError("No chatlogs were successfully evaluated. Check console for errors.");
        resetProcessState(); // Stay on page if no results
      }

    } catch (error) {
      console.error('Evaluation error in HomePage:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setGlobalError(errorMessage);
      setCurrentStatus(`Error: ${errorMessage}`);
      toast({ title: "Evaluation Failed", description: errorMessage, variant: "destructive" });
      resetProcessState(); // Reset state on major error
    } 
    // `finally` block removed to allow conditional reset based on success/failure/cancellation
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) { // About to be paused
      setCurrentStatus('Evaluation paused. Click Resume to continue.');
    } else { // About to be resumed
      setCurrentStatus(`Resuming evaluation...`);
    }
  };

  const handleCancel = () => {
    toast({ title: "Cancellation Requested", description: "Attempting to stop evaluation..." });
    cancelEvaluationRef.current = true;
    setIsPaused(false); 
  };

  const isInputValid = file !== null || pastedChatlog.trim().length > 0;

  return (
    <div>
      <PageTitle
        title="Chatlog Quality Analyzer"
        description="Upload or paste customer service chatlogs to receive automated quality scores using Google's generative AI models."
      />

      <div className="grid gap-8">
        <Card className={`p-6 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-medium mb-4">Upload Chatlog CSV File</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with a 'Chatlog' column containing the conversation text.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0 file:text-sm file:font-medium
              file:bg-app-blue file:text-white hover:file:bg-app-blue-light" // Ensure these CSS vars exist
          />
          {file && (
            <p className="mt-2 text-sm text-green-600">File selected: {file.name}</p>
          )}
        </Card>

        <Card className={`p-6 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-medium mb-4">Or Paste Single Chatlog Here</h2>
          <Textarea
            placeholder="Paste a single chatlog conversation here..."
            className="min-h-[150px]"
            value={pastedChatlog}
            onChange={handlePastedChatlogChange}
            disabled={isProcessing}
          />
        </Card>

        {!isProcessing ? (
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleEvaluate}
              disabled={!isInputValid || globalIsLoading}
              className="bg-app-blue hover:bg-app-blue-light" // Ensure these CSS vars exist
              size="lg"
            >
              {globalIsLoading && !isProcessing ? <LoadingSpinner /> : 'Evaluate Chatlogs'}
            </Button>
          </div>
        ) : (
          <Card className="p-6 mt-4">
            <h3 className="text-lg font-medium mb-2">Evaluation Progress</h3>
            <Progress value={progress} className="w-full mb-2" />
            <p className="text-sm text-gray-700 mb-4 min-h-[20px]">{currentStatus}</p> {/* Added min-h for stability */}
            <div className="flex space-x-2 justify-end">
              <Button
                onClick={handlePauseResume}
                variant="outline"
                disabled={cancelEvaluationRef.current}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="destructive"
                disabled={cancelEvaluationRef.current}
              >
                Cancel Evaluation
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomePage;

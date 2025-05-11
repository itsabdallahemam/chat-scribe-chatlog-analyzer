// src/pages/HomePage.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
import { evaluateSingleChatlog } from '@/services/googleAI';
import { parseCSV } from '@/utils/csvParser';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

// Type expected by the ChatlogContext for evaluationResults
interface EvaluationResultForContext {
  chatlog: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  timestamp: Date;
}

const OrSeparator: React.FC = () => (
  <div className="flex items-center w-full py-4">
    <div className="flex-grow h-px bg-border" />
    <span className="mx-3 px-3 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold shadow-sm border border-border">OR</span>
    <div className="flex-grow h-px bg-border" />
  </div>
);

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
    loadSavedChatLogs,
  } = useChatlog();

  const [file, setFile] = useState<File | null>(null);
  const [pastedChatlog, setPastedChatlog] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const cancelEvaluationRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved chat logs when component mounts
  useEffect(() => {
    loadSavedChatLogs();
  }, [loadSavedChatLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setPastedChatlog(''); // Clear pasted text if file is selected
    }
  };

  const handlePastedChatlogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedChatlog(e.target.value);
    if (e.target.value.trim()) {
      setFile(null); // Clear file if text is pasted
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    setGlobalIsLoading(true);
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
          chatlogsToProcess = parseCSV(text);
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

      setGlobalIsLoading(false);

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
        
        const apiResult = await evaluateSingleChatlog(
          apiKey,
          selectedModel,
          promptTemplate,
          rubricText,
          currentChatlog
        );

        if (apiResult.scores && apiResult.error === null) {
          processedResultsForContext.push({
            chatlog: apiResult.original_chatlog,
            coherence: apiResult.scores.Coherence,
            politeness: apiResult.scores.Politeness,
            relevance: apiResult.scores.Relevance,
            resolution: apiResult.scores.Resolution,
            timestamp: new Date(),
          });
          successfulEvals++;
        } else {
          failedEvals++;
          console.warn(`Evaluation failed for chatlog index ${i}: ${apiResult.error || 'Unknown error'}. Chatlog: ${currentChatlog.substring(0,100)}... Raw Response: ${apiResult.raw_response?.substring(0,100)}`);
        }
        setProgress(Math.round(((i + 1) / chatlogsToProcess.length) * 100));
      }

      if (cancelEvaluationRef.current) {
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
        resetProcessState();
      }

    } catch (error) {
      console.error('Evaluation error in HomePage:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setGlobalError(errorMessage);
      setCurrentStatus(`Error: ${errorMessage}`);
      toast({ title: "Evaluation Failed", description: errorMessage, variant: "destructive" });
      resetProcessState();
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setCurrentStatus('Evaluation paused. Click Resume to continue.');
    } else {
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <PageTitle
        title={<span className="inline-block bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">Chatlog Quality Analyzer</span>}
        description="Upload or paste customer service chatlogs to receive automated quality scores using Google's generative AI models."
      />

      <div className="max-w-6xl mx-auto mt-8">
        {!isProcessing ? (
          <Card className="rounded-xl shadow-lg border-0 bg-card">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 via-cyan-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-green-400 text-white shadow-lg dark:from-blue-900 dark:via-cyan-900 dark:to-green-900">
                  <UploadCloud className="w-7 h-7" />
                </span>
                <CardTitle className="text-2xl font-bold text-card-foreground">Start New Evaluation</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground mt-2">
                Choose your preferred method to analyze chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8">
                {/* CSV Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                    <h3 className="text-lg font-semibold text-blue-700 bg-blue-50 rounded-full px-3 py-1 dark:text-blue-200 dark:bg-blue-900/40">Upload CSV File</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50/40 hover:bg-blue-100/60 transition-colors dark:border-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/60"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-blue-400 dark:text-blue-200" />
                          <p className="mb-2 text-sm text-blue-700 dark:text-blue-200">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-300">CSV files only (max 5MB)</p>
                        </div>
                      </label>
                    </div>
                    {file && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg dark:bg-blue-900/40">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                          <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-300">{file.name}</p>
                            <p className="text-xs text-blue-400 dark:text-blue-200">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-blue-500 dark:text-blue-300">
                      CSV must contain a 'Chatlog' column with the conversation text
                    </p>
                  </div>
                </div>
                <div className="flex items-center w-full py-4">
                  <div className="flex-grow h-px bg-gradient-to-r from-blue-200 via-cyan-200 to-green-200 dark:from-blue-900 dark:via-cyan-900 dark:to-green-900" />
                  <span className="mx-3 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-100 via-cyan-100 to-green-100 text-blue-600 text-xs font-semibold shadow-sm border border-blue-200 dark:from-blue-900 dark:via-cyan-900 dark:to-green-900 dark:text-blue-200 dark:border-blue-800">OR</span>
                  <div className="flex-grow h-px bg-gradient-to-r from-blue-200 via-cyan-200 to-green-200 dark:from-blue-900 dark:via-cyan-900 dark:to-green-900" />
                </div>
                {/* Paste Chatlog Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-500 dark:text-green-300" />
                    <h3 className="text-lg font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1 dark:text-green-200 dark:bg-green-900/40">Paste Single Chatlog</h3>
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste your chatlog conversation here..."
                      className="min-h-[150px] resize-none border-input focus-visible:ring-ring"
                      value={pastedChatlog}
                      onChange={handlePastedChatlogChange}
                    />
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Paste a single chatlog conversation to evaluate
                    </p>
                  </div>
                </div>
              </div>

              {/* Evaluate Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleEvaluate}
                  disabled={!isInputValid || globalIsLoading}
                  className={`px-8 py-6 text-lg font-semibold rounded-xl transition-all ${
                    isInputValid
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  {globalIsLoading && !isProcessing ? (
                    <LoadingSpinner />
                  ) : (
                    'Evaluate Chatlogs'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-lg border-0 bg-card">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-card-foreground">Evaluation Progress</CardTitle>
              <CardDescription className="text-muted-foreground">
                {currentStatus}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={handlePauseResume}
                  variant="outline"
                  disabled={cancelEvaluationRef.current}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  disabled={cancelEvaluationRef.current}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Cancel Evaluation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomePage;

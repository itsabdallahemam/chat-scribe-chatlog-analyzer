import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
import { evaluateSingleChatlog } from '@/services/googleAI';
import { parseCSV } from '@/utils/csvParser';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AlertCircle, FileText, X, CheckCircle, RefreshCw, PauseCircle, PlayCircle, StopCircle, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Type expected by the ChatlogContext for evaluationResults
interface EvaluationResultForContext {
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  timestamp: Date;
}

const ChatlogEvaluationPage: React.FC = () => {
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [csvPreview, setCsvPreview] = useState<{ chatlog: string; scenario: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string>('');
  const cancelEvaluationRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup drag and drop handlers
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const highlight = () => {
      dropArea.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/30');
    };

    const unhighlight = () => {
      dropArea.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/30');
    };

    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      unhighlight();
      
      const dt = e.dataTransfer;
      if (dt?.files && dt.files.length) {
        handleFile(dt.files[0]);
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    return () => {
      if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, preventDefaults);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.removeEventListener(eventName, highlight);
        });
        ['dragleave', 'drop'].forEach(eventName => {
          dropArea.removeEventListener(eventName, unhighlight);
        });
        dropArea.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    setPreviewLoading(true);
    setCsvErrorMessage('');
    
    try {
      const text = await selectedFile.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        setCsvErrorMessage('No valid data found in CSV file');
        setFile(null);
      } else {
        setCsvPreview(parsedData.slice(0, 3)); // Show first 3 entries
      }
    } catch (error) {
      setCsvErrorMessage(`Error parsing CSV: ${error instanceof Error ? error.message : String(error)}`);
      setFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvPreview([]);
    setCsvErrorMessage('');
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
    if (!file) {
      toast({ title: "No File Selected", description: "Please upload a CSV file with chatlogs.", variant: "destructive" });
      return;
    }

    setGlobalIsLoading(true);
    setIsProcessing(true);
    setGlobalError(null);
    setProgress(0);
    setCurrentStatus('Preparing chatlogs...');
    cancelEvaluationRef.current = false;
    setIsPaused(false);

    let chatlogsToProcess: { chatlog: string; scenario: string }[] = [];
    const processedResultsForContext: EvaluationResultForContext[] = [];
    let successfulEvals = 0;
    let failedEvals = 0;

    try {
      const text = await file.text();
      try {
        chatlogsToProcess = parseCSV(text);
        setCurrentStatus(`Parsed ${chatlogsToProcess.length} chatlogs from CSV.`);
      } catch (error) {
        throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (chatlogsToProcess.length === 0) {
        throw new Error("No valid chatlogs found in the CSV file.");
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
        
        const currentInputItem = chatlogsToProcess[i];
        setCurrentStatus(`Evaluating chatlog ${i + 1} of ${chatlogsToProcess.length} using ${selectedModel.split('/').pop()}...`);
        
        try {
          const apiResult = await evaluateSingleChatlog(
            apiKey,
            selectedModel,
            promptTemplate,
            rubricText,
            currentInputItem.chatlog
          );
  
          if (apiResult.scores && apiResult.error === null) {
            processedResultsForContext.push({
              chatlog: apiResult.original_chatlog,
              scenario: currentInputItem.scenario || "Unnamed Scenario",
              coherence: apiResult.scores.Coherence,
              politeness: apiResult.scores.Politeness,
              relevance: apiResult.scores.Relevance,
              resolution: apiResult.scores.Resolution,
              timestamp: new Date(),
            });
            successfulEvals++;
          } else {
            failedEvals++;
            console.warn(`Evaluation failed for chatlog index ${i}: ${apiResult.error || 'Unknown error'}. Chatlog: ${currentInputItem.chatlog.substring(0,100)}... Raw Response: ${apiResult.raw_response?.substring(0,100)}`);
          }
        } catch (evalError) {
          failedEvals++;
          console.error(`Error evaluating chatlog at index ${i}:`, evalError);
        }
        
        setProgress(Math.round(((i + 1) / chatlogsToProcess.length) * 100));
      }

      if (cancelEvaluationRef.current) {
        setCurrentStatus('Evaluation cancelled by user.');
        toast({ title: "Evaluation Cancelled", description: `Processing stopped. ${successfulEvals} chatlogs evaluated.` });
        resetProcessState();
        return;
      }

      // Set evaluation results and wait for them to be saved
      if (successfulEvals > 0) {
        setEvaluationResults(processedResultsForContext);
        setCurrentStatus('Saving results...');
        
        // Wait a moment to ensure the save operation completes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCurrentStatus('Evaluation complete!');
        toast({
          title: "Evaluation Complete",
          description: `Successfully evaluated ${successfulEvals} chatlogs. ${failedEvals > 0 ? `${failedEvals} failed.` : ''}`
        });
        
        // Reload saved chat logs before navigation
        await loadSavedChatLogs();
        navigate('/dashboard');
      } else {
        setGlobalError("No chatlogs were successfully evaluated. Check console for errors.");
        resetProcessState();
      }

    } catch (error) {
      console.error('Evaluation error in ChatlogEvaluationPage:', error);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle
        title="Chatlog Evaluation"
        description="Upload a CSV file with customer service chatlogs to evaluate their quality."
      />
      
      {!isProcessing && (
        <div className="mt-8 max-w-3xl mx-auto">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Upload Your CSV File</CardTitle>
              <CardDescription className="text-center">
                Upload a CSV file containing chatlog data for evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={dropAreaRef}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 transition-colors duration-200 cursor-pointer bg-card flex flex-col items-center justify-center min-h-[250px]"
                onClick={() => fileInputRef.current?.click()}
              >
                {!file ? (
                  <>
                    <div className="mb-4 p-3 bg-primary/10 rounded-full">
                      <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium mb-2">Upload CSV file</p>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Drag and drop your CSV file here or click to browse
                    </p>
                    <Button size="sm" variant="outline">
                      Select File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".csv"
                    />
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-muted rounded-full mr-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {previewLoading ? (
                      <div className="flex justify-center my-4">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      </div>
                    ) : csvErrorMessage ? (
                      <Alert variant="destructive" className="my-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CSV Error</AlertTitle>
                        <AlertDescription>{csvErrorMessage}</AlertDescription>
                      </Alert>
                    ) : csvPreview.length > 0 ? (
                      <div className="my-4">
                        <p className="font-medium mb-2 text-sm">Preview (first 3 entries):</p>
                        <div className="bg-muted p-3 rounded-md max-h-[200px] overflow-y-auto text-xs">
                          {csvPreview.map((item, index) => (
                            <div key={index} className="mb-2 pb-2 border-b last:border-0 border-border">
                              <p className="font-semibold">Scenario: {item.scenario || "Unnamed"}</p>
                              <p className="line-clamp-2">{item.chatlog.substring(0, 100)}...</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total entries: {csvPreview.length === 3 ? '3+' : csvPreview.length}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format Requirements</AlertTitle>
                  <AlertDescription>
                    <p>Your CSV file should have the following columns:</p>
                    <ul className="list-disc list-inside mt-1 ml-1 text-sm">
                      <li><code className="px-1 py-0.5 bg-muted rounded">chatlog</code> - The full conversation text</li>
                      <li><code className="px-1 py-0.5 bg-muted rounded">scenario</code> (optional) - A label to identify the conversation</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="default" 
                size="lg"
                onClick={handleEvaluate}
                disabled={!file || previewLoading || !!csvErrorMessage}
                className="px-8"
              >
                Evaluate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isProcessing && (
        <Card className="mt-8 max-w-3xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Processing Chatlogs</CardTitle>
            <CardDescription>Analyzing your customer service interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{`Progress: ${progress}%`}</span>
                <span className="text-sm text-muted-foreground">{currentStatus}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button variant="outline" size="icon" onClick={handlePauseResume}>
                {isPaused ? (
                  <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                ) : (
                  <PauseCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCancel}>
                <StopCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {globalIsLoading && <LoadingSpinner />}
    </div>
  );
};

export default ChatlogEvaluationPage; 
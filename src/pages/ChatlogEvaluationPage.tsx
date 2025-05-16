import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useChatlog } from '@/contexts/ChatlogContext';
import { evaluateSingleChatlog } from '@/services/googleAI';
import { parseCSV, ChatlogWithScenario } from '@/utils/csvParser';
import { useToast } from '@/hooks/use-toast';
import { 
  UploadCloud, AlertCircle, FileText, X, CheckCircle, RefreshCw, 
  PauseCircle, PlayCircle, StopCircle, ArrowRight, Settings, 
  Bot, FileUp, Sparkles, Gauge
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Type expected by the ChatlogContext for evaluationResults
interface EvaluationResultForContext {
  chatlog: string;
  scenario: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  shift?: string;
  dateTime?: string;
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
  const [csvPreview, setCsvPreview] = useState<{ chatlog: string; scenario: string; shift?: string; dateTime?: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string>('');
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [uniqueScenarios, setUniqueScenarios] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [successfulEvals, setSuccessfulEvals] = useState<number>(0);
  const [failedEvals, setFailedEvals] = useState<number>(0);
  const [waitTimer, setWaitTimer] = useState<number | null>(null);
  const cancelEvaluationRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    try {
    setFile(selectedFile);
    setPreviewLoading(true);
    setCsvErrorMessage('');
    
      // Read file content
      const fileContent = await selectedFile.text();
    
    try {
        // Parse CSV content
        const parsedData = parseCSV(fileContent);
        console.log("Parsed data:", parsedData);
      
      if (parsedData.length === 0) {
          setCsvErrorMessage('No valid data found in the CSV file. Please check the format.');
          setCsvPreview([]);
      } else {
          // Get only first 3 entries for preview
          const previewData = parsedData.slice(0, 3);
          setCsvPreview(previewData);
          
          // Count unique scenarios
          const uniqueScenarios = new Set(parsedData.map(item => item.scenario)).size;
          
          // Store these in component state for display
          setTotalEntries(parsedData.length);
          setUniqueScenarios(uniqueScenarios);
      }
    } catch (error) {
        console.error('CSV parsing error:', error);
        setCsvErrorMessage(error instanceof Error ? error.message : String(error));
        setCsvPreview([]);
      }
    } catch (fileError) {
      console.error('File reading error:', fileError);
      setCsvErrorMessage('Failed to read the file. Please try again.');
      setCsvPreview([]);
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
    setProgress(0);
    setCurrentStatus('');
    setGlobalIsLoading(false);
    setIsPaused(false);
    setEstimatedTime('');
    setSuccessfulEvals(0);
    setFailedEvals(0);
    cancelEvaluationRef.current = false;
  };

  const handleEvaluate = async () => {
    console.log("=== EVALUATE BUTTON CLICKED ===");
    console.log("API Key exists:", !!apiKey, "Length:", apiKey?.length);
    console.log("Selected Model:", selectedModel);
    console.log("File exists:", !!file, "File name:", file?.name);
    
    if (!apiKey) {
      console.error("API Key missing - showing toast");
      toast({ 
        title: "API Key Missing", 
        description: "Please add your Google API key in Settings before evaluating chatlogs.", 
        variant: "destructive" 
      });
      return;
    }
    if (!selectedModel) {
      console.error("Model not selected - showing toast");
      toast({ 
        title: "Model Not Selected", 
        description: "Please select an AI model in Settings before evaluating chatlogs.", 
        variant: "destructive" 
      });
      return;
    }
    if (!file) {
      console.error("No file selected - showing toast");
      toast({ 
        title: "No File Selected", 
        description: "Please upload a CSV file with chatlogs to evaluate.", 
        variant: "destructive" 
      });
      return;
    }

    console.log("All prerequisites passed, starting evaluation process");
    setGlobalIsLoading(true);
    setIsProcessing(true);
    setGlobalError(null);
    setProgress(0);
    setCurrentStatus('Preparing chatlogs...');
    cancelEvaluationRef.current = false;
    setIsPaused(false);
    setSuccessfulEvals(0);
    setFailedEvals(0);

    let chatlogsToProcess: ChatlogWithScenario[] = [];
    const processedResultsForContext: EvaluationResultForContext[] = [];
    let localSuccessfulEvals = 0;
    let localFailedEvals = 0;

    try {
      // Read the file and parse CSV
      console.log("Reading file content...");
      const fileContent = await file.text();
      console.log("Parsing CSV data...");
      chatlogsToProcess = parseCSV(fileContent);
      console.log(`Successfully parsed ${chatlogsToProcess.length} chatlog entries`);

      if (chatlogsToProcess.length === 0) {
        console.error("No valid chatlogs found in CSV");
        throw new Error("No valid chatlogs found in the CSV file. Please check the format and try again.");
      }

      // Calculate estimated time based on rate limiting (30 requests per minute)
      const RATE_LIMIT = 30; // requests per minute
      const RATE_LIMIT_INTERVAL = 60000 / RATE_LIMIT; // ms between requests (~2000ms)
      
      const totalMinutes = Math.ceil(chatlogsToProcess.length / RATE_LIMIT);
      let estimatedTimeText = '';
      
      if (totalMinutes < 1) {
        estimatedTimeText = 'less than a minute';
      } else if (totalMinutes === 1) {
        estimatedTimeText = 'about 1 minute';
      } else if (totalMinutes < 60) {
        estimatedTimeText = `about ${totalMinutes} minutes`;
      } else {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        estimatedTimeText = `about ${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
      }
      
      setEstimatedTime(estimatedTimeText);
      setCurrentStatus(`Preparing to evaluate ${chatlogsToProcess.length} chatlogs...`);
      console.log(`Estimated time: ${estimatedTimeText}`);
      
      // Set up API request queue to control rate limiting
      const startTime = Date.now();
      let lastUpdateTime = startTime;
      const requestTimestamps: number[] = [];
      
      // Helper function to handle rate limiting
      const executeWithRateLimit = async (fn: () => Promise<any>) => {
        try {
          // Check if we need to wait based on the sliding window of the last RATE_LIMIT requests
          if (requestTimestamps.length >= RATE_LIMIT) {
            const oldestRequest = requestTimestamps[0];
            const timeElapsed = Date.now() - oldestRequest;
            
            // If we've made RATE_LIMIT requests in less than 60 seconds, we need to wait
            if (timeElapsed < 60000) {
              const waitTime = 60000 - timeElapsed + 100; // Add 100ms buffer
              setCurrentStatus(`Rate limit reached. Waiting ${Math.round(waitTime / 1000)} seconds...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            // Remove oldest timestamp
            requestTimestamps.shift();
          }
          
          // Add current timestamp and execute function
          requestTimestamps.push(Date.now());
          return await fn();
        } catch (error: any) {
          // Check if this is a rate limit error (429)
          if (error.message && error.message.includes('429')) {
            console.log('Rate limit error detected:', error.message);
            
            // Try to extract the retry delay from the error message
            let retryDelay = 60000; // Default to 60 seconds if we can't parse
            
            try {
              const retryDelayMatch = error.message.match(/"retryDelay": "(\d+)s"/);
              if (retryDelayMatch && retryDelayMatch[1]) {
                // Convert seconds to milliseconds
                retryDelay = parseInt(retryDelayMatch[1], 10) * 1000;
                console.log(`Extracted retry delay: ${retryDelay}ms from API response`);
              }
            } catch (parseError) {
              console.error('Error parsing retry delay:', parseError);
            }
            
            // Clear all request timestamps since we need to reset our tracking
            requestTimestamps.length = 0;
            
            await waitForRateLimit(retryDelay, `API quota exceeded. Waiting ${Math.ceil(retryDelay / 1000)} seconds as requested by the API...`);
            
            // Try again after waiting
            return await fn();
          }
          
          // If it's not a rate limit error, rethrow
          throw error;
        }
      };
      
      // Update estimated time periodically
      const updateEstimatedTime = () => {
        // Only update if more than 10 seconds have passed since last update
        if (Date.now() - lastUpdateTime < 10000) return;
        
        lastUpdateTime = Date.now();
        
        const elapsed = Date.now() - startTime;
        const processedItems = localSuccessfulEvals + localFailedEvals;
        
        if (processedItems === 0) return;
        
        const msPerItem = elapsed / processedItems;
        const remainingItems = chatlogsToProcess.length - processedItems;
        const estimatedRemainingMs = msPerItem * remainingItems;
        
        // Format the time in a human-readable way
        let updatedEstimatedTimeText = '';
        const remainingMinutes = Math.ceil(estimatedRemainingMs / 60000);
        
        if (remainingMinutes < 1) {
          updatedEstimatedTimeText = 'less than a minute';
        } else if (remainingMinutes === 1) {
          updatedEstimatedTimeText = 'about 1 minute';
        } else if (remainingMinutes < 60) {
          updatedEstimatedTimeText = `about ${remainingMinutes} minutes`;
        } else {
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;
          updatedEstimatedTimeText = `about ${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
        }
        
        setEstimatedTime(updatedEstimatedTimeText);
      };

      // Helper function to wait for API rate limit with countdown timer
      const waitForRateLimit = async (retryDelay: number, message: string) => {
        // Set up a countdown timer
        const waitSeconds = Math.ceil(retryDelay / 1000);
        setWaitTimer(waitSeconds);
        
        // Clear any existing timer
        if (waitTimerRef.current) {
          clearInterval(waitTimerRef.current);
        }
        
        // Set up the interval for countdown
        waitTimerRef.current = setInterval(() => {
          setWaitTimer(prev => {
            if (prev === null || prev <= 1) {
              if (waitTimerRef.current) {
                clearInterval(waitTimerRef.current);
                waitTimerRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Display status message
        setCurrentStatus(message || `API quota exceeded. Waiting ${waitSeconds} seconds as requested by the API...`);
        
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, retryDelay + 1000)); // Add 1 second buffer
        
        // Clear the timer when done
        if (waitTimerRef.current) {
          clearInterval(waitTimerRef.current);
          waitTimerRef.current = null;
        }
        setWaitTimer(null);
      };

      // Process the first chatlog for testing
      try {
        console.log("Attempting to evaluate the first chatlog to verify API connection...");
        console.log("API Key (first/last 5 chars):", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5));
        console.log("Selected Model:", selectedModel);
        
        const testChatlog = chatlogsToProcess[0];
        console.log("Test chatlog (first 50 chars):", testChatlog.chatlog.substring(0, 50) + "...");
        
        // First test direct Google API connectivity with a simple request
        try {
          const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const testStatus = testResponse.status;
          console.log("API connectivity test status:", testStatus);
          
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error("API connectivity test failed:", errorText);
            throw new Error(`Google API connectivity test failed with status ${testStatus}: ${errorText}`);
          }
          
          console.log("API connectivity test successful!");
        } catch (connectError) {
          console.error("API connectivity test error:", connectError);
          throw new Error(`Google API connectivity test error: ${connectError instanceof Error ? connectError.message : String(connectError)}`);
        }
        
        // Now test the actual evaluation
        const apiResult = await evaluateSingleChatlog(
          apiKey,
          selectedModel,
          promptTemplate,
          rubricText,
          testChatlog.chatlog
        );
        
        console.log("API test result:", JSON.stringify(apiResult).substring(0, 200) + "...");
        
        if (apiResult.error) {
          console.error("Error in first test evaluation:", apiResult.error);
          throw new Error(`API test failed: ${apiResult.error}`);
        }
        
        console.log("Test evaluation successful, proceeding with full evaluation");
        // Continue with existing code...
      } catch (testError) {
        console.error("Test evaluation failed:", testError);
        resetProcessState();
        setCurrentStatus('');
        toast({ 
          title: "API Test Failed", 
          description: testError instanceof Error ? testError.message : String(testError), 
          variant: "destructive" 
        });
        return;
      }

      for (let i = 0; i < chatlogsToProcess.length; i++) {
        if (cancelEvaluationRef.current) {
          break;
        }

        const currentInputItem = chatlogsToProcess[i];
        
        setCurrentStatus(`Evaluating chatlog ${i + 1} of ${chatlogsToProcess.length}${isPaused ? ' (paused)' : ''}...`);
        
        // Wait if paused
        while (isPaused && !cancelEvaluationRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
          if (cancelEvaluationRef.current) {
          break;
        }
        
        try {
          // Process evaluation with rate limiting
          const apiResult = await executeWithRateLimit(async () => {
            return await evaluateSingleChatlog(
            apiKey,
            selectedModel,
            promptTemplate,
            rubricText,
            currentInputItem.chatlog
          );
          });
  
          if (apiResult.scores && apiResult.error === null) {
            processedResultsForContext.push({
              chatlog: apiResult.original_chatlog,
              scenario: currentInputItem.scenario || "Unnamed Scenario",
              coherence: apiResult.scores.Coherence,
              politeness: apiResult.scores.Politeness,
              relevance: apiResult.scores.Relevance,
              resolution: apiResult.scores.Resolution,
              shift: currentInputItem.shift || undefined,
              dateTime: currentInputItem.dateTime || undefined,
              timestamp: new Date(),
            });
            localSuccessfulEvals++;
            setSuccessfulEvals(localSuccessfulEvals);
          } else {
            // Check if we received a rate limit error from the API
            if (apiResult.error && apiResult.error.includes('429')) {
              console.log('Rate limit error detected in API response:', apiResult.error);
              
              // Try to extract the retry delay from the error message
              let retryDelay = 60000; // Default to 60 seconds if we can't parse
              
              try {
                const retryDelayMatch = apiResult.error.match(/"retryDelay": "(\d+)s"/);
                if (retryDelayMatch && retryDelayMatch[1]) {
                  // Convert seconds to milliseconds
                  retryDelay = parseInt(retryDelayMatch[1], 10) * 1000;
                  console.log(`Extracted retry delay: ${retryDelay}ms from API response`);
                }
              } catch (parseError) {
                console.error('Error parsing retry delay from API response:', parseError);
              }
              
              // Clear all request timestamps since we need to reset our tracking
              requestTimestamps.length = 0;
              
              await waitForRateLimit(retryDelay, `API quota exceeded. Waiting ${Math.ceil(retryDelay / 1000)} seconds as requested by the API...`);
              
              // Retry this item by decrementing the counter
              i--;
              continue;
            }
            
            localFailedEvals++;
            setFailedEvals(localFailedEvals);
            console.warn(`Evaluation failed for chatlog index ${i}: ${apiResult.error || 'Unknown error'}. Chatlog: ${currentInputItem.chatlog.substring(0,100)}... Raw Response: ${apiResult.raw_response?.substring(0,100)}`);
          }
          
          // Update progress and estimated time
          setProgress(Math.round(((i + 1) / chatlogsToProcess.length) * 100));
          updateEstimatedTime();
          
        } catch (evalError) {
          console.error(`Error evaluating chatlog at index ${i}:`, evalError);
          
          // Check if this is a rate limit error we should retry
          if (evalError instanceof Error && evalError.message.includes('429')) {
            console.log('Rate limit error in catch block:', evalError.message);
            
            // Try to extract retry delay
            let retryDelay = 60000; // Default 60 seconds
            try {
              const retryDelayMatch = evalError.message.match(/"retryDelay": "(\d+)s"/);
              if (retryDelayMatch && retryDelayMatch[1]) {
                retryDelay = parseInt(retryDelayMatch[1], 10) * 1000;
              }
            } catch (parseError) {
              console.error('Error parsing retry delay from caught error:', parseError);
            }
            
            await waitForRateLimit(retryDelay, `API quota exceeded. Waiting ${Math.ceil(retryDelay / 1000)} seconds as requested by the API...`);
            
            i--; // Retry this item
            continue;
          }
          
          // If not a rate limit error, count as failed
          localFailedEvals++;
          setFailedEvals(localFailedEvals);
          
          // Add a longer delay on error to recover
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update progress and estimated time
        setProgress(Math.round(((i + 1) / chatlogsToProcess.length) * 100));
          updateEstimatedTime();
        }
      }

      if (cancelEvaluationRef.current) {
        setCurrentStatus('Evaluation cancelled by user.');
        toast({ 
          title: "Evaluation Cancelled", 
          description: `Processing stopped. ${localSuccessfulEvals} chatlogs evaluated.`,
          variant: "default" 
        });
        resetProcessState();
        return;
      }

      // Set evaluation results and wait for them to be saved
      if (localSuccessfulEvals > 0) {
        setEvaluationResults(processedResultsForContext);
        setCurrentStatus('Saving results...');
        
        // Wait a moment to ensure the save operation completes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCurrentStatus('Evaluation complete!');
        toast({
          title: "Evaluation Complete",
          description: `Successfully evaluated ${localSuccessfulEvals} chatlogs. ${localFailedEvals > 0 ? `${localFailedEvals} failed.` : ''}`,
          variant: "default"
        });
        
        // Reload saved chat logs before navigation
        await loadSavedChatLogs();
        
        // Add a small delay for better UX between toast and navigation
        await new Promise(resolve => setTimeout(resolve, 800));
        navigate('/dashboard');
      } else {
        setGlobalError("No chatlogs were successfully evaluated. Please check the file format and try again.");
        toast({ 
          title: "Evaluation Failed", 
          description: "No chatlogs were successfully evaluated. Please check the file format and try again.", 
          variant: "destructive" 
        });
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

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) {
        clearInterval(waitTimerRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <PageTitle
            title="Chatlog Evaluation"
            description="Upload a CSV file with customer service chatlogs to evaluate their quality"
          />
          
          {selectedModel && (
            <Badge variant="outline" className="px-3 py-1.5 gap-2 h-auto font-normal bg-primary/5 hover:bg-primary/10 transition-colors">
              <Bot className="h-4 w-4 text-primary" />
              <span>Using Model: <span className="font-medium text-primary">{selectedModel.replace('models/', '')}</span></span>
            </Badge>
          )}
        </div>
        
        {!isProcessing && (
          <div className="mt-8 max-w-3xl mx-auto">
            <Card className="shadow-md border-border/40 overflow-hidden">
              <CardHeader className="bg-card/50 pb-4">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-2xl font-bold">Upload Your CSV File</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Upload a CSV file containing chatlog data for AI-powered quality evaluation.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  ref={dropAreaRef}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 transition-colors duration-200 cursor-pointer bg-card/50 flex flex-col items-center justify-center min-h-[250px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!file ? (
                    <>
                      <div className="mb-4 p-4 bg-primary/10 rounded-full">
                        <UploadCloud className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-medium mb-2">Upload CSV file</p>
                      <p className="text-sm text-muted-foreground mb-5 text-center max-w-md">
                        Drag and drop your CSV file here or click to browse
                      </p>
                      <Button size="sm" variant="outline" className="gap-2">
                        <FileUp className="h-4 w-4" />
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
                          <div className="p-2.5 bg-primary/10 rounded-full mr-3">
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
                          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : csvErrorMessage ? (
                        <Alert variant="destructive" className="my-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>CSV Error</AlertTitle>
                          <AlertDescription>{csvErrorMessage}</AlertDescription>
                        </Alert>
                      ) : csvPreview.length > 0 ? (
                        <div className="my-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium text-sm">Preview:</p>
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary" className="font-normal h-6">
                                <span className="font-semibold">{totalEntries}</span> total entries
                              </Badge>
                              <Badge variant="secondary" className="font-normal h-6">
                                <span className="font-semibold">{uniqueScenarios}</span> scenarios
                              </Badge>
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-lg overflow-hidden border border-border/40">
                            {csvPreview.map((item, index) => (
                              <div key={index} className="p-3.5 border-b last:border-0 border-border/40 hover:bg-accent/20 transition-colors">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge className="bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-300 hover:bg-blue-500/25 dark:hover:bg-blue-500/30 border-transparent">
                                    {item.scenario || "Unnamed"}
                                  </Badge>
                                  
                                  {item.shift && (
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 border-purple-200 dark:border-purple-800/30">
                                      {item.shift}
                                    </Badge>
                                  )}
                                  
                                  {item.dateTime && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-300 hover:bg-green-500/20 border-green-200 dark:border-green-800/30">
                                        {item.dateTime}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{item.chatlog.substring(0, 150)}...</p>
                              </div>
                            ))}
                          </div>
                          {totalEntries > 3 && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              And {totalEntries - 3} more entries...
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Alert className="cursor-help hover:bg-muted/50 transition-colors">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CSV Format Requirements</AlertTitle>
                        <AlertDescription>
                          <p>Your CSV file should have the following columns:</p>
                          <ul className="list-disc list-inside mt-1 ml-1 text-sm">
                            <li><code className="px-1 py-0.5 bg-muted rounded">chatlog</code> - The full conversation text</li>
                            <li><code className="px-1 py-0.5 bg-muted rounded">scenario</code> (optional) - A label to identify the conversation</li>
                            <li><code className="px-1 py-0.5 bg-muted rounded">shift</code> (optional) - Shift type (Night, Evening, or Morning)</li>
                            <li><code className="px-1 py-0.5 bg-muted rounded">date and time</code> (optional) - Format: YYYY-MM-DD HH:MM</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="w-80">
                      <p className="font-semibold mb-1">Example CSV Format:</p>
                      <code className="bg-muted p-2 rounded-md text-xs block mb-2 whitespace-pre">chatlog,scenario,shift,dateTime
"Customer: Hi, I need help with my order.
Agent: Hello! I'd be happy to help with your order.",Product Return,Morning,2023-05-18 09:30</code>
                      <p className="text-xs">The chatlog column is required. All others are optional but help with organization and filtering.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="gap-1.5"
                >
                  <Settings className="h-4 w-4" />
                  Evaluation Settings
                </Button>
                
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={handleEvaluate}
                  disabled={!file || previewLoading || !!csvErrorMessage || !selectedModel || !apiKey}
                  className="px-8 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Evaluate
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {isProcessing && (
          <Card className="mt-8 max-w-3xl mx-auto shadow-md border-border/40">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Processing Chatlogs
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Analyzing your customer service interactions using AI-powered evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Progress: {progress}%</span>
                      {waitTimer !== null && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-900/30 font-normal">
                          Waiting: {waitTimer}s
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{currentStatus}</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-2.5 ${currentStatus.includes('quota exceeded') || currentStatus.includes('Rate limit reached') 
                      ? 'bg-amber-200 dark:bg-amber-950' : ''}`} 
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-md p-3.5 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1.5">Current Progress</div>
                    <div className="font-medium flex items-center text-lg">
                      {isProcessing ? `${(successfulEvals + failedEvals)} / ${totalEntries}` : '0/0'}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-md p-3.5 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1.5">Successful</div>
                    <div className="font-medium flex items-center text-lg text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      {isProcessing ? successfulEvals : 0}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-md p-3.5 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1.5">Failed</div>
                    <div className="font-medium flex items-center text-lg text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      {isProcessing ? failedEvals : 0}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-md p-3.5 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1.5">Success Rate</div>
                    <div className="font-medium flex items-center text-lg">
                      {isProcessing && (successfulEvals + failedEvals) > 0
                        ? `${Math.round((successfulEvals / (successfulEvals + failedEvals)) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
                
                {estimatedTime && (
                  <div className={`text-sm p-4 rounded-md ${
                    currentStatus.includes('quota exceeded') || currentStatus.includes('Rate limit reached')
                      ? 'bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30'
                      : 'bg-muted/80 border border-border/40'
                  }`}>
                    <div className="flex items-center mb-3">
                      <span className="mr-2 bg-primary/10 p-1.5 rounded-full">
                        {currentStatus.includes('quota exceeded') 
                          ? <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
                          : <RefreshCw className="h-4 w-4 text-primary" />}
                      </span>
                      <span className="font-medium">
                        {currentStatus.includes('quota exceeded') 
                          ? waitTimer 
                            ? `Waiting for API quota to reset: ${waitTimer} seconds remaining...` 
                            : 'Waiting for API quota to reset...'
                          : `Estimated time remaining: ${estimatedTime}`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-8">
                      {currentStatus.includes('quota exceeded') ? (
                        <>
                          <div className="flex items-start mb-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 mt-1.5 mr-2"></span>
                            <span>Google API quota exceeded. Waiting as instructed by the API.</span>
                          </div>
                          <div className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-600 mt-1.5 mr-2"></span>
                            <span>Processing will automatically resume after the waiting period.</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start mb-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                            <span>Processing at approximately 30 requests per minute (Google API rate limit)</span>
                          </div>
                          <div className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                            <span>Large files may take some time to complete. You can pause or cancel at any time.</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  className="w-36 gap-2" 
                  onClick={handlePauseResume}
                  disabled={currentStatus.includes('quota exceeded')}
                >
                  {isPaused ? (
                    <><PlayCircle className="h-4 w-4 text-green-600 dark:text-green-500" /> Resume</>
                  ) : (
                    <><PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" /> Pause</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-36 gap-2 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600" 
                  onClick={handleCancel}
                >
                  <StopCircle className="h-4 w-4 text-red-600 dark:text-red-500" /> Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {globalIsLoading && <LoadingSpinner />}
      </div>
    </TooltipProvider>
  );
};

export default ChatlogEvaluationPage; 
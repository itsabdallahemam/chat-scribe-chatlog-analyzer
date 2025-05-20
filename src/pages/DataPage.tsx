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
  Bot, FileUp, Sparkles, Gauge, Wand2, User, Clock, HelpCircle, KeyRound, MessageSquare, Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import SyntheticDataTab from '@/components/SyntheticDataTab';
import ConversationsTab from '@/components/ConversationsTab';
import { AnalysisInsightsTab } from '@/components/AnalysisInsightsTab';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  id?: string;
}

// Add new type for tab options
type TabType = "evaluate" | "synthetic" | "conversations" | "analysis";

// Add types for conversation handling
interface ParsedMessage {
  timestamp: string;
  speaker: string;
  isAgent: boolean;
  content: string;
}

interface GeneratedChatlog {
  id: string;
  chatlog: string;
  scenario: string;
  shift: string;
  dateTime: string;
  customerName: string;
  coherence?: number;
  politeness?: number;
  relevance?: number;
  resolution?: number;
  escalated?: boolean;
  evaluated: boolean;
}

// Add interface for saved chatlog data
interface SavedChatlog {
  chatlog: string;
  scenario: string;
  shift?: string;
  dateTime?: string;
  customerName?: string;
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  timestamp: Date;
}

const DataPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
    evaluationResults,
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

  const [activeTab, setActiveTab] = useState<TabType>("conversations");

  // Add state for conversations
  const [generatedData, setGeneratedData] = useState<GeneratedChatlog[]>([]);
  const [currentChatlogIndex, setCurrentChatlogIndex] = useState<number>(0);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[]>([]);

  // Update generatedData when evaluationResults change
  useEffect(() => {
    if (evaluationResults.length > 0 && generatedData.length === 0) {
      const formattedChatlogs: GeneratedChatlog[] = evaluationResults.map(log => ({
        id: `${Date.now()}-${log.id || ''}`,
        chatlog: log.chatlog,
        scenario: log.scenario,
        shift: log.shift || 'day',
        dateTime: log.dateTime ? log.dateTime : '',
        customerName: 'Unknown Customer',
        coherence: log.coherence,
        politeness: log.politeness,
        relevance: log.relevance,
        resolution: log.resolution,
        escalated: log.resolution === 0,
        evaluated: true
      }));
      setGeneratedData(formattedChatlogs);
    }
  }, [evaluationResults, generatedData.length]);

  // Load saved chatlogs when component mounts
  useEffect(() => {
    loadSavedChatLogs();
  }, [loadSavedChatLogs]);

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
              id: currentInputItem.id,
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

  const handleSettingsClick = () => {
    navigate('/profile');
    // The settings tab will be shown by default for this use case
  };

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) {
        clearInterval(waitTimerRef.current);
      }
    };
  }, []);

  // Add functions for conversation handling
  const parseChatlog = (chatlogText: string): ParsedMessage[] => {
    if (!chatlogText) return [];
    
    const lines = chatlogText.split('\n').filter(line => line.trim() !== '');
    const messages: ParsedMessage[] = [];
    
    // Updated regex to handle timestamps and agent names
    // Matches: [timestamp] name: message or [timestamp] message
    const messageRegex = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:([^:]+):)?\s*(.*)$/;
    
    for (const line of lines) {
      const match = line.match(messageRegex);
      if (match) {
        const [_, timestamp, possibleName, content] = match;
        // Determine if it's an agent message by checking for "agent" in the name part
        const isAgent = possibleName?.toLowerCase().includes('agent') || line.toLowerCase().includes('agent');
        const speaker = isAgent ? user?.fullName || 'Support Agent' : 'Customer';
        
        messages.push({
          timestamp,
          speaker,
          isAgent,
          content: content.trim()
        });
      } else {
        // If line doesn't match the format, add it to the previous message's content
        if (messages.length > 0) {
          messages[messages.length - 1].content += '\n' + line;
        }
      }
    }
    
    return messages;
  };

  // Open chatlog viewer for selected chatlog
  const openChatlogViewer = (index: number) => {
    if (index >= 0 && index < generatedData.length) {
      setCurrentChatlogIndex(index);
      const messages = parseChatlog(generatedData[index].chatlog);
      setParsedMessages(messages);
      setViewerOpen(true);
    }
  };

  // Add sorting and filtering functions
  const sortChatlogs = (chatlogs: GeneratedChatlog[]) => {
    return [...chatlogs].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  };

  const filterChatlogs = (chatlogs: GeneratedChatlog[]) => {
    return chatlogs;
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <PageTitle 
          title="Data Management" 
          description="Upload, generate, and manage your chat data"
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="conversations" className="text-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              My Conversations
            </TabsTrigger>
            <TabsTrigger value="evaluate" className="text-sm">
              <FileUp className="h-4 w-4 mr-2" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="synthetic" className="text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Data
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-sm">
              <Gauge className="h-4 w-4 mr-2" />
              Analysis & Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            <ConversationsTab />
          </TabsContent>

          <TabsContent value="evaluate">
            <div className="max-w-7xl mx-auto px-8">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#4582ff] rounded-full text-white shadow-md">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">Evaluate Chatlogs</h1>
                      <p className="mt-1 text-[#667085] dark:text-gray-300">
                        Upload and analyze your chat conversations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#252A3A] dark:text-white">
                          {user?.fullName || 'Not signed in'}
                        </p>
                        <p className="text-xs text-[#667085] dark:text-gray-400">
                          {selectedModel ? selectedModel.split('/').pop() : 'No model selected'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid Layout */}
              <div className="grid grid-cols-12 gap-6">
                {/* Upload Card */}
                <Card className="col-span-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                        <FileUp className="h-4 w-4" />
                      </div>
                      <span>Upload CSV File</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      ref={dropAreaRef}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 transition-colors duration-200 cursor-pointer bg-card/50 flex flex-col items-center justify-center min-h-[250px]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {!file ? (
                        <>
                          <div className="mb-4 p-4 bg-[#4582ff]/10 rounded-full">
                            <UploadCloud className="h-8 w-8 text-[#4582ff]" />
                          </div>
                          <p className="text-lg font-medium mb-2 text-[#252A3A] dark:text-white">Upload CSV file</p>
                          <p className="text-sm text-[#667085] dark:text-gray-400 mb-5 text-center max-w-md">
                            Drag and drop your CSV file here or click to browse
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 bg-white/80 dark:bg-gray-900/60 border-[#4582ff]/20 dark:border-[#4582ff]/30"
                          >
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
                              <div className="p-2.5 bg-[#4582ff]/10 rounded-full mr-3">
                                <FileText className="h-5 w-5 text-[#4582ff]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#252A3A] dark:text-white">{file.name}</p>
                                <p className="text-xs text-[#667085] dark:text-gray-400">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                              }}
                              className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>

                          {previewLoading ? (
                            <div className="flex justify-center my-4">
                              <RefreshCw className="h-5 w-5 animate-spin text-[#4582ff]" />
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
                                <p className="font-medium text-sm text-[#252A3A] dark:text-white">Preview:</p>
                                <div className="flex items-center space-x-3">
                                  <Badge variant="secondary" className="font-normal h-6 bg-[#4582ff]/10 text-[#4582ff] dark:bg-[#4582ff]/20 border-transparent">
                                    <span className="font-semibold">{totalEntries}</span> total entries
                                  </Badge>
                                  <Badge variant="secondary" className="font-normal h-6 bg-[#4582ff]/10 text-[#4582ff] dark:bg-[#4582ff]/20">
                                    <span className="font-semibold">{uniqueScenarios}</span> scenarios
                                  </Badge>
                                </div>
                              </div>
                              <ScrollArea className="h-[200px] w-full rounded-md border border-gray-200 dark:border-gray-800">
                                <div className="p-4">
                                  {csvPreview.map((item, index) => (
                                    <div 
                                      key={index} 
                                      className="p-3.5 mb-2 last:mb-0 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50"
                                    >
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge className="bg-[#4582ff]/10 text-[#4582ff] dark:bg-[#4582ff]/20 border-transparent">
                                          {item.scenario || "Unnamed"}
                                        </Badge>
                                        
                                        {item.shift && (
                                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30">
                                            {item.shift}
                                          </Badge>
                                        )}
                                        
                                        {item.dateTime && (
                                          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-300 border-green-200/50 dark:border-green-800/30">
                                            {item.dateTime}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#667085] dark:text-gray-400 line-clamp-2">
                                        {item.chatlog.substring(0, 150)}...
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                              {totalEntries > 3 && (
                                <p className="text-xs text-[#667085] dark:text-gray-400 mt-2 italic">
                                  And {totalEntries - 3} more entries...
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* CSV Format Info */}
                    <div className="mt-6">
                      <Alert className="bg-[#4582ff]/5 border-[#4582ff]/10 dark:bg-[#4582ff]/10 dark:border-[#4582ff]/20">
                        <HelpCircle className="h-4 w-4 text-[#4582ff]" />
                        <AlertTitle className="text-[#252A3A] dark:text-white">CSV Format Requirements</AlertTitle>
                        <AlertDescription className="text-[#667085] dark:text-gray-400">
                          <p>Your CSV file should have the following columns:</p>
                          <ul className="list-disc list-inside mt-1 ml-1 text-sm">
                            <li><code className="px-1 py-0.5 bg-[#4582ff]/10 rounded text-[#4582ff]">chatlog</code> - The full conversation text</li>
                            <li><code className="px-1 py-0.5 bg-[#4582ff]/10 rounded text-[#4582ff]">scenario</code> (optional) - A label to identify the conversation</li>
                            <li><code className="px-1 py-0.5 bg-[#4582ff]/10 rounded text-[#4582ff]">shift</code> (optional) - Shift type (Night, Evening, or Morning)</li>
                            <li><code className="px-1 py-0.5 bg-[#4582ff]/10 rounded text-[#4582ff]">date and time</code> (optional) - Format: YYYY-MM-DD HH:MM</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center border-t border-gray-200 dark:border-gray-800 mt-6 pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/profile')}
                      className="gap-2 bg-white/80 dark:bg-gray-900/60 border-[#4582ff]/20 dark:border-[#4582ff]/30"
                    >
                      <Settings className="h-4 w-4" />
                      Evaluation Settings
                    </Button>
                    
                    <Button 
                      variant="default" 
                      onClick={handleEvaluate}
                      disabled={!file || previewLoading || !!csvErrorMessage || !selectedModel || !apiKey}
                      className="gap-2 bg-gradient-to-r from-[#4582ff] to-purple-500 hover:from-[#3a6ed6] hover:to-purple-600"
                    >
                      <Sparkles className="h-4 w-4" />
                      Evaluate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Progress Card - Only show when processing */}
                {isProcessing && (
                  <Card className="col-span-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                        <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span>Evaluation Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#252A3A] dark:text-white">{currentStatus}</span>
                            <span className="text-[#667085] dark:text-gray-400">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-[#4582ff]/5 dark:bg-[#4582ff]/10 rounded-lg p-4">
                            <div className="text-[#4582ff] font-semibold text-2xl mb-1">
                              {successfulEvals}
                            </div>
                            <div className="text-sm text-[#667085] dark:text-gray-400">
                              Successfully Evaluated
                            </div>
                          </div>

                          <div className="bg-red-500/5 dark:bg-red-500/10 rounded-lg p-4">
                            <div className="text-red-500 font-semibold text-2xl mb-1">
                              {failedEvals}
                            </div>
                            <div className="text-sm text-[#667085] dark:text-gray-400">
                              Failed Evaluations
                            </div>
                          </div>

                          <div className="bg-purple-500/5 dark:bg-purple-500/10 rounded-lg p-4">
                            <div className="text-purple-500 font-semibold text-2xl mb-1">
                              {estimatedTime}
                            </div>
                            <div className="text-sm text-[#667085] dark:text-gray-400">
                              Estimated Time Remaining
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePauseResume}
                            className="gap-2 bg-white/80 dark:bg-gray-900/60 border-[#4582ff]/20 dark:border-[#4582ff]/30"
                          >
                            {isPaused ? (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                Resume
                              </>
                            ) : (
                              <>
                                <PauseCircle className="h-4 w-4" />
                                Pause
                              </>
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleCancel}
                            className="gap-2"
                          >
                            <StopCircle className="h-4 w-4" />
                            Stop
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="synthetic">
            <SyntheticDataTab />
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisInsightsTab generatedData={generatedData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chatlog Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-[#4582ff] dark:text-[#4582ff]">
                <Bot className="h-5 w-5" />
              </span>
              {generatedData[currentChatlogIndex]?.scenario}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {/* Customer Name Badge */}
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <User className="h-3 w-3" />
                {generatedData[currentChatlogIndex]?.customerName}
              </Badge>
              
              {/* Time Badge */}
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Clock className="h-3 w-3" />
                {generatedData[currentChatlogIndex]?.dateTime && 
                  format(parseISO(generatedData[currentChatlogIndex].dateTime), 'MMM d, yyyy h:mm a')
                }
              </Badge>

              {/* Resolution Status */}
              {generatedData[currentChatlogIndex]?.evaluated && (
                <Badge 
                  className={cn(
                    generatedData[currentChatlogIndex].resolution === 1 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  )}
                >
                  {generatedData[currentChatlogIndex].resolution === 1 ? "Resolved" : "Unresolved"}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow px-4">
            <div className="space-y-4 py-4">
              {parsedMessages.map((message, index) => (
                <div key={index} className="space-y-1">
                  {/* Speaker Label */}
                  <div className={`flex items-center gap-2 ${message.isAgent ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-[#667085] dark:text-gray-400">
                      {message.isAgent ? user?.fullName || 'Support Agent' : generatedData[currentChatlogIndex]?.customerName}
                    </span>
                  </div>
                  {/* Message Bubble */}
                  <div className={`flex ${message.isAgent ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!message.isAgent && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 relative group",
                      message.isAgent 
                        ? "bg-gradient-to-br from-[#4582ff]/5 via-[#4582ff]/10 to-[#4582ff]/5 text-[#252A3A] dark:text-gray-200 rounded-tr-none"
                        : "bg-gradient-to-br from-gray-50 via-gray-100/50 to-gray-50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 text-gray-900 dark:text-gray-200 rounded-tl-none"
                    )}>
                      <div className="text-sm">{message.content}</div>
                      <div className="absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#667085] dark:text-gray-400">
                        {message.timestamp}
                      </div>
                    </div>
                    {message.isAgent && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4582ff]/10 to-[#4582ff]/20 dark:from-[#4582ff]/20 dark:to-[#4582ff]/30 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#4582ff]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#667085] dark:text-gray-400">
                {currentChatlogIndex + 1} of {generatedData.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setViewerOpen(false)} className="bg-white/80 dark:bg-gray-900/60">
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataPage;
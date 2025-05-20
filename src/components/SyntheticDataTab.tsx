import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, User, Calendar as CalendarIcon, Download, BarChart, AlertCircle, CheckCircle, Wand2, LineChart, ChevronDown, Loader2, PlayCircle, PauseCircle, StopCircle, ChevronLeft, ChevronRight, X, Eye, Clock, MessageSquare, Sun, Sunset, Moon, Sparkles, Search, Filter, Copy, Trash2, HelpCircle, KeyRound, ArrowUpDown, Settings, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatlog } from '@/contexts/ChatlogContext';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, isWeekend, parseISO, addMinutes, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateSyntheticChatlog, evaluateSingleChatlog } from '@/services/googleAI';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { calculateBLEUScore } from '@/utils/textAnalysisUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '../utils/dateUtils';
import { saveSyntheticChatLogs, getUserSyntheticChatLogs, SyntheticChatLog } from '@/services/syntheticChatLogService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenerationSettings } from '@/components/synthetic/GenerationSettings';
import { GenerationProgress } from '@/components/synthetic/GenerationProgress';
import { PerformanceTimeline } from '@/components/synthetic/PerformanceTimeline';
import { GeneratedConversations } from '@/components/synthetic/GeneratedConversations';
import { DateRange } from 'react-day-picker';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend
);

// List of potential scenarios
const SCENARIOS = [
  "Service complaint - delivery delay",
  "Service complaint - staff behavior",
  "Billing issue - unexpected charge",
  "Billing issue - refund request",
  "Technical support - website error",
  "Technical support - account access",
  "Escalation request - previous unresolved issue",
  "Positive feedback - customer satisfaction",
  "Miscommunication - order details",
  "Miscommunication - policy understanding"
];

// Interface for generated chatlog data
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

// Interface for synthetic chatlog result
interface SyntheticChatlogResult {
  chatlog: string;
  customerName: string;
}

// Interface for parsed message
interface ParsedMessage {
  timestamp: string;
  speaker: string;
  isAgent: boolean;
  content: string;
}

// Add new interface for timeline data
interface TimelineData {
  labels: string[];
  coherence: number[];
  politeness: number[];
  relevance: number[];
  resolution: number[];
}

const SyntheticDataTab: React.FC = () => {
  const { selectedModel, apiKey, promptTemplate, rubricText, setEvaluationResults, setGeneratedData, evaluationResults, deleteChatLogById } = useChatlog();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for date selection
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 14),
  });
  
  // Add advanced settings state
  const [minTurns, setMinTurns] = useState<number>(10);
  const [maxTurns, setMaxTurns] = useState<number>(25);
  const [minLogsPerDay, setMinLogsPerDay] = useState<number>(18);
  const [maxLogsPerDay, setMaxLogsPerDay] = useState<number>(32);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.8);
  
  // State for generated data and progress
  const [behaviorPattern, setBehaviorPattern] = useState<string>("consistently-strong");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [shouldStop, setShouldStop] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatedData, setGeneratedDataState] = useState<GeneratedChatlog[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  
  // Chart data state
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Coherence',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Politeness',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Relevance',
        data: [],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
      {
        label: 'Resolution',
        data: [],
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)', 
        borderWidth: 1,
      },
    ],
  });
  
  // Chatlog viewer state
  const [selectedConversation, setSelectedConversation] = useState<GeneratedChatlog | null>(null);
  
  // Add timeline state
  const [timelineData, setTimelineData] = useState<TimelineData>({
    labels: [],
    coherence: [],
    politeness: [],
    relevance: [],
    resolution: []
  });

  // Add new state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatlogs, setSelectedChatlogs] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'dateTime' | 'coherence' | 'politeness' | 'relevance' | 'resolution'>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Add progress tracking state
  const [lastProgressUpdate, setLastProgressUpdate] = useState<{ time: number; value: number } | null>(null);
  const [progressRate, setProgressRate] = useState<number>(0);

  // Load saved synthetic chat logs on mount
  useEffect(() => {
    if (isInitialLoad) {
      loadSavedSyntheticChatLogs();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Update generated data when evaluation results change
  useEffect(() => {
    if (evaluationResults.length > 0 && generatedData.length === 0) {
      const formattedChatlogs: GeneratedChatlog[] = evaluationResults.map(log => ({
        id: `${Date.now()}-${log.id || ''}`,
        chatlog: log.chatlog,
        scenario: log.scenario,
        shift: 'day', // Default to 'day' shift since it's not in EvaluationResult
        dateTime: format(new Date(), 'yyyy-MM-dd HH:mm'), // Use current date/time since it's not in EvaluationResult
        customerName: 'Unknown Customer',
        coherence: log.coherence,
        politeness: log.politeness,
        relevance: log.relevance,
        resolution: log.resolution,
        escalated: log.resolution === 0,
        evaluated: true
      }));
      setGeneratedDataState(formattedChatlogs);
    }
  }, [evaluationResults, generatedData.length]);

  const loadSavedSyntheticChatLogs = async () => {
    try {
      const savedLogs = await getUserSyntheticChatLogs();
      if (savedLogs.length > 0) {
        // Convert SyntheticChatLog to GeneratedChatlog format
        const formattedLogs: GeneratedChatlog[] = savedLogs.map(log => {
          // Parse metadata to get individual scores
          let coherence = 0, politeness = 0, relevance = 0, resolution = 0;
          try {
            if (log.metadata) {
              const metadata = JSON.parse(log.metadata);
              coherence = metadata.coherence || 0;
              politeness = metadata.politeness || 0;
              relevance = metadata.relevance || 0;
              resolution = metadata.resolution || 0;
            }
          } catch (error) {
            console.error('Error parsing metadata:', error);
          }

          // Handle the date conversion properly
          let dateTimeStr: string;
          try {
            // Convert the startTime to a Date object if it's not already one
            const startTime = typeof log.startTime === 'string' 
              ? new Date(log.startTime)
              : log.startTime;
            
            // Format the date to match the format used in new chatlogs
            dateTimeStr = startTime instanceof Date 
              ? format(startTime, 'yyyy-MM-dd HH:mm')
              : format(new Date(), 'yyyy-MM-dd HH:mm'); // Fallback to current date if invalid
          } catch (error) {
            console.error('Error parsing date:', error);
            dateTimeStr = format(new Date(), 'yyyy-MM-dd HH:mm'); // Fallback to current date
          }

          return {
            id: log.id || `${Date.now()}`,
            chatlog: log.chatlog,
            scenario: log.scenario,
            shift: log.shift,
            dateTime: dateTimeStr,
            customerName: extractCustomerName(log.chatlog) || 'Customer',
            coherence,
            politeness,
            relevance,
            resolution,
            escalated: log.escalated,
            evaluated: true
          };
        });
        setGeneratedDataState(formattedLogs);
        setGeneratedData(formattedLogs);
      }
    } catch (error) {
      console.error('Error loading saved synthetic chat logs:', error);
      setGenerationError('Failed to load saved chat logs. Please try refreshing the page.');
      toast({
        title: "Error Loading Chat Logs",
        description: "There was a problem loading your saved chat logs. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to extract customer name from chatlog
  const extractCustomerName = (chatlog: string): string | null => {
    const lines = chatlog.split('\n');
    const customerNameLine = lines.find(line => line.startsWith('CUSTOMER_NAME:'));
    if (customerNameLine) {
      return customerNameLine.replace('CUSTOMER_NAME:', '').trim();
    }
    return null;
  };

  // Update progress with rate tracking
  const updateProgress = (newProgress: number) => {
    const now = Date.now();
    if (lastProgressUpdate && now > lastProgressUpdate.time) {
      const timeDiff = now - lastProgressUpdate.time;
      const progressDiff = newProgress - lastProgressUpdate.value;
      const newRate = progressDiff / timeDiff;
      // Use exponential moving average to smooth out the rate
      setProgressRate(prev => prev * 0.7 + newRate * 0.3);
    }
    setLastProgressUpdate({ time: now, value: newProgress });
    setProgress(newProgress);
  };

  const generateDataset = async () => {
    if (!dateRange?.from || !dateRange?.to || !selectedModel || !apiKey || !user?.fullName) {
      setGenerationError("Please select dates, ensure model is selected, and you're signed in");
      return;
    }
    
    try {
      setIsGenerating(true);
      setIsPaused(false);
      setShouldStop(false);
      setProgress(0);
      setLastProgressUpdate(null);
      setProgressRate(0);
      setGenerationStep("Initializing dataset generation...");
      setGeneratedDataState([]);
      setGenerationError(null);
      setStartTime(Date.now());
      setPauseStartTime(null);
      setTotalPausedTime(0);
      setTimelineData({
        labels: [],
        coherence: [],
        politeness: [],
        relevance: [],
        resolution: []
      });
      
      // Generate workdays (5 consecutive days per week, skipping weekends)
      const workdays: Array<{ date: Date; shift: string }> = [];
      let currentDate = new Date(dateRange.from);
      
      // Assign shifts in a rotating pattern (morning -> evening -> night)
      const shifts = ['morning', 'evening', 'night'];
      let shiftIndex = 0;
      
      while (currentDate <= dateRange.to) {
        // Generate 5 consecutive workdays then skip to next week
        let daysInCurrentWeek = 0;
        
        while (daysInCurrentWeek < 5 && currentDate <= dateRange.to) {
          if (!isWeekend(currentDate)) {
            // Assign the next shift in rotation
            workdays.push({
              date: new Date(currentDate),
              shift: shifts[shiftIndex]
            });
            // Move to next shift for next day
            shiftIndex = (shiftIndex + 1) % shifts.length;
            daysInCurrentWeek++;
          }
          currentDate = addDays(currentDate, 1);
        }
        
        // Skip to Monday of next week
        while (isWeekend(currentDate) || daysInCurrentWeek >= 5) {
          currentDate = addDays(currentDate, 1);
          if (!isWeekend(currentDate)) daysInCurrentWeek = 0;
        }
      }
      
      if (workdays.length === 0) {
        setGenerationError("No valid workdays in selected date range");
        setIsGenerating(false);
        return;
      }
      
      const totalLogsToGenerate = workdays.length * 25; // Average of (18+32)/2 = 25 chatlogs per day
      setGenerationStep(`Planning to generate ${totalLogsToGenerate} conversations across ${workdays.length} workdays`);
      
      // Calculate total chatlogs to generate for progress tracking
      let generatedCount = 0;
      const allGeneratedLogs: GeneratedChatlog[] = [];
      
      for (const workday of workdays) {
        // Check if should stop
        if (shouldStop) {
          setGenerationStep("Generation stopped by user.");
          setIsGenerating(false);
          return;
        }

        const chatlogsForDay = Math.floor(Math.random() * (maxLogsPerDay - minLogsPerDay + 1)) + minLogsPerDay;
        
        setGenerationStep(`Processing ${chatlogsForDay} conversations for ${format(workday.date, 'MMMM d')} (${workday.shift} shift)`);
        
        // Set base time based on shift
        let baseTime: Date;
        switch (workday.shift) {
          case 'morning':
            baseTime = new Date(workday.date.setHours(8, 0, 0, 0));
            break;
          case 'evening':
            baseTime = new Date(workday.date.setHours(14, 0, 0, 0));
            break;
          case 'night':
            baseTime = new Date(workday.date.setHours(20, 0, 0, 0));
            break;
          default:
            baseTime = new Date(workday.date);
        }
        
        for (let j = 0; j < chatlogsForDay; j++) {
          // Check if should stop
          if (shouldStop) {
            setGenerationStep("Safely stopping generation...");
            setIsGenerating(false);
            return;
          }

          // Wait while paused
          while (isPaused && !shouldStop) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setGenerationStep("Generation paused - Click Resume to continue");
          }

          // Continue with generation if not stopped
          if (shouldStop) {
            setGenerationStep("Safely stopping generation...");
            setIsGenerating(false);
            return;
          }
          
          // Randomly space out conversations throughout the shift (6 hour shifts)
          const timeOffset = Math.floor(Math.random() * 360); // 0-360 minutes into shift
          const chatTime = addMinutes(baseTime, timeOffset);
          
          // Select a random scenario
          const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
          
          try {
            const progressDetails = `[${j+1}/${chatlogsForDay}] ${format(chatTime, 'HH:mm')} - ${scenario}`;
            setGenerationStep(`Generating conversation ${progressDetails}`);
            
            const chatlogResult: SyntheticChatlogResult = await generateSyntheticChatlog(
              apiKey,
              selectedModel,
              user.fullName,
              scenario,
              behaviorPattern,
              minTurns,
              maxTurns
            );

            // Check for duplicates using BLEU score
            let isDuplicate = false;

            for (const existingLog of allGeneratedLogs) {
              const bleuScore = calculateBLEUScore(chatlogResult.chatlog, existingLog.chatlog);
              if (bleuScore > similarityThreshold) {
                isDuplicate = true;
                console.log(`Duplicate chatlog detected with BLEU score: ${bleuScore}`);
                break;
              }
            }

            if (isDuplicate) {
              console.log('Skipping duplicate chatlog and generating a new one');
              j--;
              continue;
            }

            // Create chatlog object with timestamp
            const newChatlog: GeneratedChatlog = {
              id: `${Date.now()}-${workday.date.getTime()}-${j}`,
              chatlog: chatlogResult.chatlog,
              customerName: chatlogResult.customerName,
              scenario,
              shift: workday.shift,
              dateTime: format(chatTime, 'yyyy-MM-dd HH:mm'),
              evaluated: false
            };

            // Evaluate the chatlog immediately
            try {
              const result = await evaluateSingleChatlog(
                apiKey,
                selectedModel,
                promptTemplate,
                rubricText,
                chatlogResult.chatlog
              );

              if (result.scores && result.error === null) {
                newChatlog.coherence = result.scores.Coherence;
                newChatlog.politeness = result.scores.Politeness;
                newChatlog.relevance = result.scores.Relevance;
                newChatlog.resolution = result.scores.Resolution;
                newChatlog.escalated = result.scores.Resolution === 0;
                newChatlog.evaluated = true;

                // Save to both local state and backend
                allGeneratedLogs.push(newChatlog);
                setGeneratedDataState([...allGeneratedLogs]);
                setGeneratedData([...allGeneratedLogs]);

                // Save to backend if user is logged in
                if (user) {
                  try {
                    const syntheticLog: Omit<SyntheticChatLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
                      agentName: user.fullName,
                      shift: workday.shift,
                      scenario: scenario,
                      chatlog: chatlogResult.chatlog,
                      escalated: newChatlog.escalated || false,
                      customerSatisfaction: Math.round((
                        (result.scores.Coherence + 
                        result.scores.Politeness + 
                        result.scores.Relevance + 
                        result.scores.Resolution) / 4
                      ) * 100),
                      performanceTrajectory: behaviorPattern,
                      startTime: parseISO(newChatlog.dateTime),
                      endTime: addMinutes(parseISO(newChatlog.dateTime), 15),
                      metadata: JSON.stringify({
                        coherence: result.scores.Coherence,
                        politeness: result.scores.Politeness,
                        relevance: result.scores.Relevance,
                        resolution: result.scores.Resolution,
                        evaluationTimestamp: new Date().toISOString(),
                        modelId: selectedModel,
                        behaviorPattern: behaviorPattern
                      })
                    };
                    await saveSyntheticChatLogs([syntheticLog]);
                  } catch (saveError) {
                    console.error('Error saving synthetic chat log to backend:', saveError);
                    toast({
                      title: "Error Saving Chat Log",
                      description: "There was a problem saving the chat log. The data is still available locally.",
                      variant: "destructive"
                    });
                  }
                }

                // Update both chart data and timeline
                updateChartData(allGeneratedLogs);
                updateTimelineData(newChatlog);
              }
            } catch (evalError) {
              console.error("Error evaluating chatlog:", evalError);
              allGeneratedLogs.push(newChatlog);
              setGeneratedDataState([...allGeneratedLogs]);
            }
            
            // Update progress
            generatedCount++;
            updateProgress(Math.round((generatedCount / totalLogsToGenerate) * 100));
            
          } catch (error) {
            console.error(`Error generating chatlog: ${error}`);
          }
        }
      }
      
      setGenerationStep("Generation and evaluation complete!");
      setIsGenerating(false);
      setIsPaused(false);
      setShouldStop(false);
      
      // Save evaluation results to context
      const evaluationResults = allGeneratedLogs
        .filter(log => log.evaluated)
        .map(log => ({
          chatlog: log.chatlog,
          scenario: log.scenario,
          coherence: log.coherence || 0,
          politeness: log.politeness || 0,
          relevance: log.relevance || 0,
          resolution: log.resolution || 0,
          shift: log.shift,
          dateTime: log.dateTime,
          timestamp: new Date(),
        }));
      
      if (evaluationResults.length > 0) {
        setEvaluationResults(evaluationResults);
        setGeneratedData(allGeneratedLogs);
      }
      
    } catch (error) {
      console.error("Error in data generation:", error);
      setGenerationError(`Error generating data: ${error instanceof Error ? error.message : String(error)}`);
      setIsGenerating(false);
      setIsPaused(false);
    }
  };
  
  // Helper function to update chart data
  const updateChartData = (logs: GeneratedChatlog[]) => {
    const dateLabels: string[] = [];
    const ratingsForChart: Record<string, number[]> = {
      coherence: [],
      politeness: [],
      relevance: [],
      resolution: []
    };

    logs.forEach(log => {
      const dateLabel = format(parseISO(log.dateTime), 'MM/dd');
      if (!dateLabels.includes(dateLabel)) {
        dateLabels.push(dateLabel);
        ratingsForChart.coherence.push(0);
        ratingsForChart.politeness.push(0);
        ratingsForChart.relevance.push(0);
        ratingsForChart.resolution.push(0);
      }

      const dateIndex = dateLabels.indexOf(dateLabel);
      if (log.coherence) ratingsForChart.coherence[dateIndex] += log.coherence;
      if (log.politeness) ratingsForChart.politeness[dateIndex] += log.politeness;
      if (log.relevance) ratingsForChart.relevance[dateIndex] += log.relevance;
      if (log.resolution) ratingsForChart.resolution[dateIndex] += log.resolution;
    });

    setChartData({
      labels: dateLabels,
      datasets: [
        {
          label: 'Coherence',
          data: ratingsForChart.coherence.map(val => val),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Politeness',
          data: ratingsForChart.politeness.map(val => val),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Relevance',
          data: ratingsForChart.relevance.map(val => val),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
        {
          label: 'Resolution',
          data: ratingsForChart.resolution.map(val => val),
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        },
      ],
    });

    // Update timeline for the most recent chatlog
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      updateTimelineData(latestLog);
    }
  };
  
  // Helper function to update timeline data
  const updateTimelineData = (newChatlog: GeneratedChatlog) => {
    if (!newChatlog.evaluated) return;

    setTimelineData(prev => {
      const timestamp = format(parseISO(newChatlog.dateTime), 'HH:mm');
      
      // Add new data point
      return {
        labels: [...prev.labels, timestamp],
        coherence: [...prev.coherence, newChatlog.coherence || 0],
        politeness: [...prev.politeness, newChatlog.politeness || 0],
        relevance: [...prev.relevance, newChatlog.relevance || 0],
        resolution: [...prev.resolution, newChatlog.resolution || 0]
      };
    });
  };
  
  const downloadCsv = () => {
    if (generatedData.length === 0) return;
    
    // Create CSV header
    const csvHeader = 'chatlog,scenario,shift,dateTime,customerName,coherence,politeness,relevance,resolution,escalated\n';
    
    // Create CSV rows
    const csvRows = generatedData.map(item => {
      // Escape any commas in the chatlog
      const escapedChatlog = `"${item.chatlog.replace(/"/g, '""')}"`;
      
      return [
        escapedChatlog,
        item.scenario,
        item.shift,
        item.dateTime,
        item.customerName,
        item.coherence || '',
        item.politeness || '',
        item.relevance || '',
        item.resolution || '',
        item.escalated !== undefined ? item.escalated : ''
      ].join(',');
    }).join('\n');
    
    // Combine and create download link
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `synthetic_data_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };
  
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      // Starting a pause
      setPauseStartTime(Date.now());
    } else {
      // Ending a pause
      if (pauseStartTime) {
        setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
      }
      setPauseStartTime(null);
    }
    setGenerationStep(isPaused ? "Resuming generation..." : "Generation paused. Click Resume to continue.");
  };
  
  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!startTime || progress === 0) return null;
    
    const currentTime = Date.now();
    const effectiveElapsedTime = currentTime - startTime - totalPausedTime - (pauseStartTime ? (currentTime - pauseStartTime) : 0);
    
    // Only use the last 5% of progress for rate calculation to get a more accurate recent rate
    const recentProgressThreshold = Math.max(0, progress - 5);
    const recentTimeThreshold = effectiveElapsedTime * (recentProgressThreshold / progress);
    const recentProgressRate = 5 / (effectiveElapsedTime - recentTimeThreshold);
    
    // Calculate remaining time based on recent progress rate
    const remainingProgress = 100 - progress;
    const estimatedRemainingTime = remainingProgress / recentProgressRate;
    
    // Add some buffer time for API calls and processing
    const bufferedTime = estimatedRemainingTime * 1.1;
    
    // If the time is unreasonably high (over 2 hours) or low (under 1 second), use the overall average
    if (bufferedTime > 7200000 || bufferedTime < 1000) {
      const overallProgressRate = progress / effectiveElapsedTime;
      const estimatedByAverage = remainingProgress / overallProgressRate;
      
      // Convert to minutes and seconds
      const minutes = Math.floor(estimatedByAverage / 60000);
      const seconds = Math.floor((estimatedByAverage % 60000) / 1000);
      
      return minutes > 0 ? `~${minutes}m ${seconds}s remaining` : `~${seconds}s remaining`;
    }
    
    // Convert to minutes and seconds
    const minutes = Math.floor(bufferedTime / 60000);
    const seconds = Math.floor((bufferedTime % 60000) / 1000);
    
    return minutes > 0 ? `~${minutes}m ${seconds}s remaining` : `~${seconds}s remaining`;
  };
  
  const handleStop = () => {
    setShouldStop(true);
    setGenerationStep("Stopping generation...");
  };
  
  // Parse chatlog text into message bubbles
  const parseChatlog = (chatlogText: string | { chatlog: string; customerName: string }): ParsedMessage[] => {
    if (!chatlogText) return [];
    
    const text = typeof chatlogText === 'string' ? chatlogText : chatlogText.chatlog;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const messages: ParsedMessage[] = [];
    
    // First try to extract customer name if present
    let customerName = typeof chatlogText === 'string' ? '' : chatlogText.customerName;
    if (!customerName && lines[0]?.startsWith('CUSTOMER_NAME:')) {
      customerName = lines[0].replace('CUSTOMER_NAME:', '').trim();
      lines.shift(); // Remove the customer name line
    }
    
    // Updated regex to better handle timestamps and agent names
    const messageRegex = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:Agent\s+([^:]+)|Customer):\s*(.*)$/;
    let agentName = '';
    
    lines.forEach(line => {
      const match = line.match(messageRegex);
      if (match) {
        const [_, timestamp, possibleAgentName, content] = match;
        const isAgent = line.toLowerCase().includes('agent');
        
        // Update agent name if this is an agent message
        if (isAgent && possibleAgentName) {
          agentName = possibleAgentName.trim();
        }
        
        messages.push({
          timestamp,
          speaker: isAgent ? (agentName || 'Support Agent') : customerName || 'Customer',
          isAgent,
          content: content.trim()
        });
      }
    });
    
    return messages;
  };
  
  // Open chatlog viewer for selected chatlog
  const openChatlogViewer = (index: number) => {
    if (index >= 0 && index < generatedData.length) {
      setSelectedConversation(generatedData[index]);
    }
  };
  
  // Add keyboard shortcuts
  useHotkeys('ctrl+g', () => {
    if (!isGenerating && dateRange?.from && dateRange?.to && selectedModel && apiKey) {
      generateDataset();
    }
  }, [isGenerating, dateRange, selectedModel, apiKey]);

  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    document.getElementById('chatlog-search')?.focus();
  });

  useHotkeys('esc', () => {
    setSelectedChatlogs([]);
  });

  // Add sorting function
  const sortChatlogs = (chatlogs: GeneratedChatlog[]) => {
    return [...chatlogs].sort((a, b) => {
      if (sortField === 'dateTime') {
        return sortDirection === 'asc' 
          ? new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
          : new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
      }
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Add filter function
  const filterChatlogs = (chatlogs: GeneratedChatlog[]) => {
    return chatlogs.filter(chatlog => 
      chatlog.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chatlog.chatlog.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chatlog.shift.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Add batch actions
  const handleBatchDelete = async () => {
    try {
      // Delete each selected chatlog from the database
      for (const id of selectedChatlogs) {
        await deleteChatLogById(id);
      }
      
      // Update local state
      setGeneratedDataState(prev => prev.filter(chatlog => !selectedChatlogs.includes(chatlog.id)));
      setSelectedChatlogs([]);
      
      toast({
        title: "Chatlogs Deleted",
        description: `${selectedChatlogs.length} chatlog(s) have been deleted.`
      });
    } catch (error) {
      console.error('Error deleting chatlogs:', error);
      toast({
        title: "Error",
        description: "Failed to delete some chatlogs. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBatchCopy = async () => {
    const selectedLogs = generatedData.filter(chatlog => selectedChatlogs.includes(chatlog.id));
    const textToCopy = selectedLogs.map(log => `${log.scenario}\n${log.chatlog}`).join('\n\n');
    await navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: `${selectedLogs.length} chatlog(s) have been copied to clipboard.`
    });
  };

  // Add selection toggle
  const toggleChatlogSelection = (id: string) => {
    setSelectedChatlogs(prev => 
      prev.includes(id) ? prev.filter(logId => logId !== id) : [...prev, id]
    );
  };

  // Chart data and options
  const getChartData = () => ({
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Coherence',
        data: timelineData.coherence,
        borderColor: '#FF80B5',
        backgroundColor: 'rgba(255, 128, 181, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Politeness',
        data: timelineData.politeness,
        borderColor: '#4582ff',
        backgroundColor: 'rgba(69, 130, 255, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Relevance',
        data: timelineData.relevance,
        borderColor: '#FFD166',
        backgroundColor: 'rgba(255, 209, 102, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Resolution',
        data: timelineData.resolution,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#252A3A',
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#252A3A',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#252A3A',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  // Add new function to process time distribution data
  const getTimeDistributionData = (logs: GeneratedChatlog[]) => {
    const timeSlots = {
      'Morning (6AM-12PM)': 0,
      'Afternoon (12PM-6PM)': 0,
      'Evening (6PM-12AM)': 0,
      'Night (12AM-6AM)': 0
    };

    logs.forEach(log => {
      try {
        const date = parseISO(log.dateTime);
        const hour = date.getHours();
        
        if (hour >= 6 && hour < 12) {
          timeSlots['Morning (6AM-12PM)']++;
        } else if (hour >= 12 && hour < 18) {
          timeSlots['Afternoon (12PM-6PM)']++;
        } else if (hour >= 18 && hour < 24) {
          timeSlots['Evening (6PM-12AM)']++;
        } else {
          timeSlots['Night (12AM-6AM)']++;
        }
      } catch (error) {
        console.error('Error processing date:', error);
      }
    });

    return {
      labels: Object.keys(timeSlots),
      datasets: [{
        label: 'Number of Conversations',
        data: Object.values(timeSlots),
        backgroundColor: [
          'rgba(255, 159, 64, 0.2)',  // Morning
          'rgba(75, 192, 192, 0.2)',  // Afternoon
          'rgba(54, 162, 235, 0.2)',  // Evening
          'rgba(153, 102, 255, 0.2)'  // Night
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Add time distribution chart options
  const timeDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#252A3A',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Conversation Distribution by Time of Day',
        color: '#252A3A',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#252A3A',
          precision: 0
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#252A3A'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Configuration */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {/* User Info Card */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#252A3A] dark:text-white truncate">
                      {user?.fullName || 'Not signed in'}
                    </p>
                    <p className="text-xs text-[#667085] dark:text-gray-400 truncate">
                      {selectedModel ? selectedModel.split('/').pop() : 'No model selected'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCsv}
                    disabled={generatedData.length === 0 || isGenerating}
                    className="shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                  <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span>Generation Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-[#252A3A] dark:text-white">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/80 dark:bg-gray-900/60 border-purple-200/50 dark:border-purple-800/30",
                            !dateRange?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? format(dateRange.from, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange?.from}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="mb-2 block text-[#252A3A] dark:text-white">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/80 dark:bg-gray-900/60 border-purple-200/50 dark:border-purple-800/30",
                            !dateRange?.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.to ? format(dateRange.to, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange?.to}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                          initialFocus
                          disabled={(date) => date < (dateRange?.from || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Behavior Pattern */}
                <div>
                  <Label className="mb-2 block text-[#252A3A] dark:text-white">Behavior Pattern</Label>
                  <Select value={behaviorPattern} onValueChange={setBehaviorPattern}>
                    <SelectTrigger className="w-full bg-white/80 dark:bg-gray-900/60 border-purple-200/50 dark:border-purple-800/30">
                      <SelectValue placeholder="Select behavior pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consistently-strong">Consistently strong</SelectItem>
                      <SelectItem value="consistently-poor">Consistently poor</SelectItem>
                      <SelectItem value="starts-strong-then-declines">Starts strong then declines</SelectItem>
                      <SelectItem value="starts-weak-then-improves">Starts weak then improves</SelectItem>
                      <SelectItem value="fluctuating-performance">Fluctuating performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Settings Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 bg-white/80 dark:bg-gray-900/60 border-purple-200/50 dark:border-purple-800/30"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Advanced Settings
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Advanced Settings</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs mb-1.5 block">
                            Message Turns Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min={5}
                              max={20}
                              value={minTurns}
                              onChange={(e) => setMinTurns(Math.min(Math.max(parseInt(e.target.value) || 5, 5), 20))}
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">to</span>
                            <Input 
                              type="number"
                              min={10}
                              max={40}
                              value={maxTurns}
                              onChange={(e) => setMaxTurns(Math.min(Math.max(parseInt(e.target.value) || 10, minTurns), 40))}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">
                            Chatlogs Per Day
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min={5}
                              max={30}
                              value={minLogsPerDay}
                              onChange={(e) => setMinLogsPerDay(Math.min(Math.max(parseInt(e.target.value) || 5, 5), maxLogsPerDay))}
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">to</span>
                            <Input 
                              type="number"
                              min={10}
                              max={50}
                              value={maxLogsPerDay}
                              onChange={(e) => setMaxLogsPerDay(Math.min(Math.max(parseInt(e.target.value) || 10, minLogsPerDay), 50))}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">
                            Similarity Threshold
                          </Label>
                          <Input 
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            value={similarityThreshold}
                            onChange={(e) => setSimilarityThreshold(Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 1))}
                            className="h-8 text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            BLEU score threshold for detecting duplicate conversations (0-1)
                          </p>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Generation Button */}
                <Button
                  variant="default"
                  onClick={generateDataset}
                  disabled={isGenerating || !dateRange || !selectedModel || !apiKey}
                  className="w-full gap-2 bg-gradient-to-r from-[#4582ff] to-purple-500 hover:from-[#3a6ed6] hover:to-purple-600"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate Data"}
                </Button>

                {/* Error Message */}
                {generationError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{generationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress and Results */}
          <div className="col-span-12 md:col-span-8 space-y-4">
            {/* Generation Progress Card */}
            {isGenerating && (
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                    <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                      <LineChart className="h-4 w-4" />
                    </div>
                    <span>Generation Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm text-[#252A3A] dark:text-white">
                      <span className="flex items-center gap-2">
                        {isPaused ? (
                          <PauseCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-[#4582ff]" />
                        )}
                        {generationStep}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{progress}%</span>
                        {!isPaused && progress > 0 && (
                          <span className="text-xs text-[#667085] dark:text-gray-400">
                            {getEstimatedTimeRemaining()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant={isPaused ? "default" : "outline"}
                      size="sm"
                      onClick={handlePauseResume}
                      className={cn(
                        "gap-2 min-w-[100px]",
                        isPaused 
                          ? "bg-gradient-to-r from-[#4582ff] to-purple-500 hover:from-[#3a6ed6] hover:to-purple-600" 
                          : "bg-white/80 dark:bg-gray-900/60 border-purple-200/50 dark:border-purple-800/30"
                      )}
                      disabled={shouldStop}
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
                      onClick={handleStop}
                      className="gap-2 min-w-[100px]"
                      disabled={shouldStop}
                    >
                      <StopCircle className="h-4 w-4" />
                      {shouldStop ? 'Stopping...' : 'Stop'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {generatedData.length > 0 && (
              <>
                {/* Time Distribution Chart */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span>Time Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <Bar data={getTimeDistributionData(generatedData)} options={timeDistributionOptions} />
                  </CardContent>
                </Card>

                {/* Performance Timeline */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                        <LineChart className="h-4 w-4" />
                      </div>
                      <span>Performance Timeline</span>
                      {isGenerating && (
                        <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Updating live
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <Line data={getChartData()} options={chartOptions} />
                  </CardContent>
                </Card>

                {/* Generated Conversations */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <CardTitle className="flex items-center text-base text-[#252A3A] dark:text-white">
                        <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-2">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <span>Generated Conversations</span>
                        <Badge className="ml-2 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {filterChatlogs(generatedData).length} of {generatedData.length}
                        </Badge>
                      </CardTitle>

                      <div className="flex-1 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="chatlog-search"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              <Filter className="h-4 w-4" />
                              Sort by
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSortField('dateTime');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}>
                              Date {sortField === 'dateTime' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSortField('coherence');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}>
                              Coherence {sortField === 'coherence' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSortField('politeness');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}>
                              Politeness {sortField === 'politeness' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSortField('relevance');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}>
                              Relevance {sortField === 'relevance' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSortField('resolution');
                              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            }}>
                              Resolution {sortField === 'resolution' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {selectedChatlogs.length > 0 && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleBatchCopy}
                              className="bg-white/80 dark:bg-gray-900/60"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleBatchDelete}
                              className="bg-white/80 dark:bg-gray-900/60 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {sortChatlogs(filterChatlogs(generatedData)).map((item, index) => (
                          <div
                            key={item.id}
                            className={cn(
                              "bg-white/80 dark:bg-gray-900/60 rounded-lg p-4 border transition-all",
                              selectedChatlogs.includes(item.id)
                                ? "border-[#4582ff] dark:border-[#4582ff] shadow-[0_0_0_1px_rgba(69,130,255,0.3)]"
                                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                            )}
                            onClick={() => toggleChatlogSelection(item.id)}
                          >
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {/* Customer Name Badge */}
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                <User className="h-3 w-3 mr-1" />
                                {item.customerName}
                              </Badge>
                              
                              {/* Existing badges */}
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {(() => {
                                  try {
                                    return format(parseISO(item.dateTime), 'MMM d, h:mm a');
                                  } catch (error) {
                                    console.error('Error formatting date:', error);
                                    return 'Invalid date';
                                  }
                                })()}
                              </Badge>
                              {item.evaluated && (
                                <>
                                  <Badge variant="outline" className="bg-[#8884d8]/10 text-[#8884d8] dark:bg-[#8884d8]/20 dark:text-[#8884d8]">
                                    C: {item.coherence?.toFixed(1)}
                                  </Badge>
                                  <Badge variant="outline" className="bg-[#247BA0]/10 text-[#247BA0] dark:bg-[#247BA0]/20 dark:text-[#247BA0]">
                                    P: {item.politeness?.toFixed(1)}
                                  </Badge>
                                  <Badge variant="outline" className="bg-[#22c55e]/10 text-[#22c55e] dark:bg-[#22c55e]/20 dark:text-[#22c55e]">
                                    R: {item.relevance?.toFixed(1)}
                                  </Badge>
                                </>
                              )}
                            </div>

                            {/* Message Preview Section */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {parseChatlog({ chatlog: item.chatlog, customerName: item.customerName }).slice(0, 3).map((message, msgIndex) => (
                                <div key={msgIndex} className="space-y-1">
                                  {/* Speaker Label */}
                                  <div className={`flex items-center gap-2 ${message.isAgent ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-xs font-medium text-[#252A3A] dark:text-white">
                                      {message.speaker}
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

                            <div className="mt-3 flex justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openChatlogViewer(index)}
                                className="text-[#4582ff] hover:text-[#3a6ed6] hover:bg-[#4582ff]/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Chatlog
                              </Button>
                            </div>
                          </div>
                        ))}

                        {filterChatlogs(generatedData).length === 0 && (
                          <div className="text-center py-8 text-[#667085] dark:text-gray-400">
                            No conversations match your search criteria
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chatlog Viewer Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            {selectedConversation && parseChatlog({ chatlog: selectedConversation.chatlog, customerName: selectedConversation.customerName }).map((message, msgIndex) => (
              <div key={msgIndex} className="space-y-1">
                {/* Speaker Label */}
                <div className={`flex items-center gap-2 ${message.isAgent ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs font-medium text-[#252A3A] dark:text-white">
                    {message.speaker}
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
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/80 dark:bg-gray-900/80 shadow-lg"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Keyboard Shortcuts</h4>
                <div className="text-sm space-y-1">
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + G</kbd> Generate Dataset</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + F</kbd> Search Chatlogs</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> Clear Selection</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SyntheticDataTab; 
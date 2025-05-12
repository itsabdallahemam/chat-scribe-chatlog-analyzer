import React, { useRef, useMemo, useState } from 'react';
import { useChatlog } from '@/contexts/ChatlogContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  BarChart, 
  PieChart, 
  LineChart, 
  MessageSquare, 
  AlertCircle, 
  Gauge, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import html2pdf from 'html2pdf.js';

// Utility function for score background colors
const getScoreColor = (score: number, type: 'bg' | 'text' | 'border') => {
  if (score <= 2) {
    return type === 'bg' ? 'bg-red-50 dark:bg-red-950' : 
           type === 'text' ? 'text-red-700 dark:text-red-300' : 
           'border-red-200 dark:border-red-800';
  } else if (score === 3) {
    return type === 'bg' ? 'bg-yellow-50 dark:bg-yellow-950' : 
           type === 'text' ? 'text-yellow-700 dark:text-yellow-300' : 
           'border-yellow-200 dark:border-yellow-800';
  } else {
    return type === 'bg' ? 'bg-green-50 dark:bg-green-950' : 
           type === 'text' ? 'text-green-700 dark:text-green-300' : 
           'border-green-200 dark:border-green-800';
  }
};

// Truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (!text) return 'No text available';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const ReportPage: React.FC = () => {
  const { evaluationResults, selectedModel, promptTemplate, rubricText } = useChatlog();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [expandedScenarios, setExpandedScenarios] = useState<string[]>([]);
  const [expandedChatlogs, setExpandedChatlogs] = useState<(number | string)[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Calculate averages
  const calculateAverage = (scores: number[]) => {
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00';
  };

  const averageCoherence = calculateAverage(evaluationResults.map(r => r.coherence));
  const averagePoliteness = calculateAverage(evaluationResults.map(r => r.politeness));
  const averageRelevance = calculateAverage(evaluationResults.map(r => r.relevance));
  
  // Calculate resolution stats
  const resolvedCount = evaluationResults.filter(r => r.resolution === 1).length;
  const resolutionRate = evaluationResults.length ? 
    ((resolvedCount / evaluationResults.length) * 100).toFixed(1) : '0.0';

  // Calculate score distributions
  const calculateDistribution = (scores: number[]) => {
    const low = scores.filter(s => s <= 2).length;
    const medium = scores.filter(s => s === 3).length;
    const high = scores.filter(s => s >= 4).length;
    return { low, medium, high };
  };

  const coherenceDist = calculateDistribution(evaluationResults.map(r => r.coherence));
  const politenessDist = calculateDistribution(evaluationResults.map(r => r.politeness));
  const relevanceDist = calculateDistribution(evaluationResults.map(r => r.relevance));

  // Calculate overall CPR score (average of coherence, politeness, and relevance)
  const calculateCPR = (item: any) => {
    return ((item.coherence + item.politeness + item.relevance) / 3).toFixed(2);
  };

  const overallCPRScore = evaluationResults.length ?
    calculateAverage(evaluationResults.map(item => (item.coherence + item.politeness + item.relevance) / 3)) :
    '0.00';

  // Calculate scenario-based metrics
  const scenarioMetrics = useMemo(() => {
    const scenarios = [...new Set(evaluationResults.map(item => item.scenario))];
    return scenarios.map(scenario => {
      const scenarioLogs = evaluationResults.filter(item => item.scenario === scenario);
      const resolvedInScenario = scenarioLogs.filter(item => item.resolution === 1).length;
      const resolutionRate = scenarioLogs.length > 0 ? (resolvedInScenario / scenarioLogs.length) * 100 : 0;
      
      return {
        name: scenario || "Unspecified",
        count: scenarioLogs.length,
        resolutionRate: resolutionRate.toFixed(1),
        avgCoherence: calculateAverage(scenarioLogs.map(r => r.coherence)),
        avgPoliteness: calculateAverage(scenarioLogs.map(r => r.politeness)),
        avgRelevance: calculateAverage(scenarioLogs.map(r => r.relevance)),
        avgCPR: calculateAverage(scenarioLogs.map(r => (r.coherence + r.politeness + r.relevance) / 3))
      };
    }).sort((a, b) => b.count - a.count);
  }, [evaluationResults]);

  // Find chatlogs for review (low performing)
  const chatlogsForReview = useMemo(() => {
    return evaluationResults
      .map(chat => ({
        ...chat,
        cprScore: (chat.coherence + chat.politeness + chat.relevance) / 3
      }))
      .sort((a, b) => a.cprScore - b.cprScore)
      .slice(0, 5);
  }, [evaluationResults]);

  // Find top performing chatlogs
  const topPerformingChatlogs = useMemo(() => {
    return evaluationResults
      .map(chat => ({
        ...chat,
        cprScore: (chat.coherence + chat.politeness + chat.relevance) / 3
      }))
      .sort((a, b) => b.cprScore - a.cprScore)
      .slice(0, 5);
  }, [evaluationResults]);

  // Toggle scenario expansion
  const toggleScenarioExpansion = (scenarioName: string) => {
    setExpandedScenarios(prev => 
      prev.includes(scenarioName) 
        ? prev.filter(s => s !== scenarioName)
        : [...prev, scenarioName]
    );
  };

  // Toggle chatlog expansion
  const toggleChatlogExpansion = (chatlogId: number | string) => {
    setExpandedChatlogs(prev => 
      prev.includes(chatlogId) 
        ? prev.filter(id => id !== chatlogId)
        : [...prev, chatlogId]
    );
  };

  // Filter and sort evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluationResults
      .filter(item => {
        // Apply scenario filter
        if (scenarioFilter !== "all" && item.scenario !== scenarioFilter) {
          return false;
        }
        
        // Apply search filter (check in scenario or chatlog content)
        if (searchTerm && (!item.chatlog?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !item.scenario?.toLowerCase().includes(searchTerm.toLowerCase()))) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort based on selected criteria
        if (sortBy === "date-desc") {
          return new Date((b as any).timestamp || 0).getTime() - new Date((a as any).timestamp || 0).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date((a as any).timestamp || 0).getTime() - new Date((b as any).timestamp || 0).getTime();
        }
        if (sortBy === "score-desc") {
          const scoreA = (a.coherence + a.politeness + a.relevance) / 3;
          const scoreB = (b.coherence + b.politeness + b.relevance) / 3;
          return scoreB - scoreA;
        }
        if (sortBy === "score-asc") {
          const scoreA = (a.coherence + a.politeness + a.relevance) / 3;
          const scoreB = (b.coherence + b.politeness + b.relevance) / 3;
          return scoreA - scoreB;
        }
        return 0;
      });
  }, [evaluationResults, scenarioFilter, searchTerm, sortBy]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    toast({
      title: "Generating PDF",
      description: "Please wait while your report is being prepared...",
    });

    // Create a temporary div for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.className = 'pdf-content';
    pdfContent.innerHTML = `
      <style>
        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #1a202c;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .page-break {
          page-break-after: always;
        }
        .pdf-content {
          padding: 40px;
        }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pdf-title {
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
          margin: 0;
        }
        .pdf-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 5px 0 0 0;
        }
        .pdf-logo {
          font-size: 18px;
          font-weight: 700;
          color: #2563eb;
        }
        .pdf-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 5px;
          display: inline-block;
        }
        .pdf-section {
          margin-bottom: 24px;
        }
        .pdf-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pdf-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .pdf-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }
        .pdf-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        .pdf-stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .pdf-stat {
          flex: 1;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          text-align: center;
          margin: 0 8px;
          border: 1px solid #e2e8f0;
        }
        .pdf-stat:first-child {
          margin-left: 0;
        }
        .pdf-stat:last-child {
          margin-right: 0;
        }
        .pdf-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .pdf-stat-label {
          font-size: 14px;
          color: #64748b;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .pdf-table th, .pdf-table td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pdf-table th {
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
        }
        .pdf-score {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .pdf-score-low {
          background: #FEE2E2;
          color: #B91C1C;
        }
        .pdf-score-med {
          background: #FEF3C7;
          color: #92400E;
        }
        .pdf-score-high {
          background: #DCFCE7;
          color: #15803D;
        }
        .pdf-chatlog {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .pdf-chatlog-content {
          font-size: 14px;
          white-space: pre-wrap;
          margin-bottom: 12px;
          max-height: 200px;
          overflow: hidden;
        }
        .pdf-score-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .pdf-score-box {
          text-align: center;
          padding: 8px;
          border-radius: 4px;
        }
        .pdf-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .pdf-distribution-table td {
          padding: 8px 12px;
          text-align: left;
        }
        .pdf-progress-container {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          width: 100%;
          overflow: hidden;
        }
        .pdf-progress-bar {
          height: 100%;
          background: #2563eb;
        }
      </style>
      
      <div class="pdf-header">
        <div>
          <h1 class="pdf-title">Chatlog Evaluation Report</h1>
          <p class="pdf-subtitle">Generated on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
          <span class="pdf-badge">${evaluationResults.length} Chatlogs Analyzed</span>
        </div>
        <div class="pdf-logo">Chat-Scribe</div>
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">Executive Summary</h2>
        <div class="pdf-stats-row">
          <div class="pdf-stat">
            <div class="pdf-stat-value">${overallCPRScore}/5</div>
            <div class="pdf-stat-label">Overall CPR Score</div>
          </div>
          <div class="pdf-stat">
            <div class="pdf-stat-value">${averageCoherence}/5</div>
            <div class="pdf-stat-label">Coherence</div>
          </div>
          <div class="pdf-stat">
            <div class="pdf-stat-value">${averagePoliteness}/5</div>
            <div class="pdf-stat-label">Politeness</div>
          </div>
          <div class="pdf-stat">
            <div class="pdf-stat-value">${averageRelevance}/5</div>
            <div class="pdf-stat-label">Relevance</div>
          </div>
          <div class="pdf-stat">
            <div class="pdf-stat-value">${resolutionRate}%</div>
            <div class="pdf-stat-label">Resolution Rate</div>
          </div>
        </div>

        <div class="pdf-section">
          <h2 class="pdf-section-title">Score Distribution</h2>
          <table class="pdf-distribution-table" style="width:100%">
            <tr>
              <td style="width:150px"><strong>Metric</strong></td>
              <td style="width:100px">Low (1-2)</td>
              <td style="width:100px">Medium (3)</td>
              <td style="width:100px">High (4-5)</td>
              <td>Distribution</td>
            </tr>
            <tr>
              <td><strong>Coherence</strong></td>
              <td>${coherenceDist.low} (${((coherenceDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${coherenceDist.medium} (${((coherenceDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${coherenceDist.high} (${((coherenceDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>
                <div class="pdf-progress-container">
                  <div class="pdf-progress-bar" style="width:${((coherenceDist.high / evaluationResults.length) * 100).toFixed(1)}%; background:#10B981"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td><strong>Politeness</strong></td>
              <td>${politenessDist.low} (${((politenessDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${politenessDist.medium} (${((politenessDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${politenessDist.high} (${((politenessDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>
                <div class="pdf-progress-container">
                  <div class="pdf-progress-bar" style="width:${((politenessDist.high / evaluationResults.length) * 100).toFixed(1)}%; background:#6366F1"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td><strong>Relevance</strong></td>
              <td>${relevanceDist.low} (${((relevanceDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${relevanceDist.medium} (${((relevanceDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${relevanceDist.high} (${((relevanceDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>
                <div class="pdf-progress-container">
                  <div class="pdf-progress-bar" style="width:${((relevanceDist.high / evaluationResults.length) * 100).toFixed(1)}%; background:#F59E0B"></div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">Scenario Performance</h2>
        <table class="pdf-table">
          <tr>
            <th>Scenario</th>
            <th>Count</th>
            <th>Resolution Rate</th>
            <th>Avg CPR</th>
            <th>Coherence</th>
            <th>Politeness</th>
            <th>Relevance</th>
          </tr>
          ${scenarioMetrics.map(scenario => `
            <tr>
              <td>${scenario.name}</td>
              <td>${scenario.count}</td>
              <td>
                <div class="pdf-score ${Number(scenario.resolutionRate) >= 80 ? 'pdf-score-high' : Number(scenario.resolutionRate) >= 50 ? 'pdf-score-med' : 'pdf-score-low'}">
                  ${scenario.resolutionRate}%
                </div>
              </td>
              <td>
                <div class="pdf-score ${Number(scenario.avgCPR) >= 4 ? 'pdf-score-high' : Number(scenario.avgCPR) >= 3 ? 'pdf-score-med' : 'pdf-score-low'}">
                  ${scenario.avgCPR}
                </div>
              </td>
              <td>${scenario.avgCoherence}</td>
              <td>${scenario.avgPoliteness}</td>
              <td>${scenario.avgRelevance}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="page-break"></div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">Chatlogs Requiring Attention</h2>
        ${chatlogsForReview.map((chat, index) => `
          <div class="pdf-chatlog">
            <div class="pdf-chatlog-content">${truncateText(chat.chatlog, 300)}</div>
            <div class="pdf-score-grid">
              <div class="pdf-score-box pdf-score-${chat.coherence <= 2 ? 'low' : chat.coherence === 3 ? 'med' : 'high'}">
                <strong>Coherence:</strong> ${chat.coherence}/5
              </div>
              <div class="pdf-score-box pdf-score-${chat.politeness <= 2 ? 'low' : chat.politeness === 3 ? 'med' : 'high'}">
                <strong>Politeness:</strong> ${chat.politeness}/5
              </div>
              <div class="pdf-score-box pdf-score-${chat.relevance <= 2 ? 'low' : chat.relevance === 3 ? 'med' : 'high'}">
                <strong>Relevance:</strong> ${chat.relevance}/5
              </div>
              <div class="pdf-score-box pdf-score-${chat.resolution === 1 ? 'high' : 'low'}">
                <strong>Resolution:</strong> ${chat.resolution === 1 ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">Evaluation Configuration</h2>
        <div class="pdf-card">
          <div class="pdf-card-title">Model</div>
          <p>${selectedModel}</p>
        </div>
        <div class="pdf-section-title" style="margin-top:24px;">Prompt</div>
        <pre style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; font-size:12px; white-space:pre-wrap; overflow-wrap:break-word;">${promptTemplate}</pre>
      </div>

      <div class="pdf-footer">
        <p>Generated by Chat-Scribe | Chatlog Quality Analysis Tool</p>
        <p>© ${new Date().getFullYear()} All rights reserved</p>
      </div>
    `;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `chatlog-evaluation-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(pdfContent).save();
      toast({
        title: "PDF Generated",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (evaluationResults.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900/60 shadow-lg rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Evaluation Report
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No evaluation results available. Please analyze some chatlogs first.
          </p>
          <Button variant="default" onClick={() => window.location.href = '/evaluate'}>
            Go to Evaluation Page
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Evaluation Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Generated on {format(new Date(), 'MMMM d, yyyy')} • {evaluationResults.length} chatlogs analyzed 
          </p>
        </div>
        <Button 
          variant="default" 
          size="lg"
          onClick={handleExportPDF}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900/60 shadow-xl rounded-2xl overflow-hidden" ref={reportRef}>
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-border dark:border-gray-800 bg-muted/50 dark:bg-gray-900/80 p-0">
            <TabsTrigger 
              value="summary" 
              className="rounded-none border-r border-border dark:border-gray-800 py-3 data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="scenarios" 
              className="rounded-none border-r border-border dark:border-gray-800 py-3 data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger 
              value="chatlogs" 
              className="rounded-none border-r border-border dark:border-gray-800 py-3 data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chatlogs
            </TabsTrigger>
            <TabsTrigger 
              value="configuration" 
              className="rounded-none py-3 data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
            >
              <Gauge className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6 focus:outline-none">
            <div className="space-y-8">
              {/* Key Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall CPR Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{overallCPRScore}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">out of 5</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Coherence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{averageCoherence}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">out of 5</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Politeness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{averagePoliteness}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">out of 5</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Relevance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{averageRelevance}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">out of 5</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{resolutionRate}%</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{resolvedCount} of {evaluationResults.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Coherence Distribution', dist: coherenceDist, color: 'indigo' },
                  { title: 'Politeness Distribution', dist: politenessDist, color: 'purple' },
                  { title: 'Relevance Distribution', dist: relevanceDist, color: 'yellow' }
                ].map(({ title, dist, color }) => (
                  <Card key={title} className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">High (4-5)</span>
                            <span className="text-sm font-medium">{((dist.high / evaluationResults.length) * 100).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={(dist.high / evaluationResults.length) * 100} 
                            className={`h-2 ${color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-950' : color === 'purple' ? 'bg-purple-100 dark:bg-purple-950' : 'bg-yellow-100 dark:bg-yellow-950'}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Medium (3)</span>
                            <span className="text-sm font-medium">{((dist.medium / evaluationResults.length) * 100).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={(dist.medium / evaluationResults.length) * 100} 
                            className={`h-2 ${color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-950' : color === 'purple' ? 'bg-purple-100 dark:bg-purple-950' : 'bg-yellow-100 dark:bg-yellow-950'}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Low (1-2)</span>
                            <span className="text-sm font-medium">{((dist.low / evaluationResults.length) * 100).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={(dist.low / evaluationResults.length) * 100} 
                            className={`h-2 ${color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-950' : color === 'purple' ? 'bg-purple-100 dark:bg-purple-950' : 'bg-yellow-100 dark:bg-yellow-950'}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Top and bottom performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chatlogs requiring attention */}
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="text-red-500 mr-2 h-5 w-5" />
                      Chatlogs Requiring Attention
                    </CardTitle>
                    <CardDescription>
                      Lowest performing conversations that need review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <div className="space-y-4">
                      {chatlogsForReview.map((chat, index) => (
                        <div key={index} className="p-3 bg-red-50/50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                          <p className="text-sm line-clamp-2 mb-2 text-gray-700 dark:text-gray-300">
                            {truncateText(chat.chatlog, 150)}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            <Badge variant="outline" className="justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50">
                              C: {chat.coherence}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50">
                              P: {chat.politeness}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50">
                              R: {chat.relevance}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50">
                              {chat.resolution === 1 ? 'Resolved' : 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top performers */}
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
                      Top Performing Chatlogs
                    </CardTitle>
                    <CardDescription>
                      Exemplary conversations that can be used for training
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <div className="space-y-4">
                      {topPerformingChatlogs.map((chat, index) => (
                        <div key={index} className="p-3 bg-green-50/50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900/50">
                          <p className="text-sm line-clamp-2 mb-2 text-gray-700 dark:text-gray-300">
                            {truncateText(chat.chatlog, 150)}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            <Badge variant="outline" className="justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50">
                              C: {chat.coherence}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50">
                              P: {chat.politeness}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50">
                              R: {chat.relevance}/5
                            </Badge>
                            <Badge variant="outline" className="justify-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50">
                              {chat.resolution === 1 ? 'Resolved' : 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="p-6 focus:outline-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Scenario Analysis</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {scenarioMetrics.length} unique scenarios detected
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {scenarioMetrics.map((scenario) => (
                  <Card key={scenario.name} className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center cursor-pointer" onClick={() => toggleScenarioExpansion(scenario.name)}>
                        <div className="flex items-center">
                          <Badge className="mr-2 px-2 py-1 text-xs">{scenario.count}</Badge>
                          {scenario.name}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {expandedScenarios.includes(scenario.name) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={`bg-opacity-10 ${Number(scenario.resolutionRate) >= 80 ? 'bg-green-100 text-green-700 dark:text-green-400 border-green-200' : Number(scenario.resolutionRate) >= 50 ? 'bg-yellow-100 text-yellow-700 dark:text-yellow-400 border-yellow-200' : 'bg-red-100 text-red-700 dark:text-red-400 border-red-200'}`}>
                          Resolution: {scenario.resolutionRate}%
                        </Badge>
                        <Badge variant="outline" className={`bg-opacity-10 ${Number(scenario.avgCPR) >= 4 ? 'bg-green-100 text-green-700 dark:text-green-400 border-green-200' : Number(scenario.avgCPR) >= 3 ? 'bg-yellow-100 text-yellow-700 dark:text-yellow-400 border-yellow-200' : 'bg-red-100 text-red-700 dark:text-red-400 border-red-200'}`}>
                          CPR: {scenario.avgCPR}/5
                        </Badge>
                      </div>
                    </CardHeader>
                    {expandedScenarios.includes(scenario.name) && (
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Coherence</div>
                            <div className="text-xl font-semibold">{scenario.avgCoherence}</div>
                            <Progress value={Number(scenario.avgCoherence) * 20} className="h-1 mt-2 bg-indigo-100 dark:bg-indigo-950" />
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Politeness</div>
                            <div className="text-xl font-semibold">{scenario.avgPoliteness}</div>
                            <Progress value={Number(scenario.avgPoliteness) * 20} className="h-1 mt-2 bg-purple-100 dark:bg-purple-950" />
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Relevance</div>
                            <div className="text-xl font-semibold">{scenario.avgRelevance}</div>
                            <Progress value={Number(scenario.avgRelevance) * 20} className="h-1 mt-2 bg-yellow-100 dark:bg-yellow-950" />
                          </div>
                        </div>
                        
                        <h3 className="text-sm font-semibold mb-2">Sample Chatlogs</h3>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {evaluationResults
                            .filter(item => item.scenario === scenario.name)
                            .slice(0, 3)
                            .map((chat, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                                <p className="line-clamp-2">{truncateText(chat.chatlog, 150)}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">C: {chat.coherence}</Badge>
                                  <Badge variant="outline" className="text-xs">P: {chat.politeness}</Badge>
                                  <Badge variant="outline" className="text-xs">R: {chat.relevance}</Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Chatlogs Tab */}
          <TabsContent value="chatlogs" className="p-6 focus:outline-none">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">All Chatlogs</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search chatlogs..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All Scenarios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scenarios</SelectItem>
                        {[...new Set(evaluationResults.map(item => item.scenario))]
                          .filter(Boolean)
                          .map(scenario => (
                            <SelectItem key={scenario} value={scenario as string}>{scenario}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                        <SelectItem value="score-desc">Highest Score</SelectItem>
                        <SelectItem value="score-asc">Lowest Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredEvaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No chatlogs match your search criteria.</p>
                  </div>
                ) : (
                  filteredEvaluations.map((chatlog, index) => (
                    <Card key={index} className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {chatlog.scenario && (
                              <Badge variant="outline" className="font-normal">
                                {chatlog.scenario}
                              </Badge>
                            )}
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {(chatlog as any).timestamp ? format(new Date((chatlog as any).timestamp), 'MMM d, yyyy') : 'Unknown date'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleChatlogExpansion(index)}
                          >
                            {expandedChatlogs.includes(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className={`${getScoreColor(chatlog.coherence, 'bg')} ${getScoreColor(chatlog.coherence, 'text')} ${getScoreColor(chatlog.coherence, 'border')} font-normal`}>
                            Coherence: {chatlog.coherence}/5
                          </Badge>
                          <Badge className={`${getScoreColor(chatlog.politeness, 'bg')} ${getScoreColor(chatlog.politeness, 'text')} ${getScoreColor(chatlog.politeness, 'border')} font-normal`}>
                            Politeness: {chatlog.politeness}/5
                          </Badge>
                          <Badge className={`${getScoreColor(chatlog.relevance, 'bg')} ${getScoreColor(chatlog.relevance, 'text')} ${getScoreColor(chatlog.relevance, 'border')} font-normal`}>
                            Relevance: {chatlog.relevance}/5
                          </Badge>
                          <Badge className={`${chatlog.resolution === 1 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50'} font-normal`}>
                            {chatlog.resolution === 1 ? 'Resolved' : 'Unresolved'}
                          </Badge>
                          <Badge variant="outline" className="font-normal">
                            CPR: {calculateCPR(chatlog)}
                          </Badge>
                        </div>
                      </CardHeader>
                      {expandedChatlogs.includes(index) && (
                        <CardContent className="pt-4">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap font-sans">{chatlog.chatlog}</pre>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="p-6 focus:outline-none">
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="text-xl font-semibold mb-4">Model Settings</h2>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">AI Model</CardTitle>
                    <CardDescription>The AI model used for evaluating the chatlogs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg font-medium">
                      {selectedModel || "No model specified"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Prompt Template</h2>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Evaluation Prompt</CardTitle>
                    <CardDescription>The prompt template used for evaluating the chatlogs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans overflow-auto max-h-80">{promptTemplate || "No prompt template specified"}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Evaluation Rubric</h2>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Rubric Text</CardTitle>
                    <CardDescription>The rubric used for evaluating the chatlogs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans overflow-auto max-h-80">{rubricText || "No rubric specified"}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Data Information</h2>
                <Card className="bg-white/60 dark:bg-gray-900/80 shadow-md border border-border/40 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Dataset Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Total Chatlogs</div>
                          <div className="text-xl font-semibold">{evaluationResults.length}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Scenarios</div>
                          <div className="text-xl font-semibold">{[...new Set(evaluationResults.map(item => item.scenario))].filter(Boolean).length}</div>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Min</TableHead>
                            <TableHead>Max</TableHead>
                            <TableHead>Average</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Coherence</TableCell>
                            <TableCell>{Math.min(...evaluationResults.map(r => r.coherence))}</TableCell>
                            <TableCell>{Math.max(...evaluationResults.map(r => r.coherence))}</TableCell>
                            <TableCell>{averageCoherence}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Politeness</TableCell>
                            <TableCell>{Math.min(...evaluationResults.map(r => r.politeness))}</TableCell>
                            <TableCell>{Math.max(...evaluationResults.map(r => r.politeness))}</TableCell>
                            <TableCell>{averagePoliteness}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Relevance</TableCell>
                            <TableCell>{Math.min(...evaluationResults.map(r => r.relevance))}</TableCell>
                            <TableCell>{Math.max(...evaluationResults.map(r => r.relevance))}</TableCell>
                            <TableCell>{averageRelevance}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportPage; 
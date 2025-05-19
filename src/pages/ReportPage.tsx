import React, { useRef, useMemo, useState, useEffect } from 'react';
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
  Search,
  FileText,
  TrendingUp,
  Users,
  Activity
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
import { formatDate } from '../utils/dateUtils';

// Utility function for score background colors
const getScoreColor = (score: number, type: 'bg' | 'text' | 'border') => {
  if (score <= 2) {
    return type === 'bg' ? 'bg-[#FFECEB] dark:bg-rose-900/30' : 
           type === 'text' ? 'text-[#FF80B5] dark:text-rose-400' : 
           'border-red-200 dark:border-red-800';
  } else if (score === 3) {
    return type === 'bg' ? 'bg-[#FFF6E9] dark:bg-amber-900/30' : 
           type === 'text' ? 'text-[#D4A000] dark:text-amber-400' : 
           'border-amber-200 dark:border-amber-800';
  } else {
    return type === 'bg' ? 'bg-[#ECFDF3] dark:bg-green-900/30' : 
           type === 'text' ? 'text-[#22c55e] dark:text-green-400' : 
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

  // New state for shift analysis
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [shiftData, setShiftData] = useState<{
    morning: {count: number, resolution: number, avgCPR: number},
    afternoon: {count: number, resolution: number, avgCPR: number},
    evening: {count: number, resolution: number, avgCPR: number},
    night: {count: number, resolution: number, avgCPR: number}
  }>({
    morning: {count: 0, resolution: 0, avgCPR: 0},
    afternoon: {count: 0, resolution: 0, avgCPR: 0},
    evening: {count: 0, resolution: 0, avgCPR: 0},
    night: {count: 0, resolution: 0, avgCPR: 0}
  });
  
  // New state for time trend analysis
  const [timeChartData, setTimeChartData] = useState<{
    labels: string[],
    resolutionData: number[],
    cprData: number[]
  }>({
    labels: [],
    resolutionData: [],
    cprData: []
  });

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
          color: #252A3A;
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
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #E5E7EB;
        }
        .pdf-title {
          font-size: 28px;
          font-weight: 700;
          color: #252A3A;
          margin: 0;
        }
        .pdf-subtitle {
          font-size: 14px;
          color: #667085;
          margin: 5px 0 0 0;
        }
        .pdf-logo {
          font-size: 18px;
          font-weight: 700;
          color: #4582ff;
        }
        .pdf-badge {
          background: #EEF4FF;
          color: #4582ff;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 5px;
          display: inline-block;
        }
        .pdf-date {
          font-size: 14px;
          color: #667085;
          margin-top: 8px;
        }
        .pdf-section {
          margin-bottom: 30px;
        }
        .pdf-section-title {
          font-size: 20px;
          font-weight: 600;
          color: #252A3A;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pdf-section-icon {
          width: 24px;
          height: 24px;
          background: #EEF4FF;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdf-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .pdf-card {
          background: #F9FAFB;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #E5E7EB;
        }
        .pdf-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #667085;
          margin-bottom: 8px;
        }
        .pdf-stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 30px;
        }
        .pdf-stat {
          padding: 16px;
          background: #F9FAFB;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #E5E7EB;
        }
        .pdf-stat-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .pdf-stat-value.blue {
          color: #4582ff;
        }
        .pdf-stat-value.green {
          color: #22c55e;
        }
        .pdf-stat-value.amber {
          color: #D4A000;
        }
        .pdf-stat-label {
          font-size: 14px;
          color: #667085;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
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

  // Calculate shift-based metrics
  useEffect(() => {
    if (evaluationResults.length === 0) return;
    
    const shiftResults = {
      morning: {count: 0, resolution: 0, totalCPR: 0, avgCPR: 0},
      afternoon: {count: 0, resolution: 0, totalCPR: 0, avgCPR: 0},
      night: {count: 0, resolution: 0, totalCPR: 0, avgCPR: 0}
    };
    
    // Group chats by time of day
    evaluationResults.forEach(chat => {
      if (!(chat as any).timestamp) return;
      
      const date = new Date((chat as any).timestamp);
      const hour = date.getHours();
      
      let shift = 'morning';
      if (hour >= 6 && hour < 14) shift = 'morning';
      else if (hour >= 14 && hour < 22) shift = 'afternoon';
      else shift = 'night';
      
      shiftResults[shift].count++;
      if (chat.resolution === 1) shiftResults[shift].resolution++;
      
      const cprScore = (chat.coherence + chat.politeness + chat.relevance) / 3;
      shiftResults[shift].totalCPR += cprScore;
    });
    
    // Calculate averages
    for (const shift in shiftResults) {
      if (shiftResults[shift].count > 0) {
        shiftResults[shift].avgCPR = shiftResults[shift].totalCPR / shiftResults[shift].count;
      }
    }
    
    setShiftData({
      morning: {
        count: shiftResults.morning.count,
        resolution: shiftResults.morning.count > 0 ? (shiftResults.morning.resolution / shiftResults.morning.count) * 100 : 0,
        avgCPR: shiftResults.morning.avgCPR
      },
      afternoon: {
        count: shiftResults.afternoon.count,
        resolution: shiftResults.afternoon.count > 0 ? (shiftResults.afternoon.resolution / shiftResults.afternoon.count) * 100 : 0,
        avgCPR: shiftResults.afternoon.avgCPR
      },
      evening: {count: 0, resolution: 0, avgCPR: 0},
      night: {
        count: shiftResults.night.count,
        resolution: shiftResults.night.count > 0 ? (shiftResults.night.resolution / shiftResults.night.count) * 100 : 0,
        avgCPR: shiftResults.night.avgCPR
      }
    });
    
    // Generate time-based trend data
    const timeData = evaluationResults
      .filter(chat => (chat as any).timestamp)
      .sort((a, b) => new Date((a as any).timestamp).getTime() - new Date((b as any).timestamp).getTime());
    
    if (timeData.length > 0) {
      // Group by day for the chart
      const dayGroups: Record<string, {count: number, resolution: number, totalCPR: number}> = {};
      
      timeData.forEach(chat => {
        const date = new Date((chat as any).timestamp);
        const dayKey = formatDate(date, 'ISO_DATE_TIME').split(' ')[0];
        
        if (!dayGroups[dayKey]) {
          dayGroups[dayKey] = {count: 0, resolution: 0, totalCPR: 0};
        }
        
        dayGroups[dayKey].count++;
        if (chat.resolution === 1) dayGroups[dayKey].resolution++;
        
        const cprScore = (chat.coherence + chat.politeness + chat.relevance) / 3;
        dayGroups[dayKey].totalCPR += cprScore;
      });
      
      // Convert to chart data format
      const labels = Object.keys(dayGroups).map(day => formatDate(day, 'WEEK_DAY'));
      const resolutionData = Object.values(dayGroups).map(group => 
        group.count > 0 ? (group.resolution / group.count) * 100 : 0
      );
      const cprData = Object.values(dayGroups).map(group => 
        group.count > 0 ? (group.totalCPR / group.count) * 5 : 0
      );
      
      setTimeChartData({
        labels,
        resolutionData,
        cprData
      });
    }
  }, [evaluationResults]);

  // Format chatlog text into bubble format
  const formatChatlogBubbles = (chatlog: string) => {
    if (!chatlog) return <div className="text-gray-500">No chatlog content available</div>;
    
    // Split by common message patterns
    const lines = chatlog.split(/\n(?=User:|Customer:|Agent:|Bot:|AI:|Human:|Assistant:|System:)/g);
    
    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          // Determine if this is a user or assistant message
          const isUser = /^(User|Customer|Human):/i.test(line);
          const isAssistant = /^(Agent|Bot|AI|Assistant):/i.test(line);
          const isSystem = /^System:/i.test(line);
          
          // Extract the role and content
          const parts = line.split(':', 2);
          const role = parts[0].trim();
          const content = parts.length > 1 ? parts.slice(1).join(':').trim() : line;
          
          if (isUser) {
            return (
              <div key={index} className="flex justify-end">
                <div className="bg-[#EEF4FF] dark:bg-blue-900/30 text-[#252A3A] dark:text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%]">
                  <div className="text-xs text-[#4582ff] dark:text-blue-400 font-medium mb-1">{role}</div>
                  <div className="text-sm whitespace-pre-wrap">{content}</div>
                </div>
              </div>
            );
          } else if (isAssistant) {
            return (
              <div key={index} className="flex justify-start">
                <div className="bg-[#F9FAFB] dark:bg-gray-800/60 text-[#252A3A] dark:text-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] border border-gray-100 dark:border-gray-800/60">
                  <div className="text-xs text-[#667085] dark:text-gray-400 font-medium mb-1">{role}</div>
                  <div className="text-sm whitespace-pre-wrap">{content}</div>
                </div>
              </div>
            );
          } else if (isSystem) {
            return (
              <div key={index} className="flex justify-center">
                <div className="bg-[#FFF6E9] dark:bg-amber-900/30 text-[#252A3A] dark:text-white rounded-xl px-4 py-2 max-w-[90%] text-center">
                  <div className="text-xs text-[#D4A000] dark:text-amber-400 font-medium mb-1">{role}</div>
                  <div className="text-sm whitespace-pre-wrap">{content}</div>
                </div>
              </div>
            );
          } else {
            // For any other text that doesn't match patterns
            return (
              <div key={index} className="text-sm text-[#667085] dark:text-gray-400 whitespace-pre-wrap px-2">
                {line}
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Fix date display issue for chatlogs
  const formatTimestamp = (timestamp: any) => {
    return formatDate(timestamp, 'FULL_DATE_TIME');
  };

  if (evaluationResults.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-[#232534] shadow-lg rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-[#252A3A] dark:text-white mb-4">
            Evaluation Report
          </h1>
          <p className="text-[#667085] dark:text-gray-300 mb-6">
            No evaluation results available. Please analyze some chatlogs first.
          </p>
          <Button 
            onClick={() => window.location.href = '/evaluate'}
            className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] hover:opacity-90 text-white"
          >
            Go to Evaluation Page
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#161925] py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-[#4582ff] rounded-full text-white shadow-md">
              <FileText className="h-6 w-6" />
            </div>
        <div>
              <h1 className="text-2xl font-bold text-[#252A3A] dark:text-white">Evaluation Report</h1>
              <p className="mt-1 text-[#667085] dark:text-gray-300">
            Generated on {format(new Date(), 'MMMM d, yyyy')} • {evaluationResults.length} chatlogs analyzed 
          </p>
            </div>
        </div>
        <Button 
          onClick={handleExportPDF}
            className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] hover:opacity-90 text-white shadow-sm"
        >
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

        <div className="bg-white dark:bg-[#232534] shadow-sm rounded-xl overflow-hidden" ref={reportRef}>
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/20 p-0">
            <TabsTrigger 
              value="summary" 
                className="rounded-none border-r border-gray-200 dark:border-gray-800 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-[#252A3A] dark:data-[state=active]:text-white"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="scenarios" 
                className="rounded-none border-r border-gray-200 dark:border-gray-800 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-[#252A3A] dark:data-[state=active]:text-white"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger 
              value="chatlogs" 
                className="rounded-none border-r border-gray-200 dark:border-gray-800 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-[#252A3A] dark:data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chatlogs
            </TabsTrigger>
            <TabsTrigger 
              value="configuration" 
                className="rounded-none py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800/40 data-[state=active]:text-[#252A3A] dark:data-[state=active]:text-white"
            >
              <Gauge className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6 focus:outline-none">
            <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#4582ff]/10 dark:bg-blue-900/20 rounded-lg text-[#4582ff] dark:text-blue-400">
                    <BarChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#252A3A] dark:text-white">Performance Summary</h2>
                    <p className="text-sm text-[#667085] dark:text-gray-400">
                      Overview of {evaluationResults.length} conversation evaluations
                    </p>
                  </div>
                </div>

              {/* Key Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400">Overall CPR Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-[#4582ff] dark:text-blue-400">
                        {(Number(overallCPRScore) * 20).toFixed(1)}%
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400">{overallCPRScore} out of 5</p>
                  </CardContent>
                </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400">Coherence</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-[#4582ff] dark:text-blue-400">
                        {(Number(averageCoherence) * 20).toFixed(1)}%
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400">{averageCoherence} out of 5</p>
                  </CardContent>
            </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400">Politeness</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-[#D4A000] dark:text-amber-400">
                        {(Number(averagePoliteness) * 20).toFixed(1)}%
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400">{averagePoliteness} out of 5</p>
                  </CardContent>
            </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400">Relevance</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-[#4582ff] dark:text-blue-400">
                        {(Number(averageRelevance) * 20).toFixed(1)}%
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400">{averageRelevance} out of 5</p>
                  </CardContent>
            </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400">Resolution Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-3xl font-bold text-[#22c55e] dark:text-green-400">{resolutionRate}%</div>
                      <p className="text-sm text-[#667085] dark:text-gray-400">{resolvedCount} of {evaluationResults.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Time-based Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Shift Performance */}
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
                        Shift Performance
                      </CardTitle>
                      <CardDescription>Analysis by time of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-xs text-center font-medium text-[#667085] dark:text-gray-400">
                          <div>Morning<br/>(6am-2pm)</div>
                          <div>Afternoon<br/>(2pm-10pm)</div>
                          <div>Night<br/>(10pm-6am)</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Count</div>
                            <div className="text-lg font-bold text-[#252A3A] dark:text-white">{shiftData.morning.count}</div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Count</div>
                            <div className="text-lg font-bold text-[#252A3A] dark:text-white">{shiftData.afternoon.count}</div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Count</div>
                            <div className="text-lg font-bold text-[#252A3A] dark:text-white">{shiftData.night.count}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Resolution</div>
                            <div className={`text-lg font-bold ${
                              shiftData.morning.resolution >= 80 
                                ? 'text-[#22c55e] dark:text-green-400' 
                                : shiftData.morning.resolution >= 50 
                                ? 'text-[#D4A000] dark:text-amber-400' 
                                : 'text-[#FF80B5] dark:text-rose-400'
                            }`}>
                              {shiftData.morning.resolution.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Resolution</div>
                            <div className={`text-lg font-bold ${
                              shiftData.afternoon.resolution >= 80 
                                ? 'text-[#22c55e] dark:text-green-400' 
                                : shiftData.afternoon.resolution >= 50 
                                ? 'text-[#D4A000] dark:text-amber-400' 
                                : 'text-[#FF80B5] dark:text-rose-400'
                            }`}>
                              {shiftData.afternoon.resolution.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">Resolution</div>
                            <div className={`text-lg font-bold ${
                              shiftData.night.resolution >= 80 
                                ? 'text-[#22c55e] dark:text-green-400' 
                                : shiftData.night.resolution >= 50 
                                ? 'text-[#D4A000] dark:text-amber-400' 
                                : 'text-[#FF80B5] dark:text-rose-400'
                            }`}>
                              {shiftData.night.resolution.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">CPR Score</div>
                            <div className="text-lg font-bold text-[#4582ff] dark:text-blue-400">
                              {shiftData.morning.avgCPR.toFixed(2)}/5
                            </div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">CPR Score</div>
                            <div className="text-lg font-bold text-[#4582ff] dark:text-blue-400">
                              {shiftData.afternoon.avgCPR.toFixed(2)}/5
                            </div>
                          </div>
                          <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-800/60">
                            <div className="text-sm text-[#667085] dark:text-gray-400">CPR Score</div>
                            <div className="text-lg font-bold text-[#4582ff] dark:text-blue-400">
                              {shiftData.night.avgCPR.toFixed(2)}/5
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Time Trend */}
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
                        Performance Trend
                      </CardTitle>
                      <CardDescription>Daily performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {timeChartData.labels.length > 0 ? (
                        <div className="h-[300px] w-full">
                          <div className="text-xs text-[#667085] dark:text-gray-400 mb-4 text-center">
                            Showing data for {timeChartData.labels.length} days
                          </div>
                          <div className="space-y-6">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-[#252A3A] dark:text-white flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                                  Resolution Rate
                                </div>
                                <div className="text-sm font-medium text-[#22c55e]">
                                  {timeChartData.resolutionData.length > 0 
                                    ? `${timeChartData.resolutionData[timeChartData.resolutionData.length - 1].toFixed(1)}%` 
                                    : '0%'}
                                </div>
                              </div>
                              <div className="h-10 bg-[#F9FAFB] dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800/60 overflow-hidden flex items-end">
                                {timeChartData.resolutionData.map((value, index) => (
                                  <div 
                                    key={index} 
                                    className="h-full bg-[#ECFDF3] dark:bg-green-900/30 border-r border-white dark:border-gray-800 flex-1 relative group"
                                    style={{ height: `${Math.max(10, value)}%` }}
                                  >
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#252A3A] dark:bg-white text-white dark:text-[#252A3A] text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1">
                                      {value.toFixed(1)}%
                                    </div>
                                    <div className="w-full h-1 absolute bottom-0 bg-[#22c55e] dark:bg-green-400"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-[#252A3A] dark:text-white flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-[#4582ff]"></div>
                                  CPR Score
                                </div>
                                <div className="text-sm font-medium text-[#4582ff]">
                                  {timeChartData.cprData.length > 0 
                                    ? `${timeChartData.cprData[timeChartData.cprData.length - 1].toFixed(2)}/5` 
                                    : '0/5'}
                                </div>
                              </div>
                              <div className="h-10 bg-[#F9FAFB] dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800/60 overflow-hidden flex items-end">
                                {timeChartData.cprData.map((value, index) => (
                                  <div 
                                    key={index} 
                                    className="h-full bg-[#EEF4FF] dark:bg-blue-900/30 border-r border-white dark:border-gray-800 flex-1 relative group"
                                    style={{ height: `${Math.max(10, (value / 5) * 100)}%` }}
                                  >
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#252A3A] dark:bg-white text-white dark:text-[#252A3A] text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1">
                                      {value.toFixed(2)}/5
                                    </div>
                                    <div className="w-full h-1 absolute bottom-0 bg-[#4582ff] dark:bg-blue-400"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex justify-between text-xs text-[#667085] dark:text-gray-400 pt-2 px-1">
                              {timeChartData.labels.map((label, index) => (
                                <div key={index} className="text-center">
                                  {index % Math.max(1, Math.floor(timeChartData.labels.length / 5)) === 0 ? label : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[300px] w-full flex items-center justify-center text-[#667085] dark:text-gray-400">
                          No time-based data available
                        </div>
                      )}
                  </CardContent>
            </Card>
          </div>

              {/* Distribution cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Coherence Distribution', dist: coherenceDist, color: 'blue' },
                    { title: 'Politeness Distribution', dist: politenessDist, color: 'amber' },
                    { title: 'Relevance Distribution', dist: relevanceDist, color: 'blue' }
                ].map(({ title, dist, color }) => (
                    <Card key={title} className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader>
                        <CardTitle className="text-base text-[#252A3A] dark:text-white">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-[#667085] dark:text-gray-400">High (4-5)</span>
                              <span className="text-sm font-medium text-[#22c55e] dark:text-green-400">
                                {((dist.high / evaluationResults.length) * 100).toFixed(1)}%
                              </span>
                          </div>
                          <Progress 
                            value={(dist.high / evaluationResults.length) * 100} 
                              className="h-2 bg-gray-100 dark:bg-gray-700 [&>div]:bg-[#22c55e] dark:[&>div]:bg-green-500" 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-[#667085] dark:text-gray-400">Medium (3)</span>
                              <span className="text-sm font-medium text-[#D4A000] dark:text-amber-400">
                                {((dist.medium / evaluationResults.length) * 100).toFixed(1)}%
                              </span>
                          </div>
                          <Progress 
                            value={(dist.medium / evaluationResults.length) * 100} 
                              className="h-2 bg-gray-100 dark:bg-gray-700 [&>div]:bg-[#D4A000] dark:[&>div]:bg-amber-500" 
                          />
                  </div>
                        <div>
                          <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-[#667085] dark:text-gray-400">Low (1-2)</span>
                              <span className="text-sm font-medium text-[#FF80B5] dark:text-rose-400">
                                {((dist.low / evaluationResults.length) * 100).toFixed(1)}%
                              </span>
                  </div>
                          <Progress 
                            value={(dist.low / evaluationResults.length) * 100} 
                              className="h-2 bg-gray-100 dark:bg-gray-700 [&>div]:bg-[#FF80B5] dark:[&>div]:bg-rose-500" 
                          />
                  </div>
                </div>
                    </CardContent>
              </Card>
            ))}
          </div>

                {/* Scenario Summary */}
                <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#252A3A] dark:text-white">
                      <PieChart className="h-5 w-5 mr-2 text-[#4582ff] dark:text-blue-400" />
                      Scenario Overview
                    </CardTitle>
                    <CardDescription>
                      Performance metrics across different conversation scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                          <TableHead>Scenario</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Resolution</TableHead>
                          <TableHead className="text-right">CPR Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scenarioMetrics.slice(0, 5).map((scenario) => (
                          <TableRow key={scenario.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <TableCell className="font-medium">{scenario.name}</TableCell>
                            <TableCell className="text-right">{scenario.count}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={`${
                                Number(scenario.resolutionRate) >= 80 
                                  ? 'bg-[#ECFDF3] text-[#22c55e] dark:bg-green-900/30 dark:text-green-400' 
                                  : Number(scenario.resolutionRate) >= 50 
                                  ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/30 dark:text-amber-400' 
                                  : 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/30 dark:text-rose-400'
                              }`}>
                                {scenario.resolutionRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="font-medium">
                                {scenario.avgCPR}/5
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-center border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("scenarios")}>
                      View All Scenarios
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Chatlogs for review and top performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chatlogs for review */}
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader>
                      <CardTitle className="flex items-center text-[#252A3A] dark:text-white">
                        <AlertCircle className="text-[#FF80B5] dark:text-rose-400 mr-2 h-5 w-5" />
                        Chatlogs for Review
                    </CardTitle>
                    <CardDescription>
                        Low-scoring conversations that need attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <div className="space-y-4">
                      {chatlogsForReview.map((chat, index) => (
                          <div key={index} className="p-3 bg-[#FFECEB]/30 dark:bg-rose-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                            <p className="text-sm line-clamp-2 mb-2 text-[#252A3A] dark:text-gray-300">
                            {truncateText(chat.chatlog, 150)}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                              <Badge variant="outline" className="justify-center text-[#FF80B5] dark:text-rose-400 bg-[#FFECEB]/50 dark:bg-rose-900/20 border-red-200 dark:border-red-800/30">
                              C: {chat.coherence}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#FF80B5] dark:text-rose-400 bg-[#FFECEB]/50 dark:bg-rose-900/20 border-red-200 dark:border-red-800/30">
                              P: {chat.politeness}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#FF80B5] dark:text-rose-400 bg-[#FFECEB]/50 dark:bg-rose-900/20 border-red-200 dark:border-red-800/30">
                              R: {chat.relevance}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#FF80B5] dark:text-rose-400 bg-[#FFECEB]/50 dark:bg-rose-900/20 border-red-200 dark:border-red-800/30">
                              {chat.resolution === 1 ? 'Resolved' : 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top performers */}
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                  <CardHeader>
                      <CardTitle className="flex items-center text-[#252A3A] dark:text-white">
                        <CheckCircle className="text-[#22c55e] dark:text-green-400 mr-2 h-5 w-5" />
                      Top Performing Chatlogs
                    </CardTitle>
                    <CardDescription>
                      Exemplary conversations that can be used for training
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <div className="space-y-4">
                      {topPerformingChatlogs.map((chat, index) => (
                          <div key={index} className="p-3 bg-[#ECFDF3]/30 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                            <p className="text-sm line-clamp-2 mb-2 text-[#252A3A] dark:text-gray-300">
                            {truncateText(chat.chatlog, 150)}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                              <Badge variant="outline" className="justify-center text-[#22c55e] dark:text-green-400 bg-[#ECFDF3]/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                              C: {chat.coherence}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#22c55e] dark:text-green-400 bg-[#ECFDF3]/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                              P: {chat.politeness}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#22c55e] dark:text-green-400 bg-[#ECFDF3]/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                              R: {chat.relevance}/5
                            </Badge>
                              <Badge variant="outline" className="justify-center text-[#22c55e] dark:text-green-400 bg-[#ECFDF3]/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-[#4582ff]/10 dark:bg-blue-900/20 rounded-lg text-[#4582ff] dark:text-blue-400">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#252A3A] dark:text-white">Scenario Analysis</h2>
                      <p className="text-sm text-[#667085] dark:text-gray-400">
                  {scenarioMetrics.length} unique scenarios detected
                      </p>
                </div>
              </div>

                  <div className="flex items-center gap-2">
                    <Select defaultValue="count" onValueChange={(value) => {}}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Sort by Count</SelectItem>
                        <SelectItem value="resolution">Sort by Resolution</SelectItem>
                        <SelectItem value="cpr">Sort by CPR Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scenario Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-[#4582ff] dark:text-blue-400" />
                        Top Scenario
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                        {scenarioMetrics[0]?.name || "None"}
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400 mt-1">
                        {scenarioMetrics[0]?.count || 0} chatlogs • {scenarioMetrics[0]?.resolutionRate || 0}% resolution
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-[#22c55e] dark:text-green-400" />
                        Best Performing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scenarioMetrics.length > 0 ? (
                        <>
                          <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                            {[...scenarioMetrics].sort((a, b) => Number(b.avgCPR) - Number(a.avgCPR))[0]?.name}
                          </div>
                          <p className="text-sm text-[#667085] dark:text-gray-400 mt-1">
                            CPR: {[...scenarioMetrics].sort((a, b) => Number(b.avgCPR) - Number(a.avgCPR))[0]?.avgCPR}/5
                          </p>
                        </>
                      ) : (
                        <div className="text-sm text-[#667085] dark:text-gray-400">No data available</div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#667085] dark:text-gray-400 flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-[#D4A000] dark:text-amber-400" />
                        Average Resolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-[#252A3A] dark:text-white">
                        {scenarioMetrics.length > 0 
                          ? (scenarioMetrics.reduce((acc, scenario) => acc + Number(scenario.resolutionRate), 0) / scenarioMetrics.length).toFixed(1) 
                          : "0.0"}%
                      </div>
                      <p className="text-sm text-[#667085] dark:text-gray-400 mt-1">
                        Across all scenarios
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {scenarioMetrics.map((scenario) => (
                    <Card key={scenario.name} className="bg-white dark:bg-[#232534] shadow-sm border border-gray-200/40 dark:border-gray-800/40 overflow-hidden">
                      <CardHeader className="pb-2 px-5 pt-4">
                      <CardTitle className="flex justify-between items-center cursor-pointer" onClick={() => toggleScenarioExpansion(scenario.name)}>
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 bg-[#4582ff]/10 dark:bg-blue-900/20 rounded-md text-[#4582ff] dark:text-blue-400 mr-3">
                              <span className="text-sm font-bold">{scenario.count}</span>
                            </div>
                            <span className="text-[#252A3A] dark:text-white text-sm font-medium max-w-[400px] truncate">
                          {scenario.name}
                            </span>
                        </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-xs text-[#667085] dark:text-gray-400">Resolution</div>
                                <div className={`text-sm font-medium ${
                                  Number(scenario.resolutionRate) >= 80 
                                    ? 'text-[#22c55e] dark:text-green-400' 
                                    : Number(scenario.resolutionRate) >= 50 
                                    ? 'text-[#D4A000] dark:text-amber-400' 
                                    : 'text-[#FF80B5] dark:text-rose-400'
                                }`}>
                                  {scenario.resolutionRate}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-[#667085] dark:text-gray-400">CPR Score</div>
                                <div className="text-sm font-medium text-[#4582ff] dark:text-blue-400">{scenario.avgCPR}/5</div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-[#667085] hover:text-[#252A3A] dark:text-gray-400 dark:hover:text-white"
                            >
                          {expandedScenarios.includes(scenario.name) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                          </div>
                      </CardTitle>
                        <div className="flex md:hidden flex-wrap gap-3 mt-2">
                          <Badge className={`${
                            Number(scenario.resolutionRate) >= 80 
                              ? 'bg-[#ECFDF3] text-[#22c55e] dark:bg-green-900/30 dark:text-green-400' 
                              : Number(scenario.resolutionRate) >= 50 
                              ? 'bg-[#FFF6E9] text-[#D4A000] dark:bg-amber-900/30 dark:text-amber-400' 
                              : 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                          Resolution: {scenario.resolutionRate}%
                        </Badge>
                          <Badge variant="outline" className="font-normal">
                          CPR: {scenario.avgCPR}/5
                        </Badge>
                      </div>
                    </CardHeader>
                      
                    {expandedScenarios.includes(scenario.name) && (
                        <>
                          <Separator className="my-0" />
                          <CardContent className="pt-4 px-5 pb-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-[#F9FAFB] dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm font-medium text-[#252A3A] dark:text-white">Coherence</div>
                                  <div className="text-sm font-bold text-[#4582ff] dark:text-blue-400">{scenario.avgCoherence}/5</div>
                          </div>
                                <Progress 
                                  value={Number(scenario.avgCoherence) * 20} 
                                  className="h-2 bg-[#EEF4FF] dark:bg-gray-700 [&>div]:bg-[#4582ff] dark:[&>div]:bg-blue-500" 
                                />
                          </div>
                              <div className="bg-[#F9FAFB] dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm font-medium text-[#252A3A] dark:text-white">Politeness</div>
                                  <div className="text-sm font-bold text-[#D4A000] dark:text-amber-400">{scenario.avgPoliteness}/5</div>
                                </div>
                                <Progress 
                                  value={Number(scenario.avgPoliteness) * 20} 
                                  className="h-2 bg-[#FFF6E9] dark:bg-gray-700 [&>div]:bg-[#D4A000] dark:[&>div]:bg-amber-500" 
                                />
                              </div>
                              <div className="bg-[#F9FAFB] dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm font-medium text-[#252A3A] dark:text-white">Relevance</div>
                                  <div className="text-sm font-bold text-[#4582ff] dark:text-blue-400">{scenario.avgRelevance}/5</div>
                                </div>
                                <Progress 
                                  value={Number(scenario.avgRelevance) * 20} 
                                  className="h-2 bg-[#EEF4FF] dark:bg-gray-700 [&>div]:bg-[#4582ff] dark:[&>div]:bg-blue-500" 
                                />
                          </div>
                        </div>
                        
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-[#252A3A] dark:text-white">Sample Chatlogs</h3>
                                <Badge variant="outline" className="text-xs font-normal">
                                  Showing {Math.min(3, evaluationResults.filter(item => item.scenario === scenario.name).length)} of {evaluationResults.filter(item => item.scenario === scenario.name).length}
                                </Badge>
                              </div>
                              
                              <div className="space-y-3 max-h-none overflow-y-visible">
                          {evaluationResults
                            .filter(item => item.scenario === scenario.name)
                            .map((chat, idx) => (
                                    <div key={idx} className="p-3 bg-[#F9FAFB] dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800/60">
                                      <p className="text-sm text-[#252A3A] dark:text-gray-300 mb-2">
                                        {chat.chatlog}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <Badge className={`${getScoreColor(chat.coherence, 'bg')} ${getScoreColor(chat.coherence, 'text')} text-xs font-normal`}>
                                          C: {chat.coherence}
                                        </Badge>
                                        <Badge className={`${getScoreColor(chat.politeness, 'bg')} ${getScoreColor(chat.politeness, 'text')} text-xs font-normal`}>
                                          P: {chat.politeness}
                                        </Badge>
                                        <Badge className={`${getScoreColor(chat.relevance, 'bg')} ${getScoreColor(chat.relevance, 'text')} text-xs font-normal`}>
                                          R: {chat.relevance}
                                        </Badge>
                                        <Badge className={`${chat.resolution === 1 ? 'bg-[#ECFDF3] text-[#22c55e] dark:bg-green-900/30 dark:text-green-400' : 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/30 dark:text-rose-400'} text-xs font-normal`}>
                                          {chat.resolution === 1 ? 'Resolved' : 'Unresolved'}
                                        </Badge>
                                </div>
                    </div>
                            ))}
                              </div>
                    </div>
                      </CardContent>
                        </>
                    )}
                  </Card>
                ))}
                    </div>
                    </div>
          </TabsContent>

          {/* Chatlogs Tab */}
          <TabsContent value="chatlogs" className="p-6 focus:outline-none">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-[#4582ff]/10 dark:bg-blue-900/20 rounded-lg text-[#4582ff] dark:text-blue-400">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#252A3A] dark:text-white">All Chatlogs</h2>
                      <p className="text-sm text-[#667085] dark:text-gray-400">
                        {evaluationResults.length} conversations analyzed
                      </p>
                    </div>
                  </div>
                  
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search chatlogs..."
                        className="pl-8 w-full bg-white dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
                        <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60">
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
                        <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60">
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

                {/* Chatlog Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EEF4FF] dark:bg-blue-900/20">
                        <MessageSquare className="h-5 w-5 text-[#4582ff] dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-[#667085] dark:text-gray-400">Total</p>
                        <p className="text-xl font-bold text-[#252A3A] dark:text-white">{filteredEvaluations.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ECFDF3] dark:bg-green-900/20">
                        <CheckCircle className="h-5 w-5 text-[#22c55e] dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-[#667085] dark:text-gray-400">Resolved</p>
                        <p className="text-xl font-bold text-[#252A3A] dark:text-white">
                          {filteredEvaluations.filter(item => item.resolution === 1).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFECEB] dark:bg-rose-900/20">
                        <XCircle className="h-5 w-5 text-[#FF80B5] dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-sm text-[#667085] dark:text-gray-400">Unresolved</p>
                        <p className="text-xl font-bold text-[#252A3A] dark:text-white">
                          {filteredEvaluations.filter(item => item.resolution !== 1).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF6E9] dark:bg-amber-900/20">
                        <Gauge className="h-5 w-5 text-[#D4A000] dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-[#667085] dark:text-gray-400">Avg CPR</p>
                        <p className="text-xl font-bold text-[#252A3A] dark:text-white">
                          {filteredEvaluations.length > 0 
                            ? (filteredEvaluations.reduce((acc, item) => acc + ((item.coherence + item.politeness + item.relevance) / 3), 0) / filteredEvaluations.length).toFixed(2) 
                            : "0.00"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              
              <div className="space-y-4">
                {filteredEvaluations.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40 rounded-lg">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Search className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-[#252A3A] dark:text-white mb-1">No chatlogs found</h3>
                      <p className="text-[#667085] dark:text-gray-400 max-w-md mx-auto">
                        No chatlogs match your search criteria. Try adjusting your filters or search term.
                      </p>
                  </div>
                ) : (
                  filteredEvaluations.map((chatlog, index) => (
                      <Card key={index} className="bg-white dark:bg-[#232534] shadow-sm border border-gray-200/40 dark:border-gray-800/40 overflow-hidden">
                        <CardHeader className="pb-2 px-5 pt-4">
                        <CardTitle className="text-base flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {chatlog.scenario && (
                                <Badge className="bg-[#EEF4FF] text-[#4582ff] dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                                {chatlog.scenario}
                              </Badge>
                            )}
                              <div className="text-sm text-[#667085] dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                                {formatTimestamp((chatlog as any).timestamp)}
                            </div>
                          </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-normal bg-white dark:bg-gray-800/60">
                                CPR: {calculateCPR(chatlog)}
                              </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                                className="h-8 w-8 p-0 text-[#667085] hover:text-[#252A3A] dark:text-gray-400 dark:hover:text-white"
                            onClick={() => toggleChatlogExpansion(index)}
                          >
                            {expandedChatlogs.includes(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                            </div>
                        </CardTitle>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className={`${getScoreColor(chatlog.coherence, 'bg')} ${getScoreColor(chatlog.coherence, 'text')} font-normal`}>
                            Coherence: {chatlog.coherence}/5
                          </Badge>
                            <Badge className={`${getScoreColor(chatlog.politeness, 'bg')} ${getScoreColor(chatlog.politeness, 'text')} font-normal`}>
                            Politeness: {chatlog.politeness}/5
                          </Badge>
                            <Badge className={`${getScoreColor(chatlog.relevance, 'bg')} ${getScoreColor(chatlog.relevance, 'text')} font-normal`}>
                            Relevance: {chatlog.relevance}/5
                          </Badge>
                            <Badge className={`${chatlog.resolution === 1 
                              ? 'bg-[#ECFDF3] text-[#22c55e] dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-[#FFECEB] text-[#FF80B5] dark:bg-rose-900/30 dark:text-rose-400'} font-normal`}>
                            {chatlog.resolution === 1 ? 'Resolved' : 'Unresolved'}
                          </Badge>
                        </div>
                      </CardHeader>
                      {expandedChatlogs.includes(index) && (
                          <>
                            <Separator className="my-0" />
                            <CardContent className="pt-4 px-5 pb-5">
                              <div className="bg-[#F9FAFB] dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                                {formatChatlogBubbles(chatlog.chatlog)}
                          </div>
                        </CardContent>
                          </>
                      )}
                    </Card>
                  ))
                )}
              </div>
                
                {filteredEvaluations.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <div className="text-sm text-[#667085] dark:text-gray-400">
                      Showing {filteredEvaluations.length} of {evaluationResults.length} chatlogs
                    </div>
                  </div>
                )}
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="p-6 focus:outline-none">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#4582ff]/10 dark:bg-blue-900/20 rounded-lg text-[#4582ff] dark:text-blue-400">
                    <Gauge className="h-5 w-5" />
                  </div>
              <div>
                    <h2 className="text-xl font-bold text-[#252A3A] dark:text-white">Evaluation Configuration</h2>
                    <p className="text-sm text-[#667085] dark:text-gray-400">
                      Settings used for analyzing the chatlogs
                    </p>
                    </div>
              </div>

                {/* Model Settings */}
                <div className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#EEF4FF] dark:bg-blue-900/20">
                        <LineChart className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
                    </div>
                      AI Model
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-[#667085] dark:text-gray-400">
                        Model used for evaluation
                      </div>
                      <Badge className="bg-[#EEF4FF] text-[#4582ff] dark:bg-blue-900/30 dark:text-blue-400 font-normal">
                        {selectedModel || "Default Model"}
                      </Badge>
                    </div>
                    <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-[#252A3A] dark:text-white">Model Details</div>
                      </div>
                      <div className="text-sm text-[#667085] dark:text-gray-400">
                        {selectedModel 
                          ? `Using ${selectedModel} for chatlog evaluation. This model was selected for its ability to analyze conversational quality and provide accurate metrics.`
                          : "No specific model information available. Using the default evaluation model."}
                      </div>
                    </div>
                  </div>
              </div>

                {/* Prompt Template */}
                <div className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#ECFDF3] dark:bg-green-900/20">
                        <MessageSquare className="h-4 w-4 text-[#22c55e] dark:text-green-400" />
                    </div>
                      Evaluation Prompt
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-[#667085] dark:text-gray-400 mb-4">
                      The prompt template used to guide the AI in evaluating chatlogs
                    </div>
                    <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-[#252A3A] dark:text-gray-300 overflow-auto max-h-80">
                        {promptTemplate || "No prompt template specified"}
                      </pre>
                    </div>
                  </div>
              </div>

                {/* Evaluation Rubric */}
                <div className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#FFF6E9] dark:bg-amber-900/20">
                        <CheckCircle className="h-4 w-4 text-[#D4A000] dark:text-amber-400" />
                        </div>
                      Evaluation Rubric
                    </h3>
                        </div>
                  <div className="p-6">
                    <div className="text-sm text-[#667085] dark:text-gray-400 mb-4">
                      Criteria used to score and evaluate the chatlogs
                      </div>
                    <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-[#252A3A] dark:text-gray-300 overflow-auto max-h-80">
                        {rubricText || "No evaluation rubric specified"}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Dataset Statistics */}
                <div className="bg-white dark:bg-gray-800/40 shadow-sm border border-gray-200/40 dark:border-gray-800/40 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-medium text-[#252A3A] dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#FFECEB] dark:bg-rose-900/20">
                        <BarChart className="h-4 w-4 text-[#FF80B5] dark:text-rose-400" />
                      </div>
                      Dataset Statistics
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                        <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Total Chatlogs</div>
                        <div className="text-xl font-bold text-[#252A3A] dark:text-white">{evaluationResults.length}</div>
                      </div>
                      <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                        <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Unique Scenarios</div>
                        <div className="text-xl font-bold text-[#252A3A] dark:text-white">
                          {[...new Set(evaluationResults.map(item => item.scenario))].filter(Boolean).length}
                        </div>
                      </div>
                      <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                        <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Resolution Rate</div>
                        <div className="text-xl font-bold text-[#252A3A] dark:text-white">{resolutionRate}%</div>
                      </div>
                      <div className="bg-[#F9FAFB] dark:bg-gray-800/60 p-4 rounded-lg border border-gray-100 dark:border-gray-800/60">
                        <div className="text-sm text-[#667085] dark:text-gray-400 mb-1">Avg CPR Score</div>
                        <div className="text-xl font-bold text-[#252A3A] dark:text-white">{overallCPRScore}/5</div>
                      </div>
                    </div>
                    
                    <div className="bg-[#F9FAFB] dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800/60 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-medium text-[#252A3A] dark:text-white">Metric Ranges</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800/40">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#667085] dark:text-gray-400">Metric</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#667085] dark:text-gray-400">Min</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#667085] dark:text-gray-400">Max</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#667085] dark:text-gray-400">Average</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-[#252A3A] dark:text-white">Coherence</td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.min(...evaluationResults.map(r => r.coherence)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.max(...evaluationResults.map(r => r.coherence)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">{averageCoherence}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-[#252A3A] dark:text-white">Politeness</td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.min(...evaluationResults.map(r => r.politeness)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.max(...evaluationResults.map(r => r.politeness)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">{averagePoliteness}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-[#252A3A] dark:text-white">Relevance</td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.min(...evaluationResults.map(r => r.relevance)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">
                                {evaluationResults.length > 0 ? Math.max(...evaluationResults.map(r => r.relevance)) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#667085] dark:text-gray-400">{averageRelevance}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
          </div>
        </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 
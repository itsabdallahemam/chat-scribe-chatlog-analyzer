import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { analyzeKeywords, KeywordAnalysisResult } from '@/utils/textAnalysisUtils';
import { MessageSquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// Import a basic bar chart for keyword comparison
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// This is a simpler approach than trying to fix the react-wordcloud types
// We'll display a simple horizontal bar chart for the top keywords
interface KeywordAnalysisSectionProps {
  evaluationResults: any[]; // Use the same type as in DashboardPage
}

const KeywordAnalysisSection: React.FC<KeywordAnalysisSectionProps> = ({ evaluationResults }) => {
  // Analyze keywords only once using useMemo
  const analysisResult = useMemo(() => {
    if (!evaluationResults || evaluationResults.length === 0) {
      return null;
    }
    return analyzeKeywords(evaluationResults);
  }, [evaluationResults]);

  // Check if we have data to display
  if (!analysisResult) {
    return (
      <Card className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Keyword Analysis</h3>
            <div className="text-sm text-[#667085] dark:text-gray-400">
              Analyzing common words
            </div>
          </div>
          <div className="p-2 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
            <MessageSquare className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
          <div className="text-center p-6">
            <AlertTriangle className="h-8 w-8 text-[#D4A000] mx-auto mb-4" />
            <p className="text-[#667085] dark:text-gray-400 mb-2">No chat data available for analysis</p>
            <p className="text-sm text-[#667085] dark:text-gray-500">
              Upload more chatlogs to enable keyword analysis
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Get the top keywords for each category (limiting to fewer for display)
  const resolvedKeywords = analysisResult.resolvedKeywords.slice(0, 15);
  const unresolvedKeywords = analysisResult.unresolvedKeywords.slice(0, 15);
  const differentiatingKeywords = analysisResult.differentiatingKeywords.slice(0, 15);

  // Simple formatter for the tooltips
  const formatTooltip = (value: number) => `${value} occurrences`;

  return (
    <Card className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#252A3A] dark:text-white">Keyword Analysis</h3>
          <div className="text-sm text-[#667085] dark:text-gray-400">
            Analyzing common words
          </div>
        </div>
        <div className="p-2 rounded-full bg-[#EEF4FF] dark:bg-blue-900/30">
          <MessageSquare className="h-4 w-4 text-[#4582ff] dark:text-blue-400" />
        </div>
      </div>

      <Tabs defaultValue="resolved" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="resolved" className="data-[state=active]:bg-[#ECFDF3] data-[state=active]:text-[#22c55e] px-2 py-1 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </TabsTrigger>
          <TabsTrigger value="unresolved" className="data-[state=active]:bg-[#FFECEB] data-[state=active]:text-[#FF80B5] px-2 py-1 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Unresolved
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-[#EEF4FF] data-[state=active]:text-[#4582ff] px-2 py-1 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Differences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resolved" className="mt-0">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Badge variant="outline" className="bg-[#ECFDF3] text-[#22c55e] border-[#ECFDF3] dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Top Keywords in Resolved Conversations
              </Badge>
              <span className="text-xs text-[#667085] dark:text-gray-400 ml-auto">
                Based on {analysisResult.resolvedKeywords.length} keywords
              </span>
            </div>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={resolvedKeywords.slice(0, 10)}
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="text" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#22c55e" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="unresolved" className="mt-0">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Badge variant="outline" className="bg-[#FFECEB] text-[#FF80B5] border-[#FFECEB] dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Top Keywords in Unresolved Conversations
              </Badge>
              <span className="text-xs text-[#667085] dark:text-gray-400 ml-auto">
                Based on {analysisResult.unresolvedKeywords.length} keywords
              </span>
            </div>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={unresolvedKeywords.slice(0, 10)}
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="text" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#FF80B5" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-0">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Badge variant="outline" className="bg-[#EEF4FF] text-[#4582ff] border-[#EEF4FF] dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Keywords with Significant Differences
              </Badge>
              <span className="text-xs text-[#667085] dark:text-gray-400 ml-auto">
                Showing key differentiators
              </span>
            </div>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={differentiatingKeywords.slice(0, 10)}
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="text" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => `Difference score: ${(value / 10).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#4582ff" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default KeywordAnalysisSection; 
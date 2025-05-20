import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processChatlogPipeline, AnalysisResult, RecommendationResult } from '@/services/analysisService';
import { GeneratedChatlog } from '@/contexts/ChatlogContext';
import { Loader2 } from 'lucide-react';

interface AnalysisInsightsTabProps {
  generatedData: GeneratedChatlog[];
}

export const AnalysisInsightsTab = ({ generatedData }: AnalysisInsightsTabProps) => {
  const [currentChatlogIndex, setCurrentChatlogIndex] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCurrentChatlog = async () => {
      if (!generatedData[currentChatlogIndex]) return;

      setIsLoading(true);
      setError(null);

      try {
        const chatlog = generatedData[currentChatlogIndex];
        const evaluationResult = {
          id: chatlog.id,
          chatlog: chatlog.chatlog,
          scenario: chatlog.scenario,
          coherence: chatlog.coherence || 0,
          politeness: chatlog.politeness || 0,
          relevance: chatlog.relevance || 0,
          resolution: chatlog.resolution || 0,
          shift: chatlog.shift,
          dateTime: chatlog.dateTime,
          timestamp: new Date()
        };

        const { analysis: newAnalysis, recommendations: newRecommendations } = 
          await processChatlogPipeline(chatlog, evaluationResult, chatlog.customerName);

        setAnalysis(newAnalysis);
        setRecommendations(newRecommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process chatlog');
        console.error('Error processing chatlog:', err);
      } finally {
        setIsLoading(false);
      }
    };

    processCurrentChatlog();
  }, [currentChatlogIndex, generatedData]);

  const currentChatlog = generatedData[currentChatlogIndex];

  return (
    <div className="space-y-6">
      {/* Chatlog Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Chatlog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {generatedData.map((chatlog, index) => (
              <Badge
                key={chatlog.id}
                variant={index === currentChatlogIndex ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCurrentChatlogIndex(index)}
              >
                Chatlog {index + 1}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : analysis && recommendations ? (
        <>
          {/* Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Metrics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Coherence</p>
                  <p className="text-2xl font-bold">{currentChatlog.coherence}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Politeness</p>
                  <p className="text-2xl font-bold">{currentChatlog.politeness}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Relevance</p>
                  <p className="text-2xl font-bold">{currentChatlog.relevance}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Resolution</p>
                  <p className="text-2xl font-bold">{currentChatlog.resolution}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Mistakes</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {analysis.mistakes.map((mistake, index) => (
                        <li key={index}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Strengths</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {analysis.areasForImprovement.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Key Insights</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {recommendations.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Actionable Recommendations</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {recommendations.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Best Practices</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {recommendations.bestPractices.map((practice, index) => (
                        <li key={index}>{practice}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}; 

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import ChartContainer from '@/components/ChartContainer';
import ScoreHistogram from '@/components/ScoreHistogram';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatlog } from '@/contexts/ChatlogContext';

const CPRDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  const [activeTab, setActiveTab] = useState('coherence');

  // Redirect if no results
  if (evaluationResults.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-700 mb-4">No Evaluation Results</h3>
        <p className="text-gray-500 mb-6">
          Please upload or paste chatlogs on the home page to see CPR details.
        </p>
        <Button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light">
          Go to Home Page
        </Button>
      </div>
    );
  }

  // Generate distribution data for each metric
  const distributions = useMemo(() => {
    const coherence = [0, 0, 0, 0, 0]; // For scores 1-5
    const politeness = [0, 0, 0, 0, 0];
    const relevance = [0, 0, 0, 0, 0];
    
    evaluationResults.forEach(result => {
      if (result.coherence >= 1 && result.coherence <= 5) {
        coherence[result.coherence - 1]++;
      }
      if (result.politeness >= 1 && result.politeness <= 5) {
        politeness[result.politeness - 1]++;
      }
      if (result.relevance >= 1 && result.relevance <= 5) {
        relevance[result.relevance - 1]++;
      }
    });
    
    return {
      coherence: [1, 2, 3, 4, 5].map((score, index) => ({
        score,
        count: coherence[index]
      })),
      politeness: [1, 2, 3, 4, 5].map((score, index) => ({
        score,
        count: politeness[index]
      })),
      relevance: [1, 2, 3, 4, 5].map((score, index) => ({
        score,
        count: relevance[index]
      }))
    };
  }, [evaluationResults]);

  // Calculate average scores
  const avgScores = {
    coherence: evaluationResults.reduce((sum, item) => sum + item.coherence, 0) / evaluationResults.length,
    politeness: evaluationResults.reduce((sum, item) => sum + item.politeness, 0) / evaluationResults.length,
    relevance: evaluationResults.reduce((sum, item) => sum + item.relevance, 0) / evaluationResults.length
  };

  // Table columns
  const getColumns = (metric: 'coherence' | 'politeness' | 'relevance') => [
    {
      accessorKey: 'chatlog',
      header: 'Chatlog',
      cell: (row: any) => <div className="max-w-xs truncate">{row.chatlog}</div>,
    },
    {
      accessorKey: metric,
      header: metric.charAt(0).toUpperCase() + metric.slice(1),
    }
  ];

  return (
    <div>
      <PageTitle 
        title="Coherence, Politeness, Relevance Details" 
        description="Detailed analysis of CPR metrics across all evaluated chatlogs."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="coherence">Coherence</TabsTrigger>
          <TabsTrigger value="politeness">Politeness</TabsTrigger>
          <TabsTrigger value="relevance">Relevance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="coherence">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Coherence Overview</h3>
                <div className="text-3xl font-bold mb-2">{avgScores.coherence.toFixed(2)}</div>
                <p className="text-sm text-gray-500">Average coherence score out of 5</p>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm">
                    <span>Low (1-2)</span>
                    <span>Medium (3)</span>
                    <span>High (4-5)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-app-blue rounded-full" 
                      style={{ 
                        width: `${(avgScores.coherence / 5) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </Card>
              
              <div className="md:col-span-2">
                <ChartContainer title="Coherence Score Distribution">
                  <ScoreHistogram data={distributions.coherence} />
                </ChartContainer>
              </div>
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Coherence Details</h3>
              <DataTable 
                columns={getColumns('coherence')} 
                data={evaluationResults.sort((a, b) => a.coherence - b.coherence)} 
              />
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="politeness">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Politeness Overview</h3>
                <div className="text-3xl font-bold mb-2">{avgScores.politeness.toFixed(2)}</div>
                <p className="text-sm text-gray-500">Average politeness score out of 5</p>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm">
                    <span>Low (1-2)</span>
                    <span>Medium (3)</span>
                    <span>High (4-5)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-app-yellow rounded-full" 
                      style={{ 
                        width: `${(avgScores.politeness / 5) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </Card>
              
              <div className="md:col-span-2">
                <ChartContainer title="Politeness Score Distribution">
                  <ScoreHistogram data={distributions.politeness} colorKey="app-yellow" />
                </ChartContainer>
              </div>
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Politeness Details</h3>
              <DataTable 
                columns={getColumns('politeness')} 
                data={evaluationResults.sort((a, b) => a.politeness - b.politeness)} 
              />
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="relevance">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Relevance Overview</h3>
                <div className="text-3xl font-bold mb-2">{avgScores.relevance.toFixed(2)}</div>
                <p className="text-sm text-gray-500">Average relevance score out of 5</p>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm">
                    <span>Low (1-2)</span>
                    <span>Medium (3)</span>
                    <span>High (4-5)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-app-blue-light rounded-full" 
                      style={{ 
                        width: `${(avgScores.relevance / 5) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </Card>
              
              <div className="md:col-span-2">
                <ChartContainer title="Relevance Score Distribution">
                  <ScoreHistogram data={distributions.relevance} />
                </ChartContainer>
              </div>
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Relevance Details</h3>
              <DataTable 
                columns={getColumns('relevance')} 
                data={evaluationResults.sort((a, b) => a.relevance - b.relevance)} 
              />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CPRDetailsPage;

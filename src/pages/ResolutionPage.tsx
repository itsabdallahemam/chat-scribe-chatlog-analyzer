
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import ChartContainer from '@/components/ChartContainer';
import ResolutionPieChart from '@/components/ResolutionPieChart';
import { DataTable } from '@/components/DataTable';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ResolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  
  // Redirect if no results
  if (evaluationResults.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-700 mb-4">No Evaluation Results</h3>
        <p className="text-gray-500 mb-6">
          Please upload or paste chatlogs on the home page to see resolution details.
        </p>
        <Button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light">
          Go to Home Page
        </Button>
      </div>
    );
  }

  // Split resolved and unresolved chatlogs
  const resolved = useMemo(() => evaluationResults.filter(item => item.resolution === 1), [evaluationResults]);
  const unresolved = useMemo(() => evaluationResults.filter(item => item.resolution === 0), [evaluationResults]);
  
  // Calculate resolution rate
  const resolutionRate = (resolved.length / evaluationResults.length) * 100;

  // Table columns
  const columns = [
    {
      accessorKey: 'chatlog',
      header: 'Chatlog',
      cell: (row: any) => <div className="max-w-xs truncate">{row.chatlog}</div>,
    },
    {
      accessorKey: 'coherence',
      header: 'C',
      cell: (row: any) => <span title="Coherence">{row.coherence}</span>,
    },
    {
      accessorKey: 'politeness',
      header: 'P',
      cell: (row: any) => <span title="Politeness">{row.politeness}</span>,
    },
    {
      accessorKey: 'relevance',
      header: 'R',
      cell: (row: any) => <span title="Relevance">{row.relevance}</span>,
    },
  ];

  return (
    <div>
      <PageTitle 
        title="Resolution Details" 
        description="Analysis of resolved and unresolved customer service interactions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartContainer title="Resolution Overview">
          <ResolutionPieChart 
            resolved={resolved.length} 
            unresolved={unresolved.length} 
          />
        </ChartContainer>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Resolution Summary</h3>
          <div className="grid gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">{resolutionRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-500">Overall resolution rate</p>
              
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-app-blue rounded-full" 
                    style={{ width: `${resolutionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <div className="text-xl font-semibold">{resolved.length}</div>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
              <div className="border p-4 rounded-lg">
                <div className="text-xl font-semibold">{unresolved.length}</div>
                <p className="text-sm text-gray-500">Unresolved</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="resolved" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="resolved">Resolved Chatlogs</TabsTrigger>
          <TabsTrigger value="unresolved">Unresolved Chatlogs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resolved">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Resolved Chatlogs ({resolved.length})
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              These chatlogs were marked as successfully resolved (Resolution = 1).
            </p>
            <DataTable columns={columns} data={resolved} />
          </Card>
        </TabsContent>
        
        <TabsContent value="unresolved">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Unresolved Chatlogs ({unresolved.length})
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              These chatlogs were marked as unresolved (Resolution = 0).
            </p>
            <DataTable columns={columns} data={unresolved} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResolutionPage;

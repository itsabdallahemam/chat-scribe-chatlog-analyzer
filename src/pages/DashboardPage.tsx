
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import ChartContainer from '@/components/ChartContainer';
import ResolutionPieChart from '@/components/ResolutionPieChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DataTable } from '@/components/DataTable';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults, selectedModel } = useChatlog();

  if (evaluationResults.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-700 mb-4">No Evaluation Results</h3>
        <p className="text-gray-500 mb-6">
          Please upload or paste chatlogs on the home page to see evaluation results.
        </p>
        <Button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light">
          Go to Home Page
        </Button>
      </div>
    );
  }

  // Calculate metrics
  const avgCoherence = evaluationResults.reduce((sum, item) => sum + item.coherence, 0) / evaluationResults.length;
  const avgPoliteness = evaluationResults.reduce((sum, item) => sum + item.politeness, 0) / evaluationResults.length;
  const avgRelevance = evaluationResults.reduce((sum, item) => sum + item.relevance, 0) / evaluationResults.length;
  const resolvedCount = evaluationResults.filter(item => item.resolution === 1).length;
  const resolutionRate = (resolvedCount / evaluationResults.length) * 100;

  // Preview data for the table
  const previewData = evaluationResults.slice(0, 5);

  // Columns for the preview table
  const columns = [
    {
      accessorKey: 'chatlog',
      header: 'Chatlog',
      cell: (row: any) => <div className="max-w-xs truncate">{row.chatlog}</div>,
    },
    {
      accessorKey: 'coherence',
      header: 'Coherence',
    },
    {
      accessorKey: 'politeness',
      header: 'Politeness',
    },
    {
      accessorKey: 'relevance',
      header: 'Relevance',
    },
    {
      accessorKey: 'resolution',
      header: 'Resolution',
      cell: (row: any) => (
        <span className={row.resolution === 1 ? "text-green-600" : "text-red-600"}>
          {row.resolution === 1 ? "Resolved" : "Unresolved"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageTitle 
        title={`Evaluation Summary for ${evaluationResults.length} Chatlogs`} 
        description={`Using ${selectedModel ? selectedModel.split('/').pop() : 'selected model'}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Average Coherence"
          value={avgCoherence.toFixed(2)}
          description="Out of 5"
        />
        <StatCard 
          title="Average Politeness"
          value={avgPoliteness.toFixed(2)}
          description="Out of 5"
        />
        <StatCard 
          title="Average Relevance"
          value={avgRelevance.toFixed(2)}
          description="Out of 5"
        />
        <StatCard 
          title="Resolution Rate"
          value={`${resolutionRate.toFixed(1)}%`}
          description={`${resolvedCount} of ${evaluationResults.length} resolved`}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <ChartContainer title="Resolution Rate">
            <ResolutionPieChart resolved={resolvedCount} unresolved={evaluationResults.length - resolvedCount} />
          </ChartContainer>
        </div>
        <div>
          <Card className="p-6 h-full">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/satisfaction')}
                className="w-full bg-app-blue hover:bg-app-blue-light"
              >
                View Customer Satisfaction
              </Button>
              <Button 
                onClick={() => navigate('/cpr-details')}
                className="w-full bg-app-blue hover:bg-app-blue-light"
              >
                View CPR Details
              </Button>
              <Button 
                onClick={() => navigate('/resolution-details')}
                className="w-full bg-app-blue hover:bg-app-blue-light"
              >
                View Resolution Details
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Preview Chatlogs</h3>
        <DataTable columns={columns} data={previewData} />
        {evaluationResults.length > 5 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline"
              onClick={() => navigate('/cpr-details')}
            >
              View All Chatlogs
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;

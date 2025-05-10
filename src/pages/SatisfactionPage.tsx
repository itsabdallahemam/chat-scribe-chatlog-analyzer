
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import ChartContainer from '@/components/ChartContainer';
import ScoreHistogram from '@/components/ScoreHistogram';
import StatCard from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';

const SatisfactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults } = useChatlog();
  
  // Redirect if no results
  if (evaluationResults.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-700 mb-4">No Evaluation Results</h3>
        <p className="text-gray-500 mb-6">
          Please upload or paste chatlogs on the home page to see satisfaction insights.
        </p>
        <Button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light">
          Go to Home Page
        </Button>
      </div>
    );
  }

  // Calculate metrics
  const avgPoliteness = evaluationResults.reduce((sum, item) => sum + item.politeness, 0) / evaluationResults.length;
  const resolvedCount = evaluationResults.filter(item => item.resolution === 1).length;
  const resolutionRate = (resolvedCount / evaluationResults.length) * 100;

  // Generate politeness score distribution data
  const politenessDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0]; // For scores 1-5
    
    evaluationResults.forEach(result => {
      if (result.politeness >= 1 && result.politeness <= 5) {
        distribution[result.politeness - 1]++;
      }
    });
    
    return [1, 2, 3, 4, 5].map((score, index) => ({
      score,
      count: distribution[index]
    }));
  }, [evaluationResults]);

  // Find chatlogs requiring attention (Politeness <= 2 OR Resolution == 0)
  const attentionRequired = useMemo(() => {
    return evaluationResults.filter(item => item.politeness <= 2 || item.resolution === 0);
  }, [evaluationResults]);

  // Table columns
  const columns = [
    {
      accessorKey: 'chatlog',
      header: 'Chatlog',
      cell: (row: any) => <div className="max-w-xs truncate">{row.chatlog}</div>,
    },
    {
      accessorKey: 'politeness',
      header: 'Politeness',
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
        title="Customer Satisfaction Insights" 
        description="Analysis of politeness scores and resolution rates across all chatlogs."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard 
          title="Average Politeness Score"
          value={avgPoliteness.toFixed(2)}
          description="Out of 5"
        />
        <StatCard 
          title="Resolution Rate"
          value={`${resolutionRate.toFixed(1)}%`}
          description={`${resolvedCount} of ${evaluationResults.length} resolved`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartContainer title="Politeness Score Distribution">
          <ScoreHistogram data={politenessDistribution} colorKey="app-yellow" />
        </ChartContainer>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Satisfaction Summary</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-green-500"></span>
              <span>
                <strong>{evaluationResults.filter(i => i.politeness >= 4).length}</strong> chatlogs
                with excellent politeness (4-5)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-yellow-500"></span>
              <span>
                <strong>{evaluationResults.filter(i => i.politeness === 3).length}</strong> chatlogs
                with average politeness (3)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-red-500"></span>
              <span>
                <strong>{evaluationResults.filter(i => i.politeness <= 2).length}</strong> chatlogs
                with poor politeness (1-2)
              </span>
            </li>
            <li className="flex items-center gap-2 mt-6 pt-4 border-t">
              <span className="h-4 w-4 rounded-full bg-app-blue"></span>
              <span>
                <strong>{resolvedCount}</strong> chatlogs resolved successfully
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-red-500"></span>
              <span>
                <strong>{evaluationResults.length - resolvedCount}</strong> chatlogs unresolved
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">
          Chatlogs Requiring Attention ({attentionRequired.length})
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          These chatlogs have either low politeness scores (≤ 2) or were unresolved.
        </p>
        <DataTable columns={columns} data={attentionRequired} />
      </Card>
    </div>
  );
};

export default SatisfactionPage;

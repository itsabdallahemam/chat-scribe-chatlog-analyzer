
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';

// Import Recharts components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Define a type for the data used in score distribution charts
interface ScoreDistributionData {
  name: string; // Score value (e.g., "1", "2", "3", "4", "5")
  count: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { evaluationResults, selectedModel } = useChatlog();

  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-app-bg text-app-text">
        <div className="max-w-md text-center">
          <PageTitle title="Dashboard" description="No evaluations yet." />
          <h3 className="text-xl font-medium mb-4">No Evaluation Results</h3>
          <p className="text-muted-foreground mb-6">
            Please upload or paste chatlogs on the home page to see evaluation results.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-app-blue hover:bg-app-blue-light text-white"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  // --- Calculate Metrics (keep as is) ---
  const totalLogs = evaluationResults.length;
  const validResults = evaluationResults.filter(item =>
    item &&
    typeof item.coherence === 'number' && !isNaN(item.coherence) &&
    typeof item.politeness === 'number' && !isNaN(item.politeness) &&
    typeof item.relevance === 'number' && !isNaN(item.relevance) &&
    typeof item.resolution === 'number' && !isNaN(item.resolution)
  );

  if (validResults.length === 0 && totalLogs > 0) {
    console.warn("DashboardPage: All evaluation results have invalid/NaN scores for metric calculations.");
  }
  
  const sumCoherence = validResults.reduce((sum, item) => sum + item.coherence, 0);
  const sumPoliteness = validResults.reduce((sum, item) => sum + item.politeness, 0);
  const sumRelevance = validResults.reduce((sum, item) => sum + item.relevance, 0);
  
  const avgCoherence = validResults.length > 0 ? sumCoherence / validResults.length : NaN;
  const avgPoliteness = validResults.length > 0 ? sumPoliteness / validResults.length : NaN;
  const avgRelevance = validResults.length > 0 ? sumRelevance / validResults.length : NaN;

  const resolvedCount = validResults.filter(item => item.resolution === 1).length;
  const unresolvedCount = validResults.length - resolvedCount;
  const resolutionRate = validResults.length > 0 ? (resolvedCount / validResults.length) * 100 : 0;

  // --- Prepare data for score distribution charts (keep as is) ---
  const getScoreDistribution = (metric: keyof typeof evaluationResults[0]): ScoreDistributionData[] => {
    const counts: { [key: string]: number } = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    validResults.forEach(item => {
      const scoreValue = item[metric];
      if (typeof scoreValue === 'number' && !isNaN(scoreValue) && scoreValue >= 1 && scoreValue <= 5) {
        const roundedScore = String(Math.round(scoreValue));
        counts[roundedScore] = (counts[roundedScore] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  };

  const coherenceDistribution = getScoreDistribution('coherence');
  const politenessDistribution = getScoreDistribution('politeness');
  const relevanceDistribution = getScoreDistribution('relevance');

  // --- Colors for charts ---
  const PIE_RESOLVED_COLOR = "#0A2463";
  const PIE_UNRESOLVED_COLOR = "#FFD166";
  const BAR_CHART_COLOR = "#247BA0"; // app-blue-light

  return (
    <div className="space-y-6 p-4 md:p-6 bg-app-bg min-h-screen text-app-text">
      <PageTitle
        title={`Dashboard Overview`}
        description={`Analyzing ${totalLogs} chatlogs with ${selectedModel ? selectedModel.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Selected Model'}`}
      />

      {/* Main content grid with bento box layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats row with gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden rounded-xl shadow-md border-0 bg-gradient-to-br from-[#f8e3ff] to-[#ffd1dc]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Coherence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">
                  {isNaN(avgCoherence) ? "N/A" : avgCoherence.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Average score out of 5</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden rounded-xl shadow-md border-0 bg-gradient-to-br from-[#d4e7fe] to-[#b6ccfe]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Politeness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">
                  {isNaN(avgPoliteness) ? "N/A" : avgPoliteness.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Average score out of 5</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden rounded-xl shadow-md border-0 bg-gradient-to-br from-[#cffcff] to-[#b0e5e9]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Relevance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">
                  {isNaN(avgRelevance) ? "N/A" : avgRelevance.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Average score out of 5</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden rounded-xl shadow-md border-0 bg-gradient-to-br from-[#fff8c9] to-[#ffeaa0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">
                  {isNaN(resolutionRate) ? "N/A" : `${resolutionRate.toFixed(1)}%`}
                </div>
                <p className="text-sm text-gray-600">{`${resolvedCount} of ${validResults.length} chatlogs resolved`}</p>
              </CardContent>
            </Card>
          </div>

          {/* Score Distributions Chart Card */}
          <Card className="rounded-xl shadow-sm p-1">
            <CardHeader>
              <CardTitle>Score Distributions</CardTitle>
              <CardDescription>
                Breakdown of scores across evaluation metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Coherence", data: coherenceDistribution },
                  { title: "Politeness", data: politenessDistribution },
                  { title: "Relevance", data: relevanceDistribution },
                ].map((chart, index) => (
                  <div key={index} className="h-[200px]">
                    <h4 className="text-sm font-medium mb-2 text-center">{chart.title}</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                        <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" fontSize={12} />
                        <Tooltip 
                          wrapperStyle={{ color: '#333', fontSize: '12px' }} 
                          contentStyle={{ background: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill={BAR_CHART_COLOR} name="Count" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar area (1/3) */}
        <div className="space-y-6">
          {/* Resolution Overview Card */}
          <Card className="rounded-xl shadow-sm p-1">
            <CardHeader>
              <CardTitle>Resolution Overview</CardTitle>
              <CardDescription>
                Breakdown of resolved vs. unresolved chatlogs
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ name: 'Resolved', value: resolvedCount }, { name: 'Unresolved', value: unresolvedCount }]}
                    cx="50%" cy="50%" labelLine={false} outerRadius={90} fill="#8884d8" dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key={`cell-resolved`} fill={PIE_RESOLVED_COLOR} />
                    <Cell key={`cell-unresolved`} fill={PIE_UNRESOLVED_COLOR} />
                  </Pie>
                  <Tooltip 
                    wrapperStyle={{ color: '#333', fontSize: '12px' }} 
                    contentStyle={{ background: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="rounded-xl shadow-sm p-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to detailed views</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
              <Button 
                onClick={() => navigate('/satisfaction')} 
                className="w-full bg-app-blue hover:bg-app-blue-light text-white justify-start"
                variant="default" 
              >
                View Customer Satisfaction
              </Button>
              <Button 
                onClick={() => navigate('/cpr-details')} 
                className="w-full bg-app-blue hover:bg-app-blue-light text-white justify-start"
                variant="default" 
              >
                View CPR Details
              </Button>
              <Button 
                onClick={() => navigate('/resolution-details')} 
                className="w-full bg-app-blue hover:bg-app-blue-light text-white justify-start"
                variant="default" 
              >
                View Resolution Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chatlog Preview Table */}
      <Card className="rounded-xl shadow-sm mt-6">
        <CardHeader>
          <CardTitle>Recent Chatlogs</CardTitle>
          <CardDescription>Preview of evaluated conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={[
              { 
                accessorKey: 'chatlog', 
                header: 'Chatlog',
                cell: (row: any) => <div className="max-w-xs truncate">{row.chatlog}</div>,
              },
              { accessorKey: 'coherence', header: 'C' },
              { accessorKey: 'politeness', header: 'P' },
              { accessorKey: 'relevance', header: 'R' },
              { 
                accessorKey: 'resolution', 
                header: 'Resolution',
                cell: (row: any) => (
                  <span className={row.resolution === 1 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {row.resolution === 1 ? "Resolved" : "Unresolved"}
                  </span>
                ),
              }
            ]} 
            data={evaluationResults.slice(0, 5)} 
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
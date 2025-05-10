// src/pages/DashboardPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
// import ResolutionPieChart from '@/components/ResolutionPieChart'; // Using direct Recharts Pie
import { useChatlog } from '@/contexts/ChatlogContext';
import { Button } from '@/components/ui/button';
// import { DataTable } from '@/components/DataTable'; // Keep commented for now

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

  // ... (if (!evaluationResults || evaluationResults.length === 0) block - keep as is) ...
  if (!evaluationResults || evaluationResults.length === 0) {
    return (
      <div className="text-center py-16 bg-app-bg text-app-text">
        <PageTitle title="Dashboard" description="No evaluations yet." />
        <h3 className="text-xl font-medium mb-4">No Evaluation Results</h3>
        <p className="text-muted-foreground mb-6">
          Please upload or paste chatlogs on the home page to see evaluation results.
        </p>
        <button onClick={() => navigate('/')} className="bg-app-blue hover:bg-app-blue-light text-white px-4 py-2 rounded">
          Go to Home Page
        </button>
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

  // --- Colors for charts (keep as is) ---
  const PIE_RESOLVED_COLOR = "#0A2463";
  const PIE_UNRESOLVED_COLOR = "#FFD166";
  const BAR_CHART_COLOR = "#247BA0"; // app-blue-light

  return (
    <div className="space-y-8 p-4 md:p-6 bg-app-bg min-h-screen text-app-text">
      <PageTitle
        title={`Evaluation Summary for ${totalLogs} Chatlogs`}
        description={`Using ${selectedModel ? selectedModel.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Selected Model'}`}
      />

      {/* Section 1: Top Stat Cards (Keep as is) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Avg. Coherence" value={isNaN(avgCoherence) ? "N/A" : avgCoherence.toFixed(2)} description="Out of 5" />
        {/* ... other StatCards ... */}
        <StatCard title="Avg. Politeness" value={isNaN(avgPoliteness) ? "N/A" : avgPoliteness.toFixed(2)} description="Out of 5" />
        <StatCard title="Avg. Relevance" value={isNaN(avgRelevance) ? "N/A" : avgRelevance.toFixed(2)} description="Out of 5" />
        <StatCard title="Resolution Rate" value={isNaN(resolutionRate) ? "N/A" : `${resolutionRate.toFixed(1)}%`} description={`${resolvedCount} of ${validResults.length} validly scored logs resolved`} />
      </div>
      
      {/* Section 2: Resolution Pie Chart and Quick Actions (Keep as is) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card text-card-foreground">
          {/* ... Pie Chart Card Content ... */}
          <CardHeader>
            <CardTitle>Resolution Overview</CardTitle>
            <CardDescription className="text-muted-foreground">Breakdown of resolved vs. unresolved chatlogs (from validly scored items).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ name: 'Resolved', value: resolvedCount }, { name: 'Unresolved', value: unresolvedCount }]}
                  cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell key={`cell-resolved`} fill={PIE_RESOLVED_COLOR} />
                  <Cell key={`cell-unresolved`} fill={PIE_UNRESOLVED_COLOR} />
                </Pie>
                <Tooltip wrapperStyle={{ color: '#333' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          {/* ... Quick Actions Card Content ... */}
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">Navigate to detailed views.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3">
            <Button onClick={() => navigate('/satisfaction')} className="w-full bg-app-blue hover:bg-app-blue-light text-white">View Customer Satisfaction</Button>
            <Button onClick={() => navigate('/cpr-details')} className="w-full bg-app-blue hover:bg-app-blue-light text-white">View CPR Details</Button>
            <Button onClick={() => navigate('/resolution-details')} className="w-full bg-app-blue hover:bg-app-blue-light text-white">View Resolution Details</Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Section 3: Score Distribution Bar Charts --- */}
      {/* --- UNCOMMENT/ADD THIS SECTION BACK --- */}
      <h2 className="text-2xl font-semibold tracking-tight text-app-text mt-8 mb-4">Score Distributions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Coherence Distribution", data: coherenceDistribution, metricKey: 'coherence' },
          { title: "Politeness Distribution", data: politenessDistribution, metricKey: 'politeness' },
          { title: "Relevance Distribution", data: relevanceDistribution, metricKey: 'relevance' },
        ].map((chart, index) => (
          <Card key={index} className="bg-card text-card-foreground">
            <CardHeader><CardTitle>{chart.title}</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" />
                  <Tooltip wrapperStyle={{ color: '#333' }} />
                  <Legend />
                  <Bar dataKey="count" fill={BAR_CHART_COLOR} name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* --- END SECTION 3 --- */}

      <div style={{marginTop: '20px', padding: '20px', border: '1px dashed #ccc'}}>
        <p>Bar Charts section added. More content to come.</p>
        <p>(If you see this, this section likely didn't crash.)</p>
      </div>

      {/* DataTable still commented out */}
    </div>
  );
};

export default DashboardPage;
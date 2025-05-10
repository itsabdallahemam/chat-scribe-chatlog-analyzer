
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreHistogramProps {
  data: { score: number; count: number }[];
  colorKey?: string;
}

const ScoreHistogram: React.FC<ScoreHistogramProps> = ({ data, colorKey = "app-blue" }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="score" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`${value} chatlogs`, 'Count']}
          labelFormatter={(value) => `Score: ${value}`}
        />
        <Bar dataKey="count" fill={colorKey === "app-blue" ? "#0A2463" : "#FFD166"} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreHistogram;

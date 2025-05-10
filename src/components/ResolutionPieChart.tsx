
import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResolutionPieChartProps {
  resolved: number;
  unresolved: number;
}

const ResolutionPieChart: React.FC<ResolutionPieChartProps> = ({ resolved, unresolved }) => {
  const data = [
    { name: 'Resolved', value: resolved },
    { name: 'Unresolved', value: unresolved },
  ];

  const COLORS = ['#0A2463', '#FFD166'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} chatlogs`, 'Count']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ResolutionPieChart;

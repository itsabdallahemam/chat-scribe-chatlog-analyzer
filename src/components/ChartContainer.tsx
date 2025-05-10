
import React from 'react';
import { Card } from '@/components/ui/card';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  description?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  children,
  description 
}) => {
  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="h-[300px]">
        {children}
      </div>
    </Card>
  );
};

export default ChartContainer;

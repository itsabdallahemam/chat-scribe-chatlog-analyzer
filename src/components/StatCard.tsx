
import React from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon,
  color = "bg-app-blue" 
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;

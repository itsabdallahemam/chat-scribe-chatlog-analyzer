import React from 'react';
import ReactWordcloud from 'react-wordcloud';
import { WordFrequency } from '@/utils/textAnalysisUtils';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface WordCloudComponentProps {
  words: WordFrequency[];
  title: string;
  colorMode?: 'default' | 'category' | 'resolved' | 'unresolved';
  height?: number;
  width?: number;
  minSize?: number;
  maxSize?: number;
}

const WordCloudComponent: React.FC<WordCloudComponentProps> = ({
  words,
  title,
  colorMode = 'default',
  height = 300,
  width = 300,
  minSize = 12,
  maxSize = 40,
}) => {
  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center text-[#667085] dark:text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  // Color schemes
  const getColorScheme = () => {
    switch (colorMode) {
      case 'resolved':
        // Green-based color scheme for resolved
        return ['#ECFDF3', '#6EE7B7', '#34D399', '#10B981', '#059669'];
      case 'unresolved':
        // Red-based color scheme for unresolved
        return ['#FFECEB', '#FCA5A5', '#F87171', '#EF4444', '#DC2626'];
      case 'category':
        // Different colors for different categories
        return ['#FF80B5', '#247BA0', '#FFD166', '#22c55e', '#4582ff', '#9CA3AF'];
      default:
        // Blue-based default color scheme
        return ['#EEF4FF', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6']; 
    }
  };

  const options = {
    colors: getColorScheme(),
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'Inter, sans-serif',
    fontSizes: [minSize, maxSize],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 0],
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000,
  };

  const callbacks = {
    getTooltip: (word: WordFrequency) => `${word.text}: ${word.value} occurrences`,
  };

  return (
    <div className="bg-white dark:bg-[#232534] rounded-xl shadow-sm p-4 flex flex-col h-full">
      <h3 className="text-base font-medium text-[#252A3A] dark:text-white mb-3">{title}</h3>
      <div className="flex-1 min-h-[250px]" style={{ height, width }}>
        <ReactWordcloud 
          words={words} 
          options={options} 
          callbacks={callbacks} 
          size={[width, height]}
        />
      </div>
    </div>
  );
};

export default WordCloudComponent; 
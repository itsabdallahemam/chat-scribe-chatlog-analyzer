import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useDateRange } from '@/hooks/useDateRange';
import { DateRange } from 'react-day-picker';

interface GenerationSettingsProps {
  minTurns: number;
  maxTurns: number;
  minLogsPerDay: number;
  maxLogsPerDay: number;
  similarityThreshold: number;
  behaviorPattern: string;
  dateRange: DateRange | undefined;
  onMinTurnsChange: (value: number) => void;
  onMaxTurnsChange: (value: number) => void;
  onMinLogsPerDayChange: (value: number) => void;
  onMaxLogsPerDayChange: (value: number) => void;
  onSimilarityThresholdChange: (value: number) => void;
  onBehaviorPatternChange: (value: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const BEHAVIOR_PATTERNS = [
  { value: 'consistently-strong', label: 'Consistently Strong Performance' },
  { value: 'consistently-weak', label: 'Consistently Weak Performance' },
  { value: 'improving', label: 'Improving Performance' },
  { value: 'declining', label: 'Declining Performance' },
  { value: 'variable', label: 'Variable Performance' },
];

export function GenerationSettings({
  minTurns,
  maxTurns,
  minLogsPerDay,
  maxLogsPerDay,
  similarityThreshold,
  behaviorPattern,
  dateRange,
  onMinTurnsChange,
  onMaxTurnsChange,
  onMinLogsPerDayChange,
  onMaxLogsPerDayChange,
  onSimilarityThresholdChange,
  onBehaviorPatternChange,
  onDateRangeChange,
}: GenerationSettingsProps) {
  const { error: dateRangeError } = useDateRange({
    defaultRange: dateRange,
    maxRange: 90, // 3 months maximum
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTurns">Min Turns</Label>
              <Input
                id="minTurns"
                type="number"
                value={minTurns}
                onChange={(e) => onMinTurnsChange(Number(e.target.value))}
                min={1}
                max={maxTurns}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTurns">Max Turns</Label>
              <Input
                id="maxTurns"
                type="number"
                value={maxTurns}
                onChange={(e) => onMaxTurnsChange(Number(e.target.value))}
                min={minTurns}
                max={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLogsPerDay">Min Logs/Day</Label>
              <Input
                id="minLogsPerDay"
                type="number"
                value={minLogsPerDay}
                onChange={(e) => onMinLogsPerDayChange(Number(e.target.value))}
                min={1}
                max={maxLogsPerDay}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLogsPerDay">Max Logs/Day</Label>
              <Input
                id="maxLogsPerDay"
                type="number"
                value={maxLogsPerDay}
                onChange={(e) => onMaxLogsPerDayChange(Number(e.target.value))}
                min={minLogsPerDay}
                max={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="similarityThreshold">Similarity Threshold</Label>
            <Input
              id="similarityThreshold"
              type="number"
              value={similarityThreshold}
              onChange={(e) => onSimilarityThresholdChange(Number(e.target.value))}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="behaviorPattern">Behavior Pattern</Label>
            <Select value={behaviorPattern} onValueChange={onBehaviorPatternChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select behavior pattern" />
              </SelectTrigger>
              <SelectContent>
                {BEHAVIOR_PATTERNS.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
            {dateRangeError && (
              <p className="text-sm text-destructive mt-1">{dateRangeError}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
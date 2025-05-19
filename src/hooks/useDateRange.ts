import { useState, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface UseDateRangeOptions {
  defaultRange?: DateRange;
  minDate?: Date;
  maxDate?: Date;
  maxRange?: number; // maximum number of days allowed in range
}

interface UseDateRangeResult {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  isValidRange: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
  error: string | null;
  resetDateRange: () => void;
}

export function useDateRange({
  defaultRange,
  minDate,
  maxDate,
  maxRange,
}: UseDateRangeOptions = {}): UseDateRangeResult {
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(defaultRange);
  const [error, setError] = useState<string | null>(null);

  const validateRange = useCallback((range: DateRange | undefined): boolean => {
    if (!range || !range.from || !range.to) {
      setError('Please select both start and end dates');
      return false;
    }

    const start = startOfDay(range.from);
    const end = endOfDay(range.to);

    if (minDate && isBefore(start, startOfDay(minDate))) {
      setError(`Start date cannot be before ${minDate.toLocaleDateString()}`);
      return false;
    }

    if (maxDate && isAfter(end, endOfDay(maxDate))) {
      setError(`End date cannot be after ${maxDate.toLocaleDateString()}`);
      return false;
    }

    if (maxRange) {
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxRange) {
        setError(`Date range cannot exceed ${maxRange} days`);
        return false;
      }
    }

    if (isAfter(start, end)) {
      setError('Start date must be before end date');
      return false;
    }

    setError(null);
    return true;
  }, [minDate, maxDate, maxRange]);

  const setDateRange = useCallback((range: DateRange | undefined) => {
    if (!range) {
      setDateRangeState(undefined);
      setError(null);
      return;
    }

    if (validateRange(range)) {
      setDateRangeState(range);
    }
  }, [validateRange]);

  const resetDateRange = useCallback(() => {
    setDateRangeState(defaultRange);
    setError(null);
  }, [defaultRange]);

  return {
    dateRange,
    setDateRange,
    isValidRange: !error && !!dateRange?.from && !!dateRange?.to,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    error,
    resetDateRange,
  };
} 
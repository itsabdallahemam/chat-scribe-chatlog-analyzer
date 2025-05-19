import { format as dateFnsFormat, parseISO } from 'date-fns';

// Format types
export const DATE_FORMATS = {
  FULL_DATE_TIME: 'MMM d, yyyy • h:mm a', // e.g., "Jan 1, 2024 • 2:30 PM"
  DATE_ONLY: 'MMM d, yyyy', // e.g., "Jan 1, 2024"
  TIME_ONLY: 'h:mm a', // e.g., "2:30 PM"
  ISO_DATE_TIME: "yyyy-MM-dd HH:mm", // e.g., "2024-01-01 14:30"
  WEEK_DAY: 'MMM d', // e.g., "Jan 1"
} as const;

export type DateFormat = keyof typeof DATE_FORMATS;

/**
 * Safely formats a date string or Date object using the specified format
 * @param date Date string or Date object to format
 * @param formatType The type of format to use from DATE_FORMATS
 * @param fallback Optional fallback string to return if date is invalid
 * @returns Formatted date string or fallback value
 */
export const formatDate = (
  date: string | Date | undefined | null,
  formatType: DateFormat = 'FULL_DATE_TIME',
  fallback: string = '-'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    
    return dateFnsFormat(dateObj, DATE_FORMATS[formatType]);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};

/**
 * Safely parses an ISO date string to a Date object
 * @param dateString ISO date string to parse
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = parseISO(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}; 
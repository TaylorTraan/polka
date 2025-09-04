import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SessionStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds into a human-readable time string
 * @param seconds - Time in seconds
 * @param includeHours - Whether to include hours in the format
 * @returns Formatted time string (e.g., "02:30" or "1:02:30")
 */
export function formatTime(seconds: number, includeHours: boolean = false): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (includeHours && hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a timestamp into a human-readable date string
 * @param timestamp - Unix timestamp in seconds
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number, 
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', options);
}

/**
 * Get CSS classes for session status styling
 * @param status - Session status
 * @param variant - Style variant (default, compact, or dark-aware)
 * @returns CSS class string
 */
export function getStatusColor(
  status: SessionStatus, 
  variant: 'default' | 'compact' | 'dark-aware' = 'default'
): string {
  const baseClasses = {
    draft: variant === 'dark-aware' 
      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      : 'bg-gray-100 text-gray-800',
    recording: variant === 'dark-aware'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      : 'bg-red-100 text-red-800',
    complete: variant === 'dark-aware'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-green-100 text-green-800',
    archived: variant === 'dark-aware'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      : 'bg-blue-100 text-blue-800'
  };

  return baseClasses[status] || baseClasses.draft;
}

/**
 * Get the appropriate status label, accounting for paused state
 * @param status - Session status
 * @param isPaused - Whether the session is paused (for recording status)
 * @returns Status label string
 */
export function getStatusLabel(status: SessionStatus, isPaused?: boolean): string {
  if (status === 'recording' && isPaused) {
    return 'PAUSED';
  }
  return status.toUpperCase();
}

/**
 * Format duration in milliseconds to a human-readable string
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return formatTime(seconds);
}

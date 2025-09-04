import React from 'react';
import { Clock, BookOpen, Play } from 'lucide-react';
import { SessionStatus } from '@/types';

/**
 * Get the appropriate icon for a session status
 * @param status - Session status
 * @returns JSX element with the appropriate icon
 */
export function getStatusIcon(status: SessionStatus): React.ReactElement {
  const iconProps = { className: "w-3 h-3" };
  
  switch (status) {
    case 'draft':
      return <Clock {...iconProps} />;
    case 'recording':
      return <Play {...iconProps} />;
    case 'complete':
      return <BookOpen {...iconProps} />;
    default:
      return <Clock {...iconProps} />;
  }
}

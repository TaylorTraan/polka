import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@/types/session';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  className?: string;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onClick, 
  className = '' 
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'recording': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-3 h-3" />;
      case 'recording': return <Play className="w-3 h-3" />;
      case 'complete': return <BookOpen className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-medium line-clamp-2 leading-tight">
              {session.title}
            </CardTitle>
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(session.status)}`}>
              {getStatusIcon(session.status)}
              {session.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {session.course && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {session.course}
            </p>
          )}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(session.created_at)}
          </div>
          {session.duration_ms > 0 && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Play className="w-3 h-3 mr-1" />
              {Math.round(session.duration_ms / 1000)}s
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

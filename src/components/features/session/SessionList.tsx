import React from 'react';
import { motion } from 'framer-motion';
import { Session } from '@/types';
import { SessionCard } from './SessionCard';
import { Skeleton } from '@/components';

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  view: 'list' | 'grid';
  onSessionClick?: (session: Session) => void;
  onDeleteSession?: (session: Session) => void;
  onStatusChange?: (session: Session, newStatus: string) => void;
  isSelectionMode?: boolean;
  selectedSessions?: Set<string>;
  onSelectSession?: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  view,
  onSessionClick,
  onDeleteSession,
  onStatusChange,
  isSelectionMode = false,
  selectedSessions = new Set(),
  onSelectSession
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-muted-foreground">
          <p className="text-lg font-medium mb-2">No sessions yet</p>
          <p className="text-sm">Create your first session to get started</p>
        </div>
      </motion.div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SessionCard
              session={session}
              onClick={() => onSessionClick?.(session)}
              onDelete={onDeleteSession}
              onStatusChange={onStatusChange}
              isSelectionMode={isSelectionMode}
              isSelected={selectedSessions.has(session.id)}
              onSelect={() => onSelectSession?.(session.id)}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <SessionCard
            session={session}
            onClick={() => onSessionClick?.(session)}
            onDelete={onDeleteSession}
            onStatusChange={onStatusChange}
            isSelectionMode={isSelectionMode}
            isSelected={selectedSessions.has(session.id)}
            onSelect={() => onSelectSession?.(session.id)}
            className="!cursor-pointer"
          />
        </motion.div>
      ))}
    </div>
  );
};

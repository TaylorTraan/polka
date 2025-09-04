import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Archive as ArchiveIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorMessage, useToast, ViewToggle, SessionList, PageTransition } from '@/components';
import { useSessionsStore } from '@/store/sessions';
import { Session } from '@/types/session';
import { useTabs } from '@/hooks/useTabs';

export default function Archive() {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const { showError } = useToast();
  
  const { sessions, loading, error, load, delete: deleteSession, clearError } = useSessionsStore();
  const { openSessionTab } = useTabs();

  useEffect(() => {
    load();
  }, [load]);

  const handleSessionClick = (session: Session) => {
    openSessionTab(session.id, session.title);
  };


  const handleDeleteSession = async (session: Session) => {
    try {
      await deleteSession(session.id);
    } catch (error) {
      console.error('Error deleting session:', error);
      showError('Failed to delete session. Please try again.');
    }
  };

  const handleStatusChange = async (session: Session, newStatus: string) => {
    try {
      const { useSessionsStore } = await import('@/store/sessions');
      await useSessionsStore.getState().updateStatus({ id: session.id, status: newStatus as any });
    } catch (error) {
      console.error('Error updating session status:', error);
      showError('Failed to update session status. Please try again.');
    }
  };

  const archivedSessions = sessions.filter(s => s.status.toLowerCase() === 'archived');

  return (
    <PageTransition>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <ArchiveIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Archive</CardTitle>
                    <CardDescription>
                      {archivedSessions.length} archived session{archivedSessions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ViewToggle view={view} onViewChange={setView} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <ErrorMessage 
                  message={error}
                  onDismiss={clearError}
                  variant="inline"
                />
              )}
              
              {archivedSessions.length === 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ArchiveIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No archived sessions</p>
                    <p className="text-sm">Sessions you archive will appear here</p>
                  </div>
                </motion.div>
              ) : (
                <SessionList
                  sessions={archivedSessions}
                  loading={loading}
                  view={view}
                  onSessionClick={handleSessionClick}
                  onDeleteSession={handleDeleteSession}
                  onStatusChange={handleStatusChange}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}

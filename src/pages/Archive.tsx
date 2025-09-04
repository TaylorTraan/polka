import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ViewToggle';
import { SessionList } from '@/components/SessionList';
import { useSessionsStore } from '@/store/sessions';
import { Session } from '@/types/session';
import PageTransition from '@/components/PageTransition';

export default function Archive() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'grid'>('grid');
  
  const { sessions, loading, error, load, clearError } = useSessionsStore();

  useEffect(() => {
    load();
  }, [load]);

  const handleSessionClick = (session: Session) => {
    navigate(`/app/session/${session.id}`);
  };


  const handleStatusChange = async (session: Session, newStatus: string) => {
    try {
      const { useSessionsStore } = await import('@/store/sessions');
      await useSessionsStore.getState().updateStatus({ id: session.id, status: newStatus as any });
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status. Please try again.');
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                >
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 h-auto p-1 text-destructive hover:bg-destructive/20"
                  >
                    ×
                  </Button>
                </motion.div>
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

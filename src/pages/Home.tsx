import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorMessage, PageTransition, ViewToggle, SessionList, CreateSessionModal } from '@/components';
import { BulkDeleteConfirmationDialog, BulkStatusChangeModal } from '@/components/features/common';
import { Mic, Plus, BookOpen, Clock, CheckSquare, Square, Trash2, X, Edit3 } from 'lucide-react';
import { useSessionsStore } from '@/store/sessions';
import { Session } from '@/types';
import { useTabs } from '@/hooks/useTabs';

export default function Home() {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  const { sessions, loading, error, load, create, delete: deleteSession, clearError } = useSessionsStore();
  const { openSessionTab } = useTabs();

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateSession = async (title: string, course: string) => {
    const newSession = await create({ title, course });
    if (newSession) {
      setShowCreateModal(false);
      openSessionTab(newSession.id, newSession.title);
    }
  };

  const handleSessionClick = (session: Session) => {
    openSessionTab(session.id, session.title);
  };

  const handleDeleteSession = async (session: Session) => {
    try {
      await deleteSession(session.id);
    } catch (error) {
      console.error('Error deleting session:', error);
      // Error is handled by the store
    }
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

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      
      // Exit selection mode if no sessions are selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedSessions(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedSessions.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedSessions.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      // Delete all selected sessions
      await Promise.all(
        Array.from(selectedSessions).map(sessionId => deleteSession(sessionId))
      );
      
      // Clear selection and exit selection mode
      setSelectedSessions(new Set());
      setIsSelectionMode(false);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting sessions:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = () => {
    if (selectedSessions.size === 0) return;
    setShowBulkStatusDialog(true);
  };

  const handleBulkStatusChangeConfirm = async (newStatus: string) => {
    if (selectedSessions.size === 0) return;
    
    setIsBulkUpdating(true);
    try {
      // Update status for all selected sessions
      await Promise.all(
        Array.from(selectedSessions).map(async (sessionId) => {
          const { useSessionsStore } = await import('@/store/sessions');
          await useSessionsStore.getState().updateStatus({ id: sessionId, status: newStatus as any });
        })
      );
      
      // Clear selection and exit selection mode
      setSelectedSessions(new Set());
      setIsSelectionMode(false);
      setShowBulkStatusDialog(false);
    } catch (error) {
      console.error('Error updating session statuses:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Polka
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered note-taking companion. Never miss important moments in class again.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-16 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-6 h-6 mr-3" />
              New Session
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Record & Transcribe</CardTitle>
              <CardDescription>
                Capture audio from any source and get instant AI-powered transcriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Smart Notes</CardTitle>
              <CardDescription>
                AI automatically highlights key concepts and creates study-friendly summaries
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Never Miss Out</CardTitle>
              <CardDescription>
                Engagement tracking detects when you zone out and helps you catch up
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Sessions Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Sessions Library</CardTitle>
                  <CardDescription>
                    {isSelectionMode && selectedSessions.size > 0 
                      ? `${selectedSessions.size} session${selectedSessions.size === 1 ? '' : 's'} selected`
                      : sessions.length > 0 
                        ? `${sessions.length} session${sessions.length === 1 ? '' : 's'}`
                        : 'No sessions yet'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!isSelectionMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleSelectionMode}
                        disabled={sessions.length === 0}
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Select
                      </Button>
                      <ViewToggle view={view} onViewChange={setView} />
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedSessions.size === sessions.length ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select All
                          </>
                        )}
                      </Button>
                      {selectedSessions.size > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkStatusChange}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Change Status ({selectedSessions.size})
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedSessions.size})
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleSelectionMode}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
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
              
              <SessionList
                sessions={sessions.filter(s => s.status.toLowerCase() !== 'archived')}
                loading={loading}
                view={view}
                onSessionClick={handleSessionClick}
                onDeleteSession={handleDeleteSession}
                onStatusChange={handleStatusChange}
                isSelectionMode={isSelectionMode}
                selectedSessions={selectedSessions}
                onSelectSession={handleSelectSession}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Session Modal */}
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSession}
          loading={loading}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <BulkDeleteConfirmationDialog
          sessions={sessions.filter(s => selectedSessions.has(s.id))}
          isOpen={showBulkDeleteDialog}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setShowBulkDeleteDialog(false)}
          isDeleting={isBulkDeleting}
        />

        {/* Bulk Status Change Modal */}
        <BulkStatusChangeModal
          sessions={sessions.filter(s => selectedSessions.has(s.id))}
          isOpen={showBulkStatusDialog}
          onConfirm={handleBulkStatusChangeConfirm}
          onCancel={() => setShowBulkStatusDialog(false)}
          isUpdating={isBulkUpdating}
        />
      </div>
    </PageTransition>
  );
}

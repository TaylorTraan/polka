import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, PageTransition } from '@/components';
import { useSessionsStore } from '@/store/sessions';
import { useTabs } from '@/hooks/useTabs';
import { useAutoSave } from '@/hooks';

export default function Notes() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions, updateSessionNotes } = useSessionsStore();
  const { closeTab } = useTabs();
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Find the session
  const session = sessions.find(s => s.id === sessionId);

  // Auto-save functionality
  const { hasUnsavedChanges, save } = useAutoSave(
    notes,
    async (content: string) => {
      if (sessionId) {
        await updateSessionNotes(sessionId, content);
      }
    },
    2000 // Auto-save after 2 seconds of inactivity
  );

  useEffect(() => {
    if (session) {
      // Load notes from the backend
      const loadNotes = async () => {
        try {
          const { sessionsClient } = await import('@/lib/sessions');
          const notesContent = await sessionsClient.readNotes(session.id);
          setNotes(notesContent);
        } catch (error) {
          console.error('Error loading notes:', error);
          setNotes(session.notes || '');
        }
        setIsLoading(false);
      };
      loadNotes();
    }
  }, [session]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleSave = async () => {
    await save();
  };

  const handleBack = () => {
    if (sessionId) {
      closeTab(sessionId);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading notes...</div>
        </div>
      </PageTransition>
    );
  }

  if (!session) {
    return (
      <PageTransition>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Session not found</h2>
            <p className="text-muted-foreground mb-4">The session you're looking for doesn't exist.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold">{session.title}</h1>
                  <p className="text-sm text-muted-foreground">Notes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Auto-save indicator */}
                <div className="text-xs text-muted-foreground">
                  {hasUnsavedChanges ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      Saving changes...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      All changes saved
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  size="sm"
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start writing your notes..."
                className="w-full h-full text-base leading-relaxed border-none outline-none resize-none bg-transparent placeholder:text-muted-foreground/60"
                style={{ 
                  minHeight: 'calc(100vh - 200px)',
                  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

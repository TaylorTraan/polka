import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Type } from 'lucide-react';
import { Button, PageTransition, RichTextEditor } from '@/components';
import FormattingPanel from '@/components/features/common/FormattingPanel';
import { useSessionsStore } from '@/store/sessions';
import { useTabs } from '@/hooks/useTabs';
import { useAutoSave } from '@/hooks';

export default function Notes() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions, updateSessionNotes } = useSessionsStore();
  const { navigateToTab } = useTabs();
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFormatting, setShowFormatting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Find the session
  const session = sessions.find(s => s.id === sessionId);

  // Auto-save functionality
  const { hasUnsavedChanges, saveImmediately } = useAutoSave(
    async (content: string) => {
      if (sessionId) {
        await updateSessionNotes(sessionId, content);
      }
    },
    notes,
    { delay: 2000 } // Auto-save after 2 seconds of inactivity
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
          setNotes(''); // Session doesn't have notes property, start with empty
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
    saveImmediately();
  };

  const handleBack = () => {
    navigateToTab('/app');
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
                {/* Formatting Button */}
                <Button
                  variant={showFormatting ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowFormatting(!showFormatting)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="h-8 px-2"
                  title="Text Formatting"
                >
                  <Type className="w-4 h-4" />
                </Button>

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

        {/* Formatting Panel */}
        <AnimatePresence>
          {showFormatting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <FormattingPanel editorRef={editorRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col"
            >
              <RichTextEditor
                ref={editorRef}
                value={notes}
                onChange={handleNotesChange}
                placeholder="Start writing your notes..."
                className="h-full"
                style={{ 
                  minHeight: 'calc(100vh - 200px)'
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { Button, PageTransition } from '@/components';
import { useSessionsStore } from '@/store/sessions';
import { useTabs } from '@/hooks/useTabs';
import TranscriptLine from '@/components/features/recorder/TranscriptLine';
import { TranscriptLineData } from '@/types';

export default function Transcript() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions } = useSessionsStore();
  const { closeTab } = useTabs();
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Find the session
  const session = sessions.find(s => s.id === sessionId);

  useEffect(() => {
    if (session) {
      // Load transcript lines for this session
      const loadTranscript = async () => {
        try {
          const { sessionsClient } = await import('@/lib/sessions');
          const transcriptData = await sessionsClient.readTranscript(session.id);
          // Convert the transcript data to the expected format
          const convertedLines = transcriptData.map((line, index) => ({
            id: `${session.id}-${index}`,
            t_ms: line.t_ms,
            speaker: line.speaker,
            text: line.text,
          }));
          setTranscriptLines(convertedLines);
        } catch (error) {
          console.error('Error loading transcript:', error);
          setTranscriptLines([]);
        }
        setIsLoading(false);
      };
      loadTranscript();
    }
  }, [session]);

  const handleBack = () => {
    if (sessionId) {
      closeTab(sessionId);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading transcript...</div>
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
                  <p className="text-sm text-muted-foreground">Transcript</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              {transcriptLines.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-20 text-muted-foreground">
                    <Bookmark className="w-16 h-16 mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-medium mb-2">No transcript yet</h3>
                    <p className="text-base">Start recording to see transcript lines appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcriptLines.map((line, index) => (
                    <div key={line.id} className="border-l-2 border-transparent hover:border-primary/20 pl-4 transition-colors">
                      <TranscriptLine
                        line={line}
                        isLatest={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bookmark, MessageCircle } from 'lucide-react';
import { TranscriptLineData } from './recorder/TranscriptLine';
import TranscriptLine from './recorder/TranscriptLine';

interface NotionLayoutProps {
  transcriptLines: TranscriptLineData[];
  isRecording: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export default function NotionLayout({
  transcriptLines,
  isRecording,
  notes,
  onNotesChange,
  onSaveNotes: _onSaveNotes
}: NotionLayoutProps) {
  const [activeView, setActiveView] = useState<'notes' | 'transcript'>('notes');

  const handleNotesChange = (value: string) => {
    onNotesChange(value);
    // Note: Auto-save is now handled with debouncing in the parent component
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content Area - Notion Style */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          {/* View Toggle Tabs */}
          <div className="flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <button
              onClick={() => setActiveView('notes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'notes'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle className="w-4 h-4 mr-2 inline" />
              Notes
            </button>
            <button
              onClick={() => setActiveView('transcript')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'transcript'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Bookmark className="w-4 h-4 mr-2 inline" />
              Transcript
            </button>
          </div>

          {/* Content */}
          <div className="h-full">
            {activeView === 'notes' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full p-8"
              >
                {/* Notes Editor - Notion Style */}
                <div className="h-full flex flex-col">
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Start writing your notes..."
                    className="flex-1 w-full text-base leading-relaxed border-none outline-none resize-none bg-transparent placeholder:text-muted-foreground/60"
                    style={{ 
                      minHeight: 'calc(100vh - 200px)',
                      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
                    }}
                  />
                  
                  {/* Auto-save indicator */}
                  <div className="mt-4 text-xs text-muted-foreground/60">
                    Notes are automatically saved
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full"
              >
                {/* Transcript View */}
                <div className="h-full overflow-y-auto p-8">
                  {transcriptLines.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                      <Bookmark className="w-16 h-16 mx-auto mb-6 opacity-20" />
                      <h3 className="text-xl font-medium mb-2">No transcript yet</h3>
                      <p className="text-base">Start recording to see transcript lines appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {transcriptLines.map((line, index) => (
                        <div key={line.id} className="border-l-2 border-transparent hover:border-primary/20 pl-4 transition-colors">
                          <TranscriptLine
                            line={line}
                            isLatest={index === transcriptLines.length - 1 && isRecording}
                          />
                        </div>
                      ))}
                      
                      {/* Recording Indicator */}
                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                              Recording in progress...
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

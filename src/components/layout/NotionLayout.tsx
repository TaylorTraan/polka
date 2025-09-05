import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { Bookmark, FileText, X } from 'lucide-react';
import { TranscriptLineData } from '@/types';
import TranscriptLine from '../features/recorder/TranscriptLine';
import RichTextEditor from '../features/common/RichTextEditor';

interface NotionLayoutProps {
  transcriptLines: TranscriptLineData[];
  isRecording: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  sessionTitle?: string;
  isFullscreen?: boolean;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}

export default function NotionLayout({
  transcriptLines,
  isRecording,
  notes,
  onNotesChange,
  sessionTitle = 'Notes',
  isFullscreen = false,
  editorRef: externalEditorRef
}: NotionLayoutProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const internalEditorRef = useRef<HTMLDivElement>(null);
  const editorRef = externalEditorRef || internalEditorRef;

  const handleNotesChange = (value: string) => {
    onNotesChange(value);
  };

  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

  return (
    <div className="h-full flex bg-background relative">
      {/* Main Notes Area */}
      <div className={`flex-1 transition-all duration-300 ${showTranscript ? 'mr-96' : ''}`}>
        <div className="h-full max-w-4xl mx-auto">
          {/* Notes Header with Transcript Toggle */}
          <div className="flex items-center justify-between px-8 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{sessionTitle}</h2>
            </div>
            
            {/* Transcript Toggle Button - hidden in fullscreen mode */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: isFullscreen ? 0 : 1,
                scale: isFullscreen ? 0.8 : 1,
                x: isFullscreen ? 20 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={isFullscreen ? "pointer-events-none" : ""}
            >
              <button
                onClick={toggleTranscript}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 fast-tooltip ${
                  showTranscript
                    ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
                data-tooltip={showTranscript ? "Hide Transcript Panel" : "Show Transcript Panel"}
              >
                <FileText className={`w-4 h-4 ${showTranscript ? 'font-bold' : ''}`} />
                <span className={showTranscript ? 'font-bold' : ''}>Transcript</span>
              </button>
            </motion.div>
          </div>

          {/* Notes Editor */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
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

      {/* Slide-out Transcript Panel */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50"
          >
            {/* Transcript Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Transcript</h3>
              </div>
              <button
                onClick={toggleTranscript}
                className="p-1 hover:bg-muted rounded-md transition-colors fast-tooltip"
                data-tooltip="Close Transcript Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript Content */}
            <div className="h-full overflow-y-auto p-4">
              {transcriptLines.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <h4 className="font-medium mb-2">No transcript yet</h4>
                  <p className="text-sm">Start recording to see transcript lines appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcriptLines.map((line, index) => (
                    <div key={line.id} className="border-l-2 border-transparent hover:border-primary/20 pl-3 transition-colors">
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
                      className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Recording...
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

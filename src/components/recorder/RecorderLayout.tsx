import { motion } from 'framer-motion';
import TranscriptPane from './TranscriptPane';
import NotesHighlightsPane from './NotesHighlightsPane';
import { TranscriptLineData } from '@/types';

interface RecorderLayoutProps {
  transcriptLines: TranscriptLineData[];
  isRecording: boolean;
  notes: string;
  onAddBookmark: () => void;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export default function RecorderLayout({
  transcriptLines,
  isRecording,
  notes,
  onAddBookmark,
  onNotesChange,
  onSaveNotes
}: RecorderLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Two Column Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column - Transcript */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-card border rounded-lg shadow-sm overflow-hidden"
        >
          <TranscriptPane
            lines={transcriptLines}
            isRecording={isRecording}
            onAddBookmark={onAddBookmark}
          />
        </motion.div>

        {/* Right Column - Notes & Highlights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-80 bg-card border rounded-lg shadow-sm overflow-hidden"
        >
          <NotesHighlightsPane 
            isRecording={isRecording}
            notes={notes}
            onNotesChange={onNotesChange}
            onSaveNotes={onSaveNotes}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

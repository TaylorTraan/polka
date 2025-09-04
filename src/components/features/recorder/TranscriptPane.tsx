import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/components';
import TranscriptLine from './TranscriptLine';
import { TranscriptLineData } from '@/types';

interface TranscriptPaneProps {
  lines: TranscriptLineData[];
  isRecording: boolean;
  onAddBookmark: () => void;
}

export default function TranscriptPane({ lines, isRecording, onAddBookmark }: TranscriptPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added during recording
  useEffect(() => {
    if (isRecording && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, isRecording]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Transcript</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddBookmark}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Bookmark
        </Button>
      </div>

      {/* Transcript Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {lines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No transcript yet</p>
            <p className="text-xs">Start recording to see transcript lines appear</p>
          </div>
        ) : (
          lines.map((line, index) => (
            <TranscriptLine
              key={line.id}
              line={line}
              isLatest={index === lines.length - 1 && isRecording}
            />
          ))
        )}
      </div>

              {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
          </motion.div>
        )}
    </div>
  );
}

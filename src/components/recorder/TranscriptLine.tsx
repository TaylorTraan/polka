import { motion } from 'framer-motion';
import { Clock, Bookmark } from 'lucide-react';

export interface TranscriptLineData {
  id: string;
  timestamp: number;
  text: string;
  isBookmarked?: boolean;
}

interface TranscriptLineProps {
  line: TranscriptLineData;
  isLatest?: boolean;
}

export default function TranscriptLine({ line, isLatest = false }: TranscriptLineProps) {
  const formatTime = (timestamp: number) => {
    const minutes = Math.floor(timestamp / 60);
    const seconds = timestamp % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        isLatest ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[60px]">
        <Clock className="w-3 h-3" />
        {formatTime(line.timestamp)}
      </div>
      
      <div className="flex-1">
        <p className="text-sm leading-relaxed">{line.text}</p>
      </div>
      
      {line.isBookmarked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0"
        >
          <Bookmark className="w-4 h-4 text-blue-600 fill-current" />
        </motion.div>
      )}
    </motion.div>
  );
}

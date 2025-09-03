import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface VUMeterProps {
  level: number; // 0-1 range
  isRecording: boolean;
}

export default function VUMeter({ level, isRecording }: VUMeterProps) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const levelRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (isRecording) {
      // Immediate response to level changes
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // For rapid changes, update immediately
      if (level > levelRef.current || timeSinceLastUpdate > 100) {
        setDisplayLevel(level);
        levelRef.current = level;
        lastUpdateRef.current = now;
      }
      // For slower changes, use a slight smoothing
      else if (timeSinceLastUpdate > 50) {
        const smoothed = levelRef.current * 0.7 + level * 0.3;
        setDisplayLevel(smoothed);
        levelRef.current = smoothed;
        lastUpdateRef.current = now;
      }
    } else {
      setDisplayLevel(0);
      levelRef.current = 0;
    }
  }, [level, isRecording]);

  // Create segments for the VU meter
  const segments = Array.from({ length: 20 }, (_, i) => {
    const segmentLevel = (i + 1) / 20;
    const isActive = displayLevel >= segmentLevel;
    
    // Color coding: green (low), yellow (medium), red (high)
    let color = 'bg-green-500';
    if (segmentLevel > 0.7) {
      color = 'bg-red-500';
    } else if (segmentLevel > 0.4) {
      color = 'bg-yellow-500';
    }

    return (
      <motion.div
        key={i}
        className={`h-4 w-3 rounded-sm ${
          isActive ? color : 'bg-gray-200 dark:bg-gray-700'
        }`}
        initial={{ opacity: 0.3 }}
        animate={{ 
          opacity: isActive ? 1 : 0.3,
          scale: isActive ? 1.1 : 1,
          backgroundColor: isActive ? undefined : 'rgb(229, 231, 235)' // Faster color transitions
        }}
        transition={{ 
          duration: isActive ? 0.05 : 0.2, // Faster rise, slower fall
          ease: isActive ? 'easeOut' : 'easeIn'
        }}
      />
    );
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground min-w-[60px]">
        {isRecording ? 'Level:' : 'Ready'}
      </span>
      <div className="flex items-center gap-1 px-3 py-2 bg-background border rounded-lg">
        {segments}
      </div>
      <span className="text-sm text-muted-foreground min-w-[40px]">
        {isRecording ? `${Math.round(displayLevel * 100)}%` : ''}
      </span>
    </div>
  );
}

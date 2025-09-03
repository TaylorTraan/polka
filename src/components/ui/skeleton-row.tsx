import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonRowProps {
  index: number;
}

export function SkeletonRow({ index }: SkeletonRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center space-x-4 p-4 border-b border-border last:border-b-0"
      role="status"
      aria-label={`Loading item ${index + 1}`}
    >
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-20 h-8 rounded-md" />
    </motion.div>
  );
}

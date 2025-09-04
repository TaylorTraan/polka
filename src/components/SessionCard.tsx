import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Play, MoreVertical, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Session } from '@/types/session';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  onDelete?: (session: Session) => void;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onClick, 
  onDelete,
  className = '',
  isSelectionMode = false,
  isSelected = false,
  onSelect
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'recording': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-3 h-3" />;
      case 'recording': return <Play className="w-3 h-3" />;
      case 'complete': return <BookOpen className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(session);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (isDeleting) return;
    
    if (isSelectionMode) {
      onSelect?.();
    } else {
      onClick?.();
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${
            isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
          } ${className}`}
          onClick={handleCardClick}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {isSelectionMode && (
                  <div className="mt-1">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground hover:border-primary'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.();
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                )}
                <CardTitle className="text-base font-medium line-clamp-2 leading-tight">
                  {session.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(session.status)}`}>
                  {getStatusIcon(session.status)}
                  {session.status}
                </span>
                
                {onDelete && !isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem 
                        className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        onClick={handleDeleteClick}
                        disabled={session.status === 'recording'}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {session.course && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {session.course}
              </p>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(session.created_at)}
            </div>
            {session.duration_ms > 0 && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Play className="w-3 h-3 mr-1" />
                {Math.round(session.duration_ms / 1000)}s
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        session={session}
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={isDeleting}
      />
    </>
  );
};

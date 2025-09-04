import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Play, MoreVertical, Trash2, Check, Archive, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components';
import DeleteConfirmationDialog from '@/components/features/common/DeleteConfirmationDialog';
import { Session } from '@/types';
import { formatDate, getStatusColor, formatDuration } from '@/lib/utils';
import { getStatusIcon } from '@/lib/status-utils';
import { useConfirmationDialog } from '@/hooks';

interface SessionCardProps {
  session: Session;
  onClick?: () => void;
  onDelete?: (session: Session) => void;
  onStatusChange?: (session: Session, newStatus: string) => void;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onClick, 
  onDelete,
  onStatusChange,
  className = '',
  isSelectionMode = false,
  isSelected = false,
  onSelect
}) => {
  const deleteDialog = useConfirmationDialog();
  // const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    deleteDialog.open();
  };



  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setIsArchiving(true);
    try {
      await onStatusChange(session, newStatus);
    } finally {
      setIsArchiving(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock, color: 'text-gray-600' },
    { value: 'recording', label: 'Recording', icon: Play, color: 'text-red-600' },
    { value: 'complete', label: 'Complete', icon: BookOpen, color: 'text-green-600' },
    { value: 'archived', label: 'Archived', icon: Archive, color: 'text-blue-600' },
  ];

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    await deleteDialog.executeWithLoading(() => onDelete(session));
  };

  const handleCardClick = () => {
    if (deleteDialog.isLoading || isArchiving) return;
    
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
                
                {(onDelete || onStatusChange) && !isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isArchiving}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onStatusChange && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs">
                              <Edit3 className="w-3 h-3 mr-2" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-40">
                              {statusOptions.map((status) => {
                                const Icon = status.icon;
                                const isCurrentStatus = session.status.toLowerCase() === status.value;
                                const isDisabled = session.status === 'recording' && status.value !== 'recording';
                                
                                return (
                                  <DropdownMenuItem
                                    key={status.value}
                                    className={`text-xs ${status.color} ${isCurrentStatus ? 'bg-accent' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(status.value);
                                    }}
                                    disabled={isDisabled || isCurrentStatus}
                                  >
                                    <Icon className="w-3 h-3 mr-2" />
                                    {status.label}
                                    {isCurrentStatus && <Check className="w-3 h-3 ml-auto" />}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          onClick={handleDeleteClick}
                          disabled={session.status === 'recording'}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete Session
                        </DropdownMenuItem>
                      )}
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
              {getStatusIcon(session.status)}
              <span className="ml-1">{formatDate(session.created_at)}</span>
            </div>
            {session.duration_ms > 0 && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>{formatDuration(session.duration_ms)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        session={session}
        isOpen={deleteDialog.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteDialog.close}
        isDeleting={deleteDialog.isLoading}
      />
    </>
  );
};

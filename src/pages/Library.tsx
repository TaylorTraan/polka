import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  BookOpen,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ErrorMessage, useToast, ViewToggle, SessionList } from '@/components';
import { useSessionsStore } from '@/store/sessions';
import { Session } from '@/types/session';
import { PageTransition } from '@/components';
import { useTabs } from '@/hooks/useTabs';

type SortBy = 'created_at' | 'title' | 'duration_ms' | 'status';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'complete' | 'archived';

export default function Library() {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { showError } = useToast();
  
  const { sessions, loading, error, load, delete: deleteSession, clearError } = useSessionsStore();
  const { openSessionTab } = useTabs();

  useEffect(() => {
    load();
  }, [load]);

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(query) ||
        session.course.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status.toLowerCase() === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [sessions, searchQuery, sortBy, sortOrder, statusFilter]);

  const handleSessionClick = (session: Session) => {
    openSessionTab(session.id, session.title);
  };

  const handleDeleteSession = async (session: Session) => {
    try {
      await deleteSession(session.id);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };


  const handleStatusChange = async (session: Session, newStatus: string) => {
    try {
      const { useSessionsStore } = await import('@/store/sessions');
      await useSessionsStore.getState().updateStatus({ id: session.id, status: newStatus as any });
    } catch (error) {
      console.error('Error updating session status:', error);
      showError('Failed to update session status. Please try again.');
    }
  };


  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() || sortBy !== 'created_at' || sortOrder !== 'desc' || statusFilter !== 'all';

  return (
    <PageTransition>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Library</CardTitle>
                    <CardDescription>
                      {filteredAndSortedSessions.length} of {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                      {hasActiveFilters && ' (filtered)'}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  <ViewToggle view={view} onViewChange={setView} />
                </div>
              </div>

              {/* Search and Filters */}
              <motion.div
                initial={false}
                animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search sessions by title or course..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Sort by:</label>
                      <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Date Created</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="duration_ms">Duration</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Order:</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="w-20"
                      >
                        {sortOrder === 'asc' ? (
                          <>
                            <SortAsc className="w-4 h-4 mr-1" />
                            Asc
                          </>
                        ) : (
                          <>
                            <SortDesc className="w-4 h-4 mr-1" />
                            Desc
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Status:</label>
                      <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <ErrorMessage 
                  message={error}
                  onDismiss={clearError}
                  variant="inline"
                />
              )}
              
              {filteredAndSortedSessions.length === 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">
                      {hasActiveFilters ? 'No sessions match your filters' : 'No sessions yet'}
                    </p>
                    <p className="text-sm">
                      {hasActiveFilters 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first session to get started'
                      }
                    </p>
                  </div>
                </motion.div>
              ) : (
                <SessionList
                  sessions={filteredAndSortedSessions}
                  loading={loading}
                  view={view}
                  onSessionClick={handleSessionClick}
                  onDeleteSession={handleDeleteSession}
                  onStatusChange={handleStatusChange}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}

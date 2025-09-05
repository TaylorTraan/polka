import { useState, useEffect, useRef } from 'react';
import { BookOpen, Star, Plus, Type } from 'lucide-react';
import { Button, Card, CardContent, RichTextEditor } from '@/components';
import FormattingPanel from '../common/FormattingPanel';

interface NotesHighlightsPaneProps {
  isRecording: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export default function NotesHighlightsPane({ 
  isRecording, 
  notes, 
  onNotesChange, 
  onSaveNotes: _onSaveNotes // Keep for interface compatibility but don't use
}: NotesHighlightsPaneProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'highlights'>('notes');
  const [localNotes, setLocalNotes] = useState(notes);
  const [showFormatting, setShowFormatting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Update local notes when notes prop changes
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    onNotesChange(value);
    // Auto-save is now handled by the useAutoSave hook in the parent component
  };

  const tabs = [
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'highlights', label: 'Highlights', icon: Star },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-4">Notes & Highlights</h3>
        
        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {activeTab === 'notes' ? (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Session Notes</h4>
              <Button
                variant={showFormatting ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowFormatting(!showFormatting)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-7 px-2"
                title="Text Formatting"
              >
                <Type className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col">
              {showFormatting && (
                <div className="mb-2">
                  <FormattingPanel editorRef={editorRef} />
                </div>
              )}
              
              <RichTextEditor
                ref={editorRef}
                value={localNotes}
                onChange={handleNotesChange}
                placeholder="Start typing your notes here..."
                className="flex-1"
                style={{ minHeight: '300px' }}
              />
              
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Notes are automatically saved as you type</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Key Highlights</h4>
              <Button
                variant="outline"
                size="sm"
                disabled={!isRecording}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Highlight
              </Button>
            </div>
            
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">
                    {isRecording 
                      ? "Click 'Add Highlight' to mark important moments"
                      : "Start recording to add highlights to your session"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

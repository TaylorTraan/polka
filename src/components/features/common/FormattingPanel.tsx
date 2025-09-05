import React, { useCallback, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Palette, 
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Undo,
  Redo
} from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components';
import { useFormatting } from '@/contexts/FormattingContext';


const FONT_SIZES = [
  '1', '2', '3', '4', '5', '6', '7'
];


const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', value: 'Impact, sans-serif' }
];

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#00CCFF',
  '#0066FF', '#6600FF', '#FF00CC', '#FF0066', '#FFFFFF'
];

const HIGHLIGHT_COLORS = [
  'transparent', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF',
  '#FF6600', '#FFCC00', '#CCFF00', '#00FFCC', '#0066FF',
  '#6600FF', '#FF0066', '#FFCCCC', '#CCFFCC', '#CCFFFF'
];

interface FormattingPanelProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export default function FormattingPanel({ editorRef }: FormattingPanelProps) {
  const { formatting, updateFormatting } = useFormatting();

  // Helper functions
  const preventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };




  // Simple font size application - just use execCommand
  const applyFontSize = useCallback((size: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Apply font size using execCommand directly
    document.execCommand('fontSize', false, size);
    
    // Update UI to show the selected size
    updateFormatting({ fontSize: size });
  }, [updateFormatting]);

  // Step the font size by delta (-1 for A−, +1 for A+)
  const applyRelativeFontSize = useCallback((delta: number) => {
    const currentIdx = FONT_SIZES.indexOf(formatting.fontSize);
    const nextIdx = Math.min(FONT_SIZES.length - 1, Math.max(0, currentIdx + delta));
    const nextSize = FONT_SIZES[nextIdx];
    
    applyFontSize(nextSize);
  }, [applyFontSize, formatting.fontSize]);

  // Apply color to selection or stored mark
  const applyColor = useCallback((color: string) => {
    // Refocus editor to prevent focus loss
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      // Apply to selected text
      const span = document.createElement('span');
      span.style.color = color;
      
      try {
        range.surroundContents(span);
      } catch {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }

      // Always select the wrapped content explicitly
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // For collapsed selection: create span with ZWSP text node
      const span = document.createElement('span');
      span.style.color = color;
      span.setAttribute('data-polka-format', 'color');
      const text = document.createTextNode('\u200B');
      span.appendChild(text);
      range.insertNode(span);
      const caret = document.createRange();
      caret.setStart(text, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      return;
    }
    
    updateFormatting({ textColor: color });
  }, [updateFormatting, editorRef]);

  // Apply highlight color to selection or stored mark
  const applyHighlightColor = useCallback((color: string) => {
    // Refocus editor to prevent focus loss
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // If transparent is selected, remove highlighting by using execCommand
    if (color === 'transparent') {
      if (!range.collapsed) {
        // For selected text, remove background color
        document.execCommand('removeFormat');
        // Re-select the text
        selection.removeAllRanges();
        selection.addRange(range);
      }
      updateFormatting({ highlightColor: color });
      return;
    }
    
    if (!range.collapsed) {
      // Apply to selected text
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      
      try {
        range.surroundContents(span);
      } catch {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }

      // Always select the wrapped content explicitly
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // For collapsed selection: create span with ZWSP text node
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      span.setAttribute('data-polka-format', 'highlight');
      const text = document.createTextNode('\u200B');
      span.appendChild(text);
      range.insertNode(span);
      const caret = document.createRange();
      caret.setStart(text, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      return;
    }
    
    updateFormatting({ highlightColor: color });
  }, [updateFormatting, editorRef]);

  // Handle selection changes to update formatting state
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;

    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
      // Get font size from execCommand state
      const fontSize = document.queryCommandValue('fontSize') || '3';
      
      updateFormatting({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        fontSize: fontSize,
        fontFamily: computedStyle.fontFamily || 'Arial, sans-serif',
        textColor: computedStyle.color || '#000000',
        highlightColor: computedStyle.backgroundColor || 'transparent'
      });
    }
  }, [editorRef]);

  // Formatting commands with immediate state updates
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // Immediately update state for commands that have clear states
    if (command === 'bold') {
      updateFormatting({ bold: !formatting.bold });
    } else if (command === 'italic') {
      updateFormatting({ italic: !formatting.italic });
    } else if (command === 'underline') {
      updateFormatting({ underline: !formatting.underline });
    }
  }, [editorRef, formatting, updateFormatting]);

  // Font family change - simple approach
  const handleFontFamilyChange = useCallback((family: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Use execCommand for font family
    document.execCommand('fontName', false, family);
    
    updateFormatting({ fontFamily: family });
  }, [updateFormatting]);

  // Alignment change
  const handleAlignmentChange = useCallback((alignment: 'left' | 'center' | 'right') => {
    execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1));
    updateFormatting({ alignment });
  }, [execCommand, updateFormatting]);

  // List type change
  const handleListTypeChange = useCallback((listType: 'none' | 'bullet' | 'ordered') => {
    if (listType === 'bullet') {
      execCommand('insertUnorderedList');
    } else if (listType === 'ordered') {
      execCommand('insertOrderedList');
    } else {
      execCommand('outdent');
    }
    updateFormatting({ listType });
  }, [execCommand, updateFormatting]);

  // Set up event listeners for selection changes
  useEffect(() => {
    const handleSelectionChangeEvent = () => {
      handleSelectionChange();
    };

    document.addEventListener('selectionchange', handleSelectionChangeEvent);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChangeEvent);
    };
  }, [handleSelectionChange, updateFormatting]);

  return (
    <div className="flex items-center px-4 py-2 gap-1 flex-wrap border-t bg-muted/30">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('undo')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Undo"
        >
          <Undo className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Redo"
        >
          <Redo className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Font Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={() => applyRelativeFontSize(-1)}
          title="Decrease font size"
        >
          −
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Type className="w-3 h-3 mr-1" />
              {formatting.fontSize}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FONT_SIZES.map(size => (
              <DropdownMenuItem
                key={size}
                onClick={() => {
                  applyFontSize(size);
                }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={formatting.fontSize === size ? 'bg-accent' : ''}
              >
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={() => applyRelativeFontSize(1)}
          title="Increase font size"
        >
          +
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {FONT_FAMILIES.find(f => f.value === formatting.fontFamily)?.name || 'Arial'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FONT_FAMILIES.map(font => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => {
                  handleFontFamilyChange(font.value);
                }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={formatting.fontFamily === font.value ? 'bg-accent' : ''}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant={formatting.bold ? "default" : "ghost"}
          size="sm"
          onClick={() => execCommand('bold')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Bold"
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          variant={formatting.italic ? "default" : "ghost"}
          size="sm"
          onClick={() => execCommand('italic')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Italic"
        >
          <Italic className="w-3 h-3" />
        </Button>
        <Button
          variant={formatting.underline ? "default" : "ghost"}
          size="sm"
          onClick={() => execCommand('underline')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Underline"
        >
          <Underline className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2" 
              title="Text Color"
              onMouseDown={preventBlur}
            >
              <Palette className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-5 gap-1 p-2">
              {TEXT_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border ${
                    formatting.textColor === color ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => applyColor(color)}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  title={color}
                  tabIndex={-1}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2" 
              title="Highlight Color"
              onMouseDown={preventBlur}
            >
              <Highlighter className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="grid grid-cols-5 gap-1 p-2">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border ${
                    formatting.highlightColor === color ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ 
                    backgroundColor: color === 'transparent' ? '#f0f0f0' : color,
                    backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                    backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                    backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined
                  }}
                  onClick={() => applyHighlightColor(color)}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  title={color === 'transparent' ? 'No highlight' : color}
                  tabIndex={-1}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <Button
          variant={formatting.alignment === 'left' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('left')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Align Left"
        >
          <AlignLeft className="w-3 h-3" />
        </Button>
        <Button
          variant={formatting.alignment === 'center' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('center')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Align Center"
        >
          <AlignCenter className="w-3 h-3" />
        </Button>
        <Button
          variant={formatting.alignment === 'right' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAlignmentChange('right')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Align Right"
        >
          <AlignRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <Button
          variant={formatting.listType === 'bullet' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleListTypeChange('bullet')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Bullet List"
        >
          <List className="w-3 h-3" />
        </Button>
        <Button
          variant={formatting.listType === 'ordered' ? "default" : "ghost"}
          size="sm"
          onClick={() => handleListTypeChange('ordered')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Numbered List"
        >
          <ListOrdered className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Additional Formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Quote"
        >
          <Quote className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'pre')}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Code Block"
        >
          <Code className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }}
          onMouseDown={preventBlur}
          className="h-7 px-2"
          title="Insert Link"
        >
          <Link className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

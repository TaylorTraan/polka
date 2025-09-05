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
  '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', 
  '24px', '28px', '32px', '36px', '48px', '72px'
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

  const refocusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const normalizeLineHeight = useCallback((node: Node, root: HTMLElement | null) => {
    let el = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
    while (el && el !== root) {
      if (el.style?.lineHeight) el.style.lineHeight = '';
      el = el.parentElement;
    }
  }, []);

  // Apply font size to selection or stored mark
  const applyFontSize = useCallback((size: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.lineHeight = '';
      span.setAttribute('data-polka-format', 'fontSize');

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

      normalizeLineHeight(span, editorRef.current);
    } else {
      // Collapsed selection: create span with zero-width space and put caret inside it
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.style.lineHeight = '';
      span.setAttribute('data-polka-format', 'fontSize');
      span.innerHTML = '\u200B';

      // Insert span at caret
      range.insertNode(span);

      // Place caret *inside* the span so typing goes into it
      const caret = document.createRange();
      caret.setStart(span, 1); // Position after the zero-width space
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);

      // Normalize line height
      normalizeLineHeight(span, editorRef.current);
    }
    
    updateFormatting({ fontSize: size });
    refocusEditor();
  }, [editorRef, updateFormatting, refocusEditor, normalizeLineHeight]);

  // Apply color to selection or stored mark
  const applyColor = useCallback((color: string) => {
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
      // For collapsed selection: create span with zero-width space
      const span = document.createElement('span');
      span.style.color = color;
      span.innerHTML = '\u200B'; // Zero-width space instead of &nbsp;
      
      range.insertNode(span);
      
      // Place caret inside the span so typing continues with the color
      const caret = document.createRange();
      caret.setStart(span, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
    }
    
    updateFormatting({ textColor: color });
    refocusEditor();
  }, [updateFormatting, refocusEditor]);

  // Apply highlight color to selection or stored mark
  const applyHighlightColor = useCallback((color: string) => {
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
      refocusEditor();
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
      // For collapsed selection: create span with zero-width space
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      span.innerHTML = '\u200B';
      
      range.insertNode(span);
      
      // Place caret inside the span so typing continues with the highlight
      const caret = document.createRange();
      caret.setStart(span, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
    }
    
    updateFormatting({ highlightColor: color });
    refocusEditor();
  }, [updateFormatting, refocusEditor]);

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
      
      updateFormatting({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        fontSize: computedStyle.fontSize || '16px',
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

  // Font family change
  const handleFontFamilyChange = useCallback((family: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      // Apply to selected text
      const span = document.createElement('span');
      span.style.fontFamily = family;
      span.style.lineHeight = '';
      
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

      normalizeLineHeight(span, editorRef.current);
    } else {
      // For collapsed selection: create span with zero-width space
      const span = document.createElement('span');
      span.style.fontFamily = family;
      span.style.lineHeight = '';
      span.innerHTML = '\u200B';

      range.insertNode(span);

      // Place caret inside the span so typing continues with the font
      const caret = document.createRange();
      caret.setStart(span, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);

      normalizeLineHeight(span, editorRef.current);
    }
    updateFormatting({ fontFamily: family });
    refocusEditor();
  }, [editorRef, updateFormatting, refocusEditor, normalizeLineHeight]);

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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Type className="w-3 h-3 mr-1" />
              {formatting.fontSize}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            onPointerDownOutside={(e: any) => e.preventDefault()}
            onFocusOutside={(e: any) => e.preventDefault()}
          >
            {FONT_SIZES.map(size => (
              <DropdownMenuItem
                key={size}
                onSelect={(e) => {
                  e.preventDefault();
                  applyFontSize(size);
                  setTimeout(() => editorRef.current?.focus({ preventScroll: true }), 0);
                }}
                className={formatting.fontSize === size ? 'bg-accent' : ''}
              >
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {FONT_FAMILIES.find(f => f.value === formatting.fontFamily)?.name || 'Arial'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            onPointerDownOutside={(e: any) => e.preventDefault()}
            onFocusOutside={(e: any) => e.preventDefault()}
          >
            {FONT_FAMILIES.map(font => (
              <DropdownMenuItem
                key={font.value}
                onSelect={(e) => {
                  e.preventDefault();
                  handleFontFamilyChange(font.value);
                  setTimeout(() => editorRef.current?.focus({ preventScroll: true }), 0);
                }}
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
                  onMouseDown={preventBlur}
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
                  onMouseDown={preventBlur}
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

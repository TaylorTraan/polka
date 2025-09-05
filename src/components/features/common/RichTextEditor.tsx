import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(({ 
  value, 
  onChange, 
  placeholder = "Start writing your notes...",
  className = "",
  style = {}
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => editorRef.current!);

  // Update editor content when value prop changes
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return; // do not clobber caret
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Clean up empty formatting spans that only contain zero-width spaces
      // But only if they're not at the current cursor position
      const selection = window.getSelection();
      const currentRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      const spans = editorRef.current.querySelectorAll('span[data-polka-format]');
      spans.forEach(span => {
        if (span.textContent === '\u200B' || span.textContent === '') {
          // Don't remove the span if the cursor is currently inside it
          const isCursorInside = currentRange && 
            span.contains(currentRange.startContainer) && 
            span.contains(currentRange.endContainer);
          
          if (!isCursorInside) {
            // If span only contains zero-width space or is empty, remove it
            const parent = span.parentNode;
            if (parent) {
              while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
              }
              parent.removeChild(span);
            }
          }
        }
      });
      
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  return (
    <div className={`rich-text-editor ${className}`} style={style}>
      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full h-full p-6 text-base leading-relaxed outline-none resize-none bg-transparent"
          style={{
            minHeight: 'calc(100vh - 200px)'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      </div>

      <style>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          pointer-events: none;
        }
        
        .rich-text-editor [contenteditable]:focus {
          outline: none;
        }
        
        /* Block-level relative line-height (no inline line-height) */
        .rich-text-editor [contenteditable],
        .rich-text-editor p, .rich-text-editor li, .rich-text-editor blockquote, .rich-text-editor pre {
          line-height: 1.5 !important;
        }
        .rich-text-editor span {
          line-height: inherit !important;
        }
        .rich-text-editor [style*="line-height"] {
          line-height: inherit !important;
        }
        
        /* Ensure consistent spacing for all text elements */
        .rich-text-editor * {
          box-sizing: border-box;
        }
        
        .rich-text-editor blockquote {
          border-left: 4px solid #ddd;
          margin: 0;
          padding-left: 16px;
          color: #666;
          font-style: italic;
          line-height: 1.5 !important;
        }
        
        .rich-text-editor pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
          line-height: 1.5 !important;
        }
        
        .rich-text-editor ul, .rich-text-editor ol {
          padding-left: 20px;
          line-height: 1.5 !important;
        }
        
        .rich-text-editor li {
          margin: 4px 0;
          line-height: 1.5 !important;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;

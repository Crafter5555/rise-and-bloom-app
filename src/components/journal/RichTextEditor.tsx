import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, List, ListOrdered, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  className?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write your thoughts...", 
  tags = [],
  onTagsChange,
  className 
}: RichTextEditorProps) => {
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && onTagsChange) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (onTagsChange) {
      onTagsChange(tags.filter(tag => tag !== tagToRemove));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTag("");
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        {onTagsChange && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTagInput(!showTagInput)}
            className="h-8 px-2 text-xs"
          >
            <Tag className="h-4 w-4 mr-1" />
            Tag
          </Button>
        )}
      </div>

      {/* Tag Input */}
      {showTagInput && onTagsChange && (
        <div className="p-2 border-b bg-muted/20">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={addTag}
              disabled={!newTag.trim()}
              className="h-8"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Tags Display */}
      {tags.length > 0 && onTagsChange && (
        <div className="p-2 border-b bg-muted/10">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1 flex items-center gap-1"
              >
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTag(tag)}
                  className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[120px] p-3 focus:outline-none prose prose-sm max-w-none"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
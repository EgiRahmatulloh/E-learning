import { useRef, useEffect } from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Tulis sesuatu...", className = "" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Update content only when it's different to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`relative flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <select 
          onChange={(e) => executeCommand('fontSize', e.target.value)}
          className="text-sm bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none text-slate-600 cursor-pointer"
        >
          <option value="3">Normal</option>
          <option value="1">Sangat Kecil</option>
          <option value="2">Kecil</option>
          <option value="4">Besar</option>
          <option value="5">Sangat Besar</option>
        </select>
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Rata Kiri"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Rata Tengah"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Rata Kanan"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyFull'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Rata Kiri Kanan"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('insertOrderedList'); }}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[40px] max-h-[300px] overflow-y-auto text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#280f91] focus:ring-inset prose prose-sm max-w-none"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}
      />
      {(!value || value === "<br>") && (
        <div className="pointer-events-none absolute left-0 top-[48px] px-4 py-4 text-sm text-slate-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}

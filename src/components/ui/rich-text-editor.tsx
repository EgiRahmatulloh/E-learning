import { useEffect, useCallback, useState, useRef } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Quote,
  Undo,
  Redo
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis sesuatu...",
  className = "",
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Highlight,
      Typography,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'p-4 min-h-[100px] max-h-[300px] overflow-y-auto text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#280f91] focus:ring-inset prose prose-sm max-w-none',
      },
    },
  });

  // Keep content in sync if value changes externally (like initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleLinkClick = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || "");
    setShowLinkInput(true);
    setTimeout(() => {
      linkInputRef.current?.focus();
    }, 50);
  }, [editor]);

  const saveLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const handleKeyDownLink = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveLink();
    } else if (e.key === 'Escape') {
      setShowLinkInput(false);
    }
  };

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean, 
    icon: any, 
    title: string 
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
        isActive 
          ? 'bg-[#280f91] text-white' 
          : 'hover:bg-slate-200 text-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`relative flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Underline"
        />
        
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          title="Rata Kiri"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          title="Rata Tengah"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          title="Rata Kanan"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={AlignJustify}
          title="Rata Kiri Kanan"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Quote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          icon={Highlighter}
          title="Highlight"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>

        <ToolbarButton
          onClick={handleLinkClick}
          isActive={editor.isActive('link') || showLinkInput}
          icon={LinkIcon}
          title="Link"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          icon={Unlink}
          title="Unlink"
        />

        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={Undo}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={Redo}
          title="Redo"
        />
      </div>

      {showLinkInput && (
        <div className="absolute top-[52px] left-2 z-10 bg-white shadow-lg border border-slate-200 rounded-lg p-2 flex gap-2 items-center">
          <input 
            ref={linkInputRef}
            type="url" 
            placeholder="Masukkan URL..." 
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleKeyDownLink}
            className="border border-slate-200 rounded-md px-2 py-1.5 text-sm w-64 focus:outline-none focus:border-[#280f91]"
          />
          <button 
            onClick={saveLink}
            className="bg-[#280f91] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Simpan
          </button>
          <button 
            onClick={() => setShowLinkInput(false)}
            className="text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      <style>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
      `}</style>
      
      {/* Editor Area */}
      <EditorContent editor={editor} className="flex-1 w-full" />
    </div>
  );
}

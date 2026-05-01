import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
  Bold, Italic, UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Minus, Quote, Link2, Unlink, RotateCcw, RotateCw,
} from 'lucide-react';

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 rounded flex items-center justify-center transition-colors text-sm ${
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        : 'hover:bg-[var(--bg-muted)]'
    } disabled:opacity-30 disabled:cursor-not-allowed`}
    style={{ color: active ? undefined : 'var(--text-secondary)' }}
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange, placeholder = 'İçerik yazın...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Dışarıdan value değişince (tab switch, vb.) editörü güncelle
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL girin:', 'https://');
    if (!url) return;
    try {
      const parsed = new URL(url.startsWith('//') ? `https:${url}` : url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return;
    } catch {
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Kalın (Ctrl+B)"
        >
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="İtalik (Ctrl+I)"
        >
          <Italic size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Altı Çizili (Ctrl+U)"
        >
          <UnderlineIcon size={13} />
        </ToolbarButton>

        <div className="w-px mx-1 self-stretch" style={{ background: 'var(--border)' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Başlık H2"
        >
          <Heading2 size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Başlık H3"
        >
          <Heading3 size={13} />
        </ToolbarButton>

        <div className="w-px mx-1 self-stretch" style={{ background: 'var(--border)' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Madde Listesi"
        >
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numaralı Liste"
        >
          <ListOrdered size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Alıntı"
        >
          <Quote size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Yatay Çizgi"
        >
          <Minus size={13} />
        </ToolbarButton>

        <div className="w-px mx-1 self-stretch" style={{ background: 'var(--border)' }} />

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          title="Bağlantı Ekle"
        >
          <Link2 size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          title="Bağlantıyı Kaldır"
        >
          <Unlink size={13} />
        </ToolbarButton>

        <div className="w-px mx-1 self-stretch" style={{ background: 'var(--border)' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri Al (Ctrl+Z)"
        >
          <RotateCcw size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yinele (Ctrl+Y)"
        >
          <RotateCw size={13} />
        </ToolbarButton>
      </div>

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-48 outline-none"
        style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}
      />
    </div>
  );
}

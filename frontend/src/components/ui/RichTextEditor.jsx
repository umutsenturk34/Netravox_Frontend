import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Bold, Italic, UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Minus, Quote, Link2, Unlink,
  RotateCcw, RotateCw, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Table as TableIcon, Code2, Palette, Check, X,
} from 'lucide-react';

const COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
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
}

function Divider() {
  return <div className="w-px mx-1 self-stretch" style={{ background: 'var(--border)' }} />;
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return { open, setOpen, ref };
}

function ColorPicker({ editor }) {
  const { open, setOpen, ref } = usePopover();
  const [hexInput, setHexInput] = useState('');
  const currentColor = editor.getAttributes('textStyle').color || '';

  function applyHex(raw) {
    const val = raw.trim();
    const full = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9a-fA-F]{6}$/.test(full)) {
      editor.chain().focus().setColor(full).run();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Metin Rengi"
        onClick={() => { setHexInput(currentColor); setOpen((o) => !o); }}
        className="w-7 h-7 rounded flex flex-col items-center justify-center gap-0.5 hover:bg-[var(--bg-muted)] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Palette size={12} />
        <div className="w-4 h-1 rounded-sm" style={{ background: currentColor || 'var(--text-primary)' }} />
      </button>
      {open && (
        <div
          className="absolute top-9 left-0 z-50 rounded-xl shadow-xl border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', width: 148, padding: 10 }}
        >
          {/* Preset swatches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => { editor.chain().focus().setColor(c).run(); setHexInput(c); setOpen(false); }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: c,
                  border: `2px solid ${c === currentColor ? '#3b82f6' : c === '#ffffff' ? '#e5e7eb' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  outline: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            ))}
          </div>

          {/* HEX input */}
          <div
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
          >
            <div
              className="shrink-0 rounded"
              style={{ width: 14, height: 14, background: /^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : 'transparent', border: '1px solid var(--border)' }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => { setHexInput(e.target.value); applyHex(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { applyHex(hexInput); setOpen(false); } }}
              placeholder="#000000"
              maxLength={7}
              className="flex-1 min-w-0 outline-none bg-transparent font-mono"
              style={{ fontSize: 11, color: 'var(--text-primary)', letterSpacing: '0.02em' }}
            />
          </div>

          {/* Rengi kaldır */}
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetColor().run(); setHexInput(''); setOpen(false); }}
            className="w-full text-center rounded-lg hover:bg-[var(--bg-muted)] transition-colors mt-1.5"
            style={{ fontSize: 10, padding: '4px', color: 'var(--text-muted)' }}
          >
            Rengi kaldır
          </button>
        </div>
      )}
    </div>
  );
}

function ImageInput({ editor }) {
  const { open, setOpen, ref } = usePopover();
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  function handleOpen() {
    setUrl('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleConfirm() {
    const trimmed = url.trim();
    if (trimmed) {
      editor.chain().focus().setImage({ src: trimmed }).run();
    }
    setOpen(false);
    setUrl('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') { setOpen(false); setUrl(''); }
  }

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton onClick={handleOpen} title="Görsel Ekle">
        <ImageIcon size={13} />
      </ToolbarButton>
      {open && (
        <div
          className="absolute top-9 z-50 rounded-lg shadow-xl border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            width: 280,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px',
          }}
        >
          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Görsel URL</p>
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              className="flex-1 text-xs rounded border px-2 py-1 outline-none"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleConfirm}
              className="w-7 h-7 rounded flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setUrl(''); }}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = 'İçerik yazın...' }) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (!htmlMode) onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !htmlMode) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleHtmlMode() {
    if (!htmlMode) {
      setRawHtml(editor.getHTML());
      setHtmlMode(true);
    } else {
      const clean = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
      editor.commands.setContent(clean, false);
      onChange(clean);
      setHtmlMode(false);
    }
  }

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

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
      >
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Kalın (Ctrl+B)">
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="İtalik (Ctrl+I)">
          <Italic size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Altı Çizili (Ctrl+U)">
          <UnderlineIcon size={13} />
        </ToolbarButton>
        <ColorPicker editor={editor} />

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Başlık H2">
          <Heading2 size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Başlık H3">
          <Heading3 size={13} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Sola Hizala">
          <AlignLeft size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Ortala">
          <AlignCenter size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Sağa Hizala">
          <AlignRight size={13} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Madde Listesi">
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numaralı Liste">
          <ListOrdered size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Alıntı">
          <Quote size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Yatay Çizgi">
          <Minus size={13} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Bağlantı Ekle">
          <Link2 size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} title="Bağlantıyı Kaldır">
          <Unlink size={13} />
        </ToolbarButton>
        <ImageInput editor={editor} />
        <ToolbarButton onClick={addTable} title="Tablo Ekle">
          <TableIcon size={13} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Geri Al (Ctrl+Z)">
          <RotateCcw size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Yinele (Ctrl+Y)">
          <RotateCw size={13} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={toggleHtmlMode} active={htmlMode} title={htmlMode ? 'WYSIWYG moduna geç' : 'HTML kaynağını düzenle'}>
          <Code2 size={13} />
        </ToolbarButton>
      </div>

      {/* İçerik alanı */}
      {htmlMode ? (
        <div className="relative">
          <textarea
            value={rawHtml}
            onChange={(e) => setRawHtml(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full min-h-48 p-4 font-mono text-xs outline-none resize-y"
            style={{ background: 'var(--bg-base)', color: '#10b981', lineHeight: 1.6 }}
            placeholder="<p>HTML içeriğinizi buraya yazın...</p>"
          />
          <div
            className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded font-mono pointer-events-none"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
          >
            HTML
          </div>
        </div>
      ) : (
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-48 outline-none"
          style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}
        />
      )}
    </div>
  );
}

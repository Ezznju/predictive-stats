'use client';

import { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo2,
  Redo2,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Pilcrow,
  RemoveFormatting,
  TrendingUp,
  Play,
  Twitter,
} from 'lucide-react';

interface RichEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        active
          ? 'bg-brand-amber text-ink'
          : 'text-ink-muted hover:text-ink hover:bg-surface-overlay'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-surface-border mx-1" />;
}

export function RichEditor({ content = '', onChange, placeholder = 'Start writing your article...' }: RichEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-brand-orange underline' },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImageUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageFromDevice = () => {
    imageInputRef.current?.click();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addPolymarketWidget = () => {
    const input = window.prompt(
      'Polymarket slug (from the polymarket.com URL), e.g. "world-cup-winner".\n\n' +
        'Multi-outcome events: just paste the slug.\n' +
        'Single Yes/No market: prefix with "market:", e.g. "market:will-czechia-win-the-2026-fifa-world-cup".'
    );
    if (!input) return;
    const trimmed = input.trim().toLowerCase();
    const isMarket = trimmed.startsWith('market:');
    const slug = (isMarket ? trimmed.slice(7) : trimmed).replace(/^\/+|\/+$/g, '').trim();
    if (!slug) return;
    const shortcode = isMarket ? `[polymarket:${slug}]` : `[polymarket-event:${slug}]`;
    editor.chain().focus().insertContent(`<p>${shortcode}</p>`).run();
  };

  const addYouTubeEmbed = () => {
    const input = window.prompt(
      'Paste a YouTube URL or video ID.\n\n' +
        'Examples:\n' +
        '  https://www.youtube.com/watch?v=dQw4w9WgXcQ\n' +
        '  https://youtu.be/dQw4w9WgXcQ\n' +
        '  dQw4w9WgXcQ'
    );
    if (!input) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    editor.chain().focus().insertContent(`<p>[youtube:${trimmed}]</p>`).run();
  };

  const addTweetEmbed = () => {
    const input = window.prompt(
      'Paste a Twitter/X post URL.\n\n' +
        'Example:\n' +
        '  https://x.com/elonmusk/status/1234567890'
    );
    if (!input) return;
    const trimmed = input.trim();
    if (!/https?:\/\/(twitter|x)\.com\/\w+\/status\/\d+/.test(trimmed)) {
      alert('Please paste a valid Twitter/X post URL (e.g. https://x.com/user/status/123…)');
      return;
    }
    editor.chain().focus().insertContent(`<p>[tweet:${trimmed}]</p>`).run();
  };

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();
  const readTime = Math.max(1, Math.ceil(words / 250));

  return (
    <div className="tiptap-editor border border-surface-border rounded-xl overflow-clip focus-within:border-brand-amber/50 transition-colors bg-surface-raised">
      {/* Toolbar — sticky against page scroll (overflow-clip, unlike
          overflow-hidden, doesn't trap it inside this box) */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-surface-border bg-surface-overlay shadow-sm sticky top-0 z-10">
        {/* Block format */}
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
          <Pilcrow className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">
          <Heading4 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Inline format */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Insert link">
          <Link2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImageFromDevice} title="Upload image from device">
          {uploadingImage ? (
            <span className="block w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </ToolbarButton>
        <ToolbarButton onClick={addImageUrl} title="Insert image from URL">
          <Link2 className="w-4 h-4 rotate-45" />
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f);
            e.target.value = '';
          }}
        />
        <ToolbarButton onClick={addTable} title="Insert table">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addPolymarketWidget} title="Insert live Polymarket odds widget">
          <TrendingUp className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addYouTubeEmbed} title="Embed YouTube video">
          <Play className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addTweetEmbed} title="Embed Twitter/X post">
          <Twitter className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Actions */}
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        {/* Word count */}
        <div className="ml-auto flex items-center gap-4 text-[11px] text-ink-muted">
          <span>{words.toLocaleString()} words</span>
          <span>{chars.toLocaleString()} chars</span>
          <span>~{readTime} min read</span>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Bottom bar */}
      <div className="px-4 py-2 border-t border-surface-border bg-surface-overlay/30 flex flex-wrap gap-4 text-[10px] text-ink-faint">
        <span>Ctrl+B bold · Ctrl+I italic · Ctrl+U underline · Ctrl+Z undo</span>
        <span>Use H2 for main sections, H3 for subsections</span>
      </div>
    </div>
  );
}

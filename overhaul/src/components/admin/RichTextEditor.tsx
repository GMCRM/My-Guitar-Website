'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const RichTextEditor = ({ content, onChange, onImageUpload }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-400 hover:text-orange-300 underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
        style: `
          --tw-prose-body: rgb(255 255 255 / 0.9);
          --tw-prose-headings: rgb(255 255 255);
          --tw-prose-links: rgb(251 146 60);
          --tw-prose-bold: rgb(255 255 255);
          --tw-prose-quotes: rgb(255 255 255 / 0.8);
          --tw-prose-quote-borders: rgb(188 106 27);
          --tw-prose-code: rgb(255 255 255);
        `,
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        try {
          const url = await onImageUpload(file);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    };
    input.click();
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-white border-opacity-20 rounded-lg overflow-hidden" style={{backgroundColor: 'rgba(255,255,255,0.05)'}}>
      {/* Toolbar */}
      <div className="flex items-center space-x-2 p-3 border-b border-white border-opacity-20" style={{backgroundColor: 'rgba(255,255,255,0.05)'}}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('bold') ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          <BoldIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('italic') ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          <ItalicIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white bg-opacity-20"></div>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-2 rounded text-sm font-medium hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-2 rounded text-sm font-medium hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          H3
        </button>

        <div className="w-px h-6 bg-white bg-opacity-20"></div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('bulletList') ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('orderedList') ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">1.</div>
        </button>

        <div className="w-px h-6 bg-white bg-opacity-20"></div>

        <button
          onClick={setLink}
          className={`p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors ${
            editor.isActive('link') ? 'bg-orange-600 text-white' : 'text-white text-opacity-70'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {onImageUpload && (
          <button
            onClick={handleImageUpload}
            className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors text-white text-opacity-70"
          >
            <PhotoIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="text-white bg-transparent"
      />
    </div>
  );
};

export default RichTextEditor;

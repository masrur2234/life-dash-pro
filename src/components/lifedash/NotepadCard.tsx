'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Plus, Trash2, Pin, PinOff, Search, FileText, ArrowLeft, Edit3, Eye, Tag, MoreVertical, X } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { useIsDesktop } from '@/hooks/use-is-desktop';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function MarkdownRenderer({ content, onWikiLink, notes }: { content: string; onWikiLink: (title: string) => void; notes: Note[] }) {
  const noteTitles = notes.map(n => n.title);

  const renderWikiLinks = (text: string) => {
    const parts = text.split(/(<wikilink>.*?<\/wikilink>)/g);
    return parts.map((part, j) => {
      const wikiMatch = part.match(/<wikilink>(.*?)<\/wikilink>/);
      if (wikiMatch) {
        const title = wikiMatch[1];
        const exists = noteTitles.includes(title);
        return (
          <button
            key={j}
            onClick={(e) => { e.preventDefault(); onWikiLink(title); }}
            className={`underline decoration-primary/50 hover:text-primary transition-colors ${
              exists ? 'text-primary font-medium' : 'text-muted-foreground opacity-70'
            }`}
            title={exists ? `Open: ${title}` : `Create: ${title}`}
          >
            {title}
            {!exists && <span className="text-[10px] ml-0.5">+</span>}
          </button>
        );
      }
      return <span key={j}>{part}</span>;
    });
  };

  const processChildren = (children: React.ReactNode) => {
    if (typeof children === 'string') return renderWikiLinks(children);
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === 'string') return <span key={i}>{renderWikiLinks(child)}</span>;
        return child;
      });
    }
    return children;
  };

  const processedContent = content.replace(/\[\[(.+?)\]\]/g, (_match, title: string) => {
    return `<wikilink>${title}</wikilink>`;
  });

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-1 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 text-primary/90">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{processChildren(children)}</p>,
        ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 ml-4 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="text-sm space-y-1 mb-2 ml-4 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{processChildren(children)}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-primary/40 pl-3 py-1 my-2 bg-primary/5 rounded-r-lg text-sm italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-xs font-mono" {...props}>{children}</code>;
          }
          return (
            <pre className="bg-muted/50 rounded-xl p-3 my-2 overflow-x-auto text-xs">
              <code className={className} {...props}>{children}</code>
            </pre>
          );
        },
        hr: () => <hr className="border-border/50 my-3" />,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        input: ({ checked, ...props }) => (
          <input type="checkbox" checked={checked} readOnly className="mr-1.5 accent-primary" {...props} />
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}

export function NotepadCard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const mounted = useIsMounted();
  const isDesktop = useIsDesktop();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotes(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(null);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Derived: selected note
  const selectedNote = notes.find(n => n.id === selectedId) || null;

  // Derived: auto-select first note on desktop
  const effectiveNote = selectedNote ?? (
    isDesktop && mounted && notes.length > 0
      ? (notes.find(n => n.isPinned) || notes[0])
      : null
  );

  // Derived: filtered notes
  function getFilteredNotes() {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      parseTags(n.tags).some(t => t.toLowerCase().includes(q))
    );
  }
  const filteredNotes = getFilteredNotes();

  const createNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: 'Untitled Note' }),
      });
      if (!res.ok) {
        console.error('Failed to create note:', res.status);
        return;
      }
      const note = await res.json();
      if (note && note.id) {
        await fetchNotes();
        setSelectedId(note.id);
        setViewMode('edit');
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setTimeout(() => titleInputRef.current?.focus(), 150);
      }
    } catch (err) {
      console.error('Create note error:', err);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedId(note.id);
    setViewMode('preview');
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleWikiLink = (title: string) => {
    const existing = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      selectNote(existing);
    } else {
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title }),
      }).then(r => r.json()).then(note => {
        if (note.id) {
          fetchNotes();
          setSelectedId(note.id);
          setViewMode('edit');
          setEditTitle(note.title);
          setEditContent('');
        }
      });
    }
  };

  const updateNote = useCallback((field: 'title' | 'content', value: string) => {
    if (!selectedId) return;
    if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current);
    editTimeoutRef.current = setTimeout(() => {
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: selectedId, [field]: value }),
      }).then(() => fetchNotes());
    }, 500);
  }, [selectedId, fetchNotes]);

  const handleContentChange = (value: string) => {
    setEditContent(value);
    updateNote('content', value);
  };

  const handleTitleChange = (value: string) => {
    setEditTitle(value);
    updateNote('title', value);
  };

  const togglePin = async (note: Note) => {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: note.id, isPinned: !note.isPinned }),
    });
    setShowMenu(null);
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    setShowMenu(null);
    if (selectedId === id) {
      setSelectedId(null);
      setViewMode('preview');
    }
    fetchNotes();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (viewMode === 'edit' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent, viewMode]);

  function parseTags(tagsStr: string): string[] {
    try { return JSON.parse(tagsStr || '[]'); } catch { return []; }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (content: string) => {
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[\[(.+?)\]\]/g, '🔗 $1')
      .replace(/- \[[ x]\]/g, '○')
      .replace(/[-*]\s/g, '• ')
      .replace(/\n/g, ' ')
      .slice(0, 80);
  };

  // ===== RENDER NOTE ITEM =====
  const renderNoteItem = (note: Note) => {
    const tags = parseTags(note.tags);
    const isActive = selectedId === note.id;
    return (
      <button
        key={note.id}
        onClick={() => selectNote(note)}
        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'gradient-primary text-white shadow-lg shadow-purple-500/20'
            : 'bg-muted/30 hover:bg-muted/50 active:scale-[0.98]'
        }`}
      >
        <div className="flex items-start gap-2">
          {note.isPinned && (
            <Pin className={`w-3 h-3 mt-0.5 shrink-0 ${isActive ? 'text-white/70' : 'text-amber-400'}`} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold truncate">{note.title}</h4>
              <span className={`text-[10px] shrink-0 ${isActive ? 'text-white/60' : 'text-muted-foreground'}`}>
                {formatDate(note.updatedAt)}
              </span>
            </div>
            <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>
              {getPreview(note.content) || 'Empty note...'}
            </p>
            {tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white/80' : 'bg-primary/10 text-primary/70'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className={`text-[9px] ${isActive ? 'text-white/60' : 'text-muted-foreground'}`}>+{tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ===== NOTE LIST =====
  const renderNoteList = () => (
    <div className="space-y-1.5">
      {filteredNotes.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <Search className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No notes found</p>
        </div>
      )}
      {filteredNotes.length === 0 && !searchQuery && (
        <div className="text-center py-8">
          <FileText className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-2">No notes yet</p>
          <button onClick={(e) => { e.stopPropagation(); createNote(); }} className="text-xs font-medium hover:underline" style={{ color: 'var(--a1)' }}>
            + Create your first note
          </button>
        </div>
      )}
      {filteredNotes.map(renderNoteItem)}
    </div>
  );

  // ===== EDITOR HEADER (shared) =====
  const renderEditorHeader = (note: Note) => (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 glass-card rounded-none">
      {!isDesktop && (
        <button
          onClick={() => { setSelectedId(null); setViewMode('preview'); }}
          className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {viewMode === 'edit' ? (
          <input
            ref={titleInputRef}
            value={editTitle}
            onChange={e => handleTitleChange(e.target.value)}
            className="w-full bg-transparent text-base font-bold outline-none"
            placeholder="Note title..."
          />
        ) : (
          <div>
            <h2 className="text-base font-bold truncate">{note.title}</h2>
            <p className="text-[10px] text-muted-foreground">{formatDate(note.updatedAt)}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            viewMode === 'edit' ? 'bg-primary/20 text-primary' : 'bg-muted/30 hover:bg-muted/50'
          }`}
          title={viewMode === 'edit' ? 'Preview' : 'Edit'}
        >
          {viewMode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(showMenu === note.id ? null : note.id)}
            className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {showMenu === note.id && (
            <div className="absolute right-0 top-10 w-40 glass-card rounded-xl p-1.5 shadow-lg z-20 animate-scale-in">
              <button onClick={() => togglePin(note)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/30 transition-colors">
                {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                {note.isPinned ? 'Unpin' : 'Pin to top'}
              </button>
              <button onClick={() => deleteNote(note.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===== EDITOR CONTENT (shared) =====
  const renderEditorContent = (note: Note) => (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={e => handleContentChange(e.target.value)}
            placeholder={`Start writing... (Markdown supported)

# Header
**bold** *italic*
- list items
> blockquote
[[Link to other note]]

\`\`\`
code block
\`\`\``}
            className="w-full min-h-full bg-transparent text-sm leading-relaxed outline-none resize-none font-mono placeholder:text-muted-foreground/40"
            style={{ minHeight: '100%' }}
          />
        ) : (
          <div className="max-w-none">
            <MarkdownRenderer content={note.content} onWikiLink={handleWikiLink} notes={notes} />
          </div>
        )}
      </div>
      {parseTags(note.tags).length > 0 && viewMode === 'preview' && (
        <div className="px-5 py-2.5 border-t border-border/30 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-muted-foreground" />
          {parseTags(note.tags).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (!mounted) {
    return <div className="glass-card rounded-2xl p-5 h-96 animate-pulse" />;
  }

  // ===== MOBILE: Full-screen editor when note selected =====
  if (!isDesktop && effectiveNote) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
        {renderEditorHeader(effectiveNote)}
        {renderEditorContent(effectiveNote)}
      </div>
    );
  }

  // ===== DESKTOP: Split panel =====
  if (isDesktop) {
    return (
      <div className="glass-card rounded-2xl animate-slide-up stagger-5 flex overflow-hidden" style={{ minHeight: 480 }}>
        {/* Sidebar */}
        <div className="w-[260px] border-r border-border/50 flex flex-col shrink-0">
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--a-icon-bg)' }}>
                <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--a-icon-fg)' }} />
              </div>
              <h3 className="font-semibold text-sm">Notes</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">{notes.length}</span>
              <button
                onClick={createNote}
                className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: 'var(--a-icon-bg)', color: 'var(--a-icon-fg)' }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-muted/30 rounded-lg pl-8 pr-8 py-1.5 text-xs outline-none border border-border/30 focus:border-[var(--a1)]/50 transition-colors placeholder:text-muted-foreground/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {renderNoteList()}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {effectiveNote ? (
            <>
              {/* Compact toolbar for desktop */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                {viewMode === 'edit' ? (
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="flex-1 bg-transparent text-base font-bold outline-none"
                    placeholder="Note title..."
                  />
                ) : (
                  <h2 className="flex-1 text-base font-bold truncate">{effectiveNote.title}</h2>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      viewMode === 'edit' ? 'bg-primary/20 text-primary' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    title={viewMode === 'edit' ? 'Preview' : 'Edit'}
                  >
                    {viewMode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => togglePin(effectiveNote)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      effectiveNote.isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(effectiveNote.id)}
                    className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {renderEditorContent(effectiveNote)}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 opacity-40">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Select a note or create new</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Markdown & [[wiki links]] supported</p>
                <button
                  onClick={createNote}
                  className="mt-4 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ boxShadow: '0 4px 20px var(--a-glow-soft)' }}
                >
                  <Plus className="w-4 h-4 inline mr-1.5" />New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== MOBILE: Card with note list =====
  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up stagger-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--a-icon-bg)' }}>
            <BookOpen className="w-4 h-4" style={{ color: 'var(--a-icon-fg)' }} />
          </div>
          <h3 className="font-semibold text-base">Notes</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">{notes.length}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); createNote(); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'var(--a-icon-bg)', color: 'var(--a-icon-fg)' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-muted/30 rounded-xl pl-9 pr-9 py-2 text-sm outline-none border border-border/30 focus:border-[var(--a1)]/50 transition-colors placeholder:text-muted-foreground/40"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {renderNoteList()}
    </div>
  );
}

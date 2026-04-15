'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Repeat, Plus, X, Pencil, Check, Trash2 } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedDays: string;
}

const EMOJI_OPTIONS = ['🧘', '📚', '💪', '💧', '🏃', '🎯', '✍️', '🎵', '🌱', '💤', '🧹', '🍎', '💊', '🧠', '🚶', '🌅', '📝', '🎨', '💻', '🐕'];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function HabitTrackerCard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const mounted = useIsMounted();
  const [animatingStreak, setAnimatingStreak] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'new' | 'edit'>('new');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHabits = useCallback(() => {
    fetch('/api/habits')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHabits(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const toggleHabit = async (id: string) => {
    if (editingId) return;
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    setAnimatingStreak(id);
    setTimeout(() => setAnimatingStreak(null), 500);
    fetchHabits();
  };

  const addHabit = async () => {
    if (!newName.trim()) return;
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: newName.trim(), icon: newIcon }),
    });
    setNewName('');
    setNewIcon('🎯');
    setShowAddForm(false);
    fetchHabits();
  };

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditIcon(habit.icon);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: editingId, name: editName.trim(), icon: editIcon }),
    });
    setEditingId(null);
    fetchHabits();
  };

  const deleteHabit = async (id: string) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    setDeletingId(null);
    setEditingId(null);
    fetchHabits();
  };

  const selectEmoji = (emoji: string) => {
    if (emojiPickerTarget === 'new') {
      setNewIcon(emoji);
    } else {
      setEditIcon(emoji);
    }
    setShowEmojiPicker(false);
  };

  const last7 = useMemo(() => {
    if (!mounted) return [];
    return getLast7Days();
  }, [mounted]);

  return (
    <div
      className={`glass-card rounded-2xl p-5 animate-slide-up stagger-4 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Repeat className="w-4 h-4 text-pink-400" />
          </div>
          <h3 className="font-semibold text-base">Habit Tracker</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">{habits.length}/15</span>
        </div>
        {!showAddForm && habits.length < 15 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 hover:bg-pink-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add habit form */}
      {showAddForm && (
        <div className="mb-4 p-3 rounded-xl bg-muted/30 animate-scale-in space-y-2">
          <p className="text-xs font-semibold">New Habit</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEmojiPickerTarget('new'); setShowEmojiPicker(true); }}
              className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-xl hover:bg-muted/70 transition-colors shrink-0"
            >
              {newIcon}
            </button>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addHabit();
                if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); }
              }}
              placeholder="Habit name..."
              className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm outline-none border border-border/50 focus:border-pink-500/50 transition-colors"
              autoFocus
            />
            <button
              onClick={addHabit}
              disabled={!newName.trim()}
              className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 hover:bg-pink-500/30 transition-all disabled:opacity-30 shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); }}
              className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="mb-4 p-3 rounded-xl bg-muted/30 animate-scale-in">
          <p className="text-xs font-semibold mb-2">Choose icon</p>
          <div className="grid grid-cols-10 gap-1.5">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => selectEmoji(emoji)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-muted/60 transition-all active:scale-90 ${
                  (emojiPickerTarget === 'new' ? newIcon : editIcon) === emoji ? 'bg-pink-500/20 ring-1 ring-pink-500/50' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-2">
        {last7.length > 0 && habits.map((habit, i) => {
          const completedDays: string[] = JSON.parse(habit.completedDays);
          const isCompletedToday = completedDays.includes(last7[6]);
          const isEditing = editingId === habit.id;
          const isDeleting = deletingId === habit.id;

          return (
            <div
              key={habit.id}
              className="relative"
            >
              {/* Edit form overlay */}
              {isEditing && (
                <div className="p-3 rounded-xl bg-muted/30 animate-scale-in space-y-2">
                  <p className="text-xs font-semibold">Edit Habit</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEmojiPickerTarget('edit'); setShowEmojiPicker(true); }}
                      className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-xl hover:bg-muted/70 transition-colors shrink-0"
                    >
                      {editIcon}
                    </button>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm outline-none border border-border/50 focus:border-pink-500/50 transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      disabled={!editName.trim()}
                      className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-30 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Delete button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDeletingId(habit.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete habit
                    </button>
                  </div>
                  {isDeleting && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-scale-in flex items-center justify-between">
                      <span className="text-xs text-red-400">Delete &quot;{habit.name}&quot; permanently?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 text-xs text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1 rounded-lg bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Normal habit row */}
              {!isEditing && (
                <div
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 transition-all duration-200 hover:bg-muted/50 cursor-pointer active:scale-[0.98]"
                  style={{ transitionDelay: `${i * 0.05}s` }}
                >
                  <span className="text-xl w-8 text-center shrink-0">{habit.icon}</span>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isCompletedToday ? 'text-primary' : ''}`}>
                        {habit.name}
                      </span>
                      <span
                        className={`text-xs font-bold transition-all duration-300 ${
                          animatingStreak === habit.id ? 'scale-125' : 'scale-100'
                        }`}
                      >
                        {habit.streak}🔥
                      </span>
                    </div>

                    <div className="flex gap-1.5 mt-1.5">
                      {last7.map((day) => {
                        const isCompleted = completedDays.includes(day);
                        const isToday = day === last7[6];
                        return (
                          <div
                            key={day}
                            className={`w-5 h-5 rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'gradient-primary shadow-sm'
                                : isToday
                                ? 'border-2 border-pink-500/50 bg-pink-500/10'
                                : 'bg-muted/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isCompletedToday
                        ? 'gradient-primary border-transparent'
                        : 'border-muted-foreground/20'
                    }`}
                  >
                    {isCompletedToday && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Edit button (shows on hover) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(habit); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-foreground hover:bg-muted/60 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {habits.length === 0 && !showAddForm && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-2">No habits yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm font-medium text-pink-400 hover:text-pink-300 transition-colors"
          >
            + Add your first habit
          </button>
        </div>
      )}
    </div>
  );
}

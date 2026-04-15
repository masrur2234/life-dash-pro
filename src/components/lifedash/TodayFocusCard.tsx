'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, X, Check, PartyPopper } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export function TodayFocusCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const mounted = useIsMounted();
  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);

  const fetchTasks = useCallback(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTasks(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleTask = async (id: string, completed: boolean) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, completed }),
    });
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed } : t)));

    if (!completed) {
      const updated = tasks.map(t => t.id === id ? { ...t, completed: true } : t);
      if (updated.length > 0 && updated.every(t => t.completed)) {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 3000);
      }
    }
  };

  const deleteTask = async (id: string) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });
    setNewTaskTitle('');
    setShowInput(false);
    fetchTasks();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && completedCount === tasks.length;

  return (
    <div className={`glass-card rounded-2xl p-5 animate-slide-up stagger-3 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Today&apos;s Focus</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{tasks.length} done</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Progress</span>
            <span className="text-[10px] font-bold gradient-text">{progress}%</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Celebration when all done */}
      {allDone && justCompleted && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-scale-in">
          <PartyPopper className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">All tasks completed! +15 XP</span>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
              task.completed ? 'bg-muted/15 opacity-60' : 'bg-muted/30'
            }`}
          >
            <button
              onClick={() => toggleTask(task.id, !task.completed)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                task.completed
                  ? 'gradient-primary border-transparent'
                  : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
            >
              {task.completed && <Check className="w-3 h-3 text-white" />}
            </button>
            <span className={`flex-1 text-sm transition-all duration-300 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add task input (expanded) */}
      {showInput && (
        <div className="mt-3 animate-scale-in">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTask();
                if (e.key === 'Escape') { setShowInput(false); setNewTaskTitle(''); }
              }}
              placeholder="What do you need to do today?"
              className="flex-1 bg-muted/30 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
              autoFocus
            />
            <button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 disabled:opacity-30"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Press Enter to save, Escape to cancel</p>
        </div>
      )}

      {/* Big Add Task button (no tasks or collapsed) */}
      {!showInput && (
        <button
          onClick={() => setShowInput(true)}
          className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add a task</span>
        </button>
      )}
    </div>
  );
}

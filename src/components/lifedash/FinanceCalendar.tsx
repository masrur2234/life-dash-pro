'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Income', 'Other'];

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`;
  return abs.toString();
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    Food: '🍔', Transport: '🚗', Entertainment: '🎬', Shopping: '🛍️', Bills: '📄', Income: '💰', Other: '📦',
  };
  return icons[cat] || '📦';
}

export function FinanceCalendar() {
  const mounted = useIsMounted();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', category: 'Food', description: '' });

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTransactions(data); })
      .catch(() => {});
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => {
    if (!mounted) return [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [year, month, mounted]);

  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [transactions]);

  const monthName = mounted ? currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectedDayTransactions = selectedDate ? (transactionsByDate[selectedDate] || []) : [];
  const selectedDayTotal = selectedDayTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = async () => {
    const amount = parseFloat(formData.amount);
    if (!amount || !formData.category) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        category: formData.category,
        description: formData.description || null,
      }),
    });
    setFormData({ amount: '', category: 'Food', description: '' });
    setShowAddForm(false);
    const res = await fetch('/api/transactions');
    const data = await res.json();
    if (Array.isArray(data)) setTransactions(data);
  };

  if (!mounted) {
    return <div className="glass-card rounded-2xl p-5 h-80 animate-pulse" />;
  }

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up stagger-7">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-base">Finance Calendar</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-9" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTxns = transactionsByDate[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const totalAmount = dayTxns.reduce((s, t) => s + t.amount, 0);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
              className={`h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-200 relative ${
                isSelected
                  ? 'gradient-primary text-white shadow-md'
                  : isToday
                  ? 'bg-primary/20 text-foreground font-bold'
                  : 'hover:bg-muted/40 text-foreground'
              }`}
            >
              <span>{day}</span>
              {dayTxns.length > 0 && (
                <div className="flex gap-0.5 absolute -bottom-0.5">
                  {totalAmount >= 0 ? (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                  ) : (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-400'}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day transactions */}
      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-border/50 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className={`text-xs font-bold ${selectedDayTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {selectedDayTotal >= 0 ? '+' : '-'}{formatCurrency(selectedDayTotal)}
            </span>
          </div>

          {selectedDayTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No transactions</p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {selectedDayTransactions.map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{getCategoryIcon(t.category)}</span>
                  <span className="text-xs flex-1 truncate">{t.description || t.category}</span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.amount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add transaction form */}
      {showAddForm && (
        <div className="mt-4 pt-3 border-t border-border/50 animate-scale-in space-y-2">
          <p className="text-xs font-semibold mb-2">Add Transaction</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount (e.g. -50000)"
              value={formData.amount}
              onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm outline-none border border-border/50 focus:border-primary/50"
              autoFocus
            />
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="bg-muted/30 rounded-xl px-3 py-2 text-sm outline-none border border-border/50"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm outline-none border border-border/50 focus:border-primary/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTransaction}
              className="flex-1 gradient-primary text-white text-sm font-medium py-2 rounded-xl transition-transform hover:scale-[1.02] active:scale-95"
            >
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 bg-muted/30 text-sm py-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

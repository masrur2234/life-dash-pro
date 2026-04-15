'use client';

import { useEffect, useState } from 'react';
import { Wallet, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface CategoryData {
  name: string;
  spent: number;
  budget: number;
  color: string;
}

const defaultCategories: CategoryData[] = [
  { name: 'Food', spent: 0, budget: 200000, color: '#8B5CF6' },
  { name: 'Transport', spent: 0, budget: 100000, color: '#EC4899' },
  { name: 'Entertainment', spent: 0, budget: 150000, color: '#6366F1' },
];

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000000) return `${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`;
  return abs.toString();
}

function CircularProgress({ percentage, color, size = 48 }: { percentage: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}

export function FinanceCard() {
  const [categories, setCategories] = useState<CategoryData[]>(defaultCategories);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const mounted = useIsMounted();

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => res.json())
      .then((data) => {
        if (data.categorySpending && data.budgets) {
          const updated = defaultCategories.map((cat) => ({
            ...cat,
            spent: data.categorySpending[cat.name] || 0,
            budget: data.budgets[cat.name] || cat.budget,
          }));
          setCategories(updated);
          setTotalSpent(data.totalSpent || 0);
          setTotalIncome(data.totalIncome || 0);
          setNetBalance(data.netBalance || 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`glass-card rounded-2xl p-5 animate-slide-up stagger-1 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-base">Smart Finance</h3>
        </div>
        <span className="text-xs text-muted-foreground">This month</span>
      </div>

      {/* Income vs Expense summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Income</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">+{formatCurrency(totalIncome)}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-red-500/10 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-muted-foreground">Expense</span>
          </div>
          <span className="text-sm font-bold text-red-400">-{formatCurrency(totalSpent)}</span>
        </div>
        <div className={`p-2.5 rounded-xl ${netBalance >= 0 ? 'bg-violet-500/10' : 'bg-red-500/10'} text-center`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Wallet className={`w-3 h-3 ${netBalance >= 0 ? 'text-violet-400' : 'text-red-400'}`} />
            <span className="text-[10px] text-muted-foreground">Net</span>
          </div>
          <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </span>
        </div>
      </div>

      {/* Budget categories */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const pct = Math.min(Math.round((cat.spent / cat.budget) * 100), 100);
          const isWarning = pct >= 80;
          return (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="relative">
                <CircularProgress percentage={mounted ? pct : 0} color={cat.color} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                  {pct}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    {isWarning && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: mounted ? `${pct}%` : '0%',
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useAppStore, type AccentColor } from '@/stores/app-store';
import { useIsMounted } from '@/hooks/use-is-mounted';

const colors: { id: AccentColor; label: string; dot: string; preview: string }[] = [
  { id: 'purple', label: 'Purple', dot: 'bg-purple-500', preview: 'linear-gradient(135deg, #8B5CF6, #6366F1, #EC4899)' },
  { id: 'blue', label: 'Blue', dot: 'bg-blue-500', preview: 'linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)' },
  { id: 'teal', label: 'Teal', dot: 'bg-teal-500', preview: 'linear-gradient(135deg, #14B8A6, #06B6D4, #3B82F6)' },
  { id: 'green', label: 'Green', dot: 'bg-green-500', preview: 'linear-gradient(135deg, #22C55E, #10B981, #06B6D4)' },
  { id: 'orange', label: 'Orange', dot: 'bg-orange-500', preview: 'linear-gradient(135deg, #F97316, #EF4444, #F59E0B)' },
  { id: 'rose', label: 'Rose', dot: 'bg-rose-500', preview: 'linear-gradient(135deg, #F43F5E, #EC4899, #8B5CF6)' },
  { id: 'gray', label: 'Gray', dot: 'bg-gray-500', preview: 'linear-gradient(135deg, #6B7280, #9CA3AF, #4B5563)' },
];

interface AccentColorPickerProps {
  layout?: 'row' | 'grid';
  showLabels?: boolean;
}

export function AccentColorPicker({ layout = 'row', showLabels = false }: AccentColorPickerProps) {
  const { accentColor, setAccentColor } = useAppStore();
  const mounted = useIsMounted();

  if (!mounted) return <div className="flex gap-1.5">{colors.map(() => <div key={Math.random()} className="w-5 h-5 rounded-full bg-muted/30" />)}</div>;

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-4 gap-2">
        {colors.map((c) => {
          const isActive = accentColor === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setAccentColor(c.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-muted/50 ring-2 ring-primary/50' : 'hover:bg-muted/30'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full ${c.dot} ${isActive ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/30' : ''}`}
              />
              <span className={`text-[10px] ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c) => {
        const isActive = accentColor === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setAccentColor(c.id)}
            title={c.label}
            className={`w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${
              isActive ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/40 scale-110' : 'opacity-60 hover:opacity-100'
            }`}
            style={{ background: c.preview }}
          />
        );
      })}
    </div>
  );
}

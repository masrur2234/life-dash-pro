'use client';

import { useState, useRef } from 'react';
import { Send, Mic } from 'lucide-react';

interface AIInputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  isDesktop?: boolean;
}

export function AIInputBar({ onSend, isLoading, isDesktop }: AIInputBarProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={isDesktop ? 'relative mt-5' : 'relative mt-3'}>
      <div className="glass-card flex items-center gap-3 px-4 py-3">
        <Mic className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I spent 25k on coffee... or ask anything about your life"
          className={`bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none ${
            isDesktop ? 'text-base flex-1' : 'text-sm flex-1'
          }`}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

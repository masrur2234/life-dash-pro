'use client';

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface AIChatPanelProps {
  messages: Message[];
  isLoading: boolean;
}

export function AIChatPanel({ messages, isLoading }: AIChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const visibleMessages = messages.slice(-6);

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center animate-pulse-glow">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-base">AI Assistant</h3>
        <span className="text-[10px] text-muted-foreground ml-auto hidden lg:inline">Your life coach</span>
      </div>

      <div className="space-y-3 max-h-64 lg:max-h-80 xl:max-h-96 overflow-y-auto pr-1 flex-1">
        {visibleMessages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">Ask me anything about your life, finances, or habits!</p>
          </div>
        )}

        {visibleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-muted/50'
                  : 'gradient-primary'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3 h-3" />
              ) : (
                <Bot className="w-3 h-3 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'gradient-primary text-white rounded-tr-md'
                  : 'bg-muted/40 rounded-tl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-muted/40 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground/50"
                style={{
                  animation: 'typing-dot 1.4s infinite ease-in-out',
                  animationDelay: '0s',
                }}
              />
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground/50"
                style={{
                  animation: 'typing-dot 1.4s infinite ease-in-out',
                  animationDelay: '0.2s',
                }}
              />
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground/50"
                style={{
                  animation: 'typing-dot 1.4s infinite ease-in-out',
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

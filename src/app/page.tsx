'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useIsDesktop } from '@/hooks/use-is-desktop';

import { GreetingHeader } from '@/components/lifedash/GreetingHeader';
import { AIInputBar } from '@/components/lifedash/AIInputBar';
import { FinanceCard } from '@/components/lifedash/FinanceCard';
import { InsightCard } from '@/components/lifedash/InsightCard';
import { TodayFocusCard } from '@/components/lifedash/TodayFocusCard';
import { HabitTrackerCard } from '@/components/lifedash/HabitTrackerCard';
import { ProductivityScoreCard } from '@/components/lifedash/ProductivityScoreCard';
import { AIChatPanel } from '@/components/lifedash/AIChatPanel';
import { LifeTimeline } from '@/components/lifedash/LifeTimeline';
import { FinanceCalendar } from '@/components/lifedash/FinanceCalendar';
import { NotepadCard } from '@/components/lifedash/NotepadCard';
import { Navigation } from '@/components/lifedash/BottomNav';
import { LoginForm } from '@/components/lifedash/LoginForm';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

// ====== RIGHT PANEL (fixed position, matches sidebar pattern) ======
function RightPanel({ children }: { children: React.ReactNode }) {
  return (
    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 340,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '24px 20px',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.06) 0%, rgba(8, 7, 20, 0.97) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderLeft: '1px solid rgba(139, 92, 246, 0.15)',
      }}
    >
      {children}
    </aside>
  );
}

// ====== LOGIN GATE ======
function LoginGate() {
  const { user, setUser } = useAppStore();

  const handleLogin = (userData: { id: string; name: string; email: string | null; avatar: string | null }) => {
    setUser(userData);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard />;
}

// ====== MAIN DASHBOARD ======
function Dashboard() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { activeTab } = useAppStore();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChatMessages(data);
      })
      .catch(() => {});
  }, []);

  const handleChatSend = useCallback(async (message: string) => {
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (data.response) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      // silently fail
    } finally {
      setIsChatLoading(false);
    }
  }, []);

  // ====== MOBILE CONTENT ======
  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FinanceCard />
            <InsightCard />
            <TodayFocusCard />
            <HabitTrackerCard />
            <AIChatPanel messages={chatMessages} isLoading={isChatLoading} />
          </div>
        );
      case 'finance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FinanceCard />
            <FinanceCalendar />
            <InsightCard />
            <LifeTimeline />
          </div>
        );
      case 'tasks':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TodayFocusCard />
            <HabitTrackerCard />
            <ProductivityScoreCard />
          </div>
        );
      case 'notes':
        return <NotepadCard />;
      case 'insights':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ProductivityScoreCard />
            <InsightCard />
            <LifeTimeline />
          </div>
        );
      case 'profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ProductivityScoreCard />
            <HabitTrackerCard />
            <LifeTimeline />
          </div>
        );
      default:
        return null;
    }
  };

  // ====== RIGHT PANEL CONTENT (per tab) ======
  const renderRightPanel = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <ProductivityScoreCard />
            <AIChatPanel messages={chatMessages} isLoading={isChatLoading} />
          </>
        );
      case 'finance':
        return (
          <>
            <FinanceCalendar />
            <InsightCard />
          </>
        );
      case 'tasks':
        return (
          <>
            <HabitTrackerCard />
            <LifeTimeline />
          </>
        );
      case 'notes':
        return null;
      case 'insights':
        return (
          <>
            <LifeTimeline />
            <AIChatPanel messages={chatMessages} isLoading={isChatLoading} />
          </>
        );
      case 'profile':
        return (
          <>
            <LifeTimeline />
            <AIChatPanel messages={chatMessages} isLoading={isChatLoading} />
          </>
        );
      default:
        return null;
    }
  };

  // ====== DESKTOP CONTENT ======
  const renderDesktopContent = () => {
    const leftStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      overflow: 'visible',
    };

    switch (activeTab) {
      case 'home':
        return (
          <div style={leftStyle}>
            <FinanceCard />
            <InsightCard />
            <FinanceCalendar />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <TodayFocusCard />
              <HabitTrackerCard />
            </div>
          </div>
        );
      case 'finance':
        return (
          <div style={leftStyle}>
            <FinanceCard />
            <LifeTimeline />
          </div>
        );
      case 'tasks':
        return (
          <div style={leftStyle}>
            <TodayFocusCard />
            <ProductivityScoreCard />
          </div>
        );
      case 'notes':
        return <NotepadCard />;
      case 'insights':
        return (
          <div style={leftStyle}>
            <ProductivityScoreCard />
            <InsightCard />
          </div>
        );
      case 'profile':
        return (
          <div style={leftStyle}>
            <ProductivityScoreCard />
            <HabitTrackerCard />
          </div>
        );
      default:
        return null;
    }
  };

  const tabTitles: Record<string, string> = {
    home: '',
    finance: 'Finance Dashboard',
    tasks: 'Task Manager',
    notes: 'My Notes',
    insights: 'AI Insights',
    profile: 'Your Profile',
  };

  const mainStyle: React.CSSProperties = isDesktop
    ? { marginLeft: 240, marginRight: 340, padding: '24px 28px', overflow: 'visible' }
    : { paddingBottom: 80, padding: 16, maxWidth: 512, margin: '0 auto' };

  const rightPanelContent = renderRightPanel();

  return (
    <div style={{ minHeight: '100vh', overflow: 'visible' }}>
      <Navigation />
      {isDesktop && rightPanelContent && <RightPanel>{rightPanelContent}</RightPanel>}
      <main style={mainStyle}>
        {activeTab === 'home' && (
          <div style={{ marginBottom: isDesktop ? 32 : 24 }}>
            <GreetingHeader isDesktop={isDesktop} />
            <AIInputBar isDesktop={isDesktop} onSend={handleChatSend} isLoading={isChatLoading} />
          </div>
        )}

        {activeTab !== 'home' && (
          <div style={{ marginBottom: isDesktop ? 32 : 24 }}>
            <h2 style={{ fontSize: isDesktop ? 30 : 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {tabTitles[activeTab]}
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
              Manage your {activeTab} efficiently
            </p>
          </div>
        )}

        {isDesktop ? renderDesktopContent() : renderMobileContent()}
      </main>
    </div>
  );
}

export default function Home() {
  return <LoginGate />;
}

'use client';

import { Home, Wallet, CheckSquare, BarChart3, User, Sparkles, LogOut, BookOpen, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore, type TabType } from '@/stores/app-store';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useRef, useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/lifedash/ThemeToggle';
import { AccentColorPicker } from '@/components/lifedash/AccentColorPicker';

const tabs: { id: TabType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'finance', icon: Wallet, label: 'Finance' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'notes', icon: BookOpen, label: 'Notes' },
  { id: 'insights', icon: BarChart3, label: 'Insights' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function Navigation() {
  const { activeTab, setActiveTab, user, logout } = useAppStore();
  const mounted = useIsMounted();
  const isDesktop = useIsDesktop();
  const { theme } = useTheme();
  const [showMobileAppearance, setShowMobileAppearance] = useState(false);
  const mobileAppearanceRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  // Close mobile appearance popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileAppearanceRef.current && !mobileAppearanceRef.current.contains(e.target as Node)) {
        setShowMobileAppearance(false);
      }
    };
    if (showMobileAppearance) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMobileAppearance]);

  // Don't render sidebar on server or if mobile
  if (!mounted || !isDesktop) {
    // Only render mobile bottom nav on client (to prevent hydration mismatch)
    if (!mounted) return null;

    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="glass-card rounded-t-2xl border-b-0 px-2 py-2">
            <div className="flex items-center justify-around">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-90 ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {isActive && (
                      <div
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full gradient-primary"
                        style={{ boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)' }}
                      />
                    )}
                    <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </button>
                );
              })}
              {/* Appearance button */}
              <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-2">
                <button
                  onClick={() => setShowMobileAppearance(!showMobileAppearance)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
                    showMobileAppearance ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-medium text-muted-foreground">Theme</span>

                {/* Appearance popup */}
                {showMobileAppearance && (
                  <div
                    ref={mobileAppearanceRef}
                    className="absolute bottom-full right-0 mb-2 w-52 glass-card rounded-2xl p-3 shadow-lg z-50 animate-scale-in"
                    style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold">Appearance</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground mb-2 block">Accent Color</span>
                      <AccentColorPicker layout="grid" showLabels />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // ====== DESKTOP SIDEBAR ======
  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-50 border-r border-border/50 transition-all duration-500 ${
        mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(10, 10, 20, 0.95) 100%)'
          : 'linear-gradient(180deg, rgba(139, 92, 246, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text">LifeDash Pro</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">AI Life Operating System</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'gradient-primary text-white shadow-lg shadow-purple-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Appearance section */}
      <div className="px-4 py-3 border-t border-border/50">
        <div className="px-2 mb-2.5">
          <span className="text-xs font-medium text-muted-foreground">Appearance</span>
        </div>
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="px-2">
          <span className="text-xs text-muted-foreground mb-2 block">Accent Color</span>
          <AccentColorPicker layout="grid" showLabels />
        </div>
      </div>

      {/* User section at bottom */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

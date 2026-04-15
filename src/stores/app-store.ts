import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabType = 'home' | 'finance' | 'tasks' | 'notes' | 'insights' | 'profile';

export type AccentColor = 'purple' | 'blue' | 'teal' | 'green' | 'orange' | 'rose' | 'gray';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
}

interface AppState {
  activeTab: TabType;
  user: UserData | null;
  accentColor: AccentColor;
  setActiveTab: (tab: TabType) => void;
  setUser: (user: UserData | null) => void;
  setAccentColor: (color: AccentColor) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'home',
      user: null,
      accentColor: 'purple',
      setActiveTab: (tab) => set({ activeTab: tab }),
      setUser: (user) => set({ user }),
      setAccentColor: (color) => set({ accentColor: color }),
      logout: () => set({ user: null, activeTab: 'home' }),
    }),
    {
      name: 'lifedash-settings',
      partialize: (state) => ({
        accentColor: state.accentColor,
        user: state.user,
      }),
    }
  )
);

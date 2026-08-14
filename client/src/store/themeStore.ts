import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: true,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
      setDark: (dark) => {
        set({ isDark: dark });
        document.documentElement.classList.toggle("dark", dark);
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle("dark", state.isDark);
        }
      },
    },
  ),
);

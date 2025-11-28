import { create } from "zustand";

interface ThemeState {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",

  toggleTheme: () =>
    set((state) => ({
      mode: state.mode === "light" ? "dark" : "light"
    })),
}));

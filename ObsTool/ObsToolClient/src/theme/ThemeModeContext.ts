import * as React from "react";

export type ThemePreference = "light" | "dark" | "blue";
export type ResolvedThemeMode = "light" | "dark";

export interface IThemeModeContext {
    preference: ThemePreference;
    resolvedMode: ResolvedThemeMode;
    setPreference: (preference: ThemePreference) => void;
}

// Provides a stable fallback for components rendered outside the app-level provider in tests.
export const ThemeModeContext = React.createContext<IThemeModeContext>({
    preference: "light",
    resolvedMode: "light",
    setPreference: () => undefined,
});

export const themePreferenceStorageKey = "obstool.themePreference";

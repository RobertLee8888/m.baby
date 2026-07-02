import type { BrowserRouteState, DetailTab, Motion, Overlay, Screen, SettingsTab } from "./types";

export function createRouteState({
  detailTab,
  history,
  overlay,
  screen,
  settingsTab,
}: {
  detailTab: DetailTab;
  history: Screen[];
  overlay: Overlay;
  screen: Screen;
  settingsTab: SettingsTab;
}): BrowserRouteState {
  return {
    babyDemo: true,
    detailTab,
    history,
    overlay,
    screen,
    settingsTab,
  };
}

export function getBrowserRouteState(): BrowserRouteState | null {
  if (typeof window === "undefined") return null;
  const state = window.history.state as BrowserRouteState | null;
  return state?.babyDemo ? state : null;
}

export function motionFor(from: Screen, to: Screen): Motion {
  if (from === "login" && to === "chat") return "auth";
  if (from === to) return "soft";
  if (to === "sidebar") return "drawer";
  if (from === "sidebar") return "drawerBack";
  return "push";
}

export function writeBrowserState(mode: "push" | "replace", state: BrowserRouteState) {
  if (typeof window === "undefined") return;
  const method = mode === "push" ? "pushState" : "replaceState";
  window.history[method](state, "", window.location.href);
}

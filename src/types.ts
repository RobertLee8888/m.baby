export type Screen =
  | "login"
  | "chat"
  | "sidebar"
  | "sidebarMenu"
  | "playbooks"
  | "recentChats"
  | "explore"
  | "playbookDetail"
  | "chatSelected"
  | "profile"
  | "settings";

export type Overlay = "askAlva" | "infoModal" | null;
export type DetailTab = "overview" | "analytics" | "strategy" | "feed";
export type SettingsTab = "account" | "usage" | "portfolio" | "alvaAgent" | "alerts" | "apiKey";
export type Motion = "auth" | "push" | "back" | "drawer" | "soft";

export type BrowserRouteState = {
  babyDemo: true;
  detailTab: DetailTab;
  history: Screen[];
  overlay: Overlay;
  screen: Screen;
  settingsTab: SettingsTab;
};

export type Playbook = {
  title: string;
  subtitle: string;
  avatar: string;
  cover: string;
  tag?: string;
  stat?: string;
};

export type ChatItem = {
  title: string;
  time: string;
};

export type ExploreItem = {
  title: string;
  desc: string;
  author: string;
  avatar: string;
  cover: string;
  price?: string;
};

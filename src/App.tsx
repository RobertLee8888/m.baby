import { useMemo, useState } from "react";

type Screen =
  | "login"
  | "chat"
  | "sidebar"
  | "playbooks"
  | "recentChats"
  | "explore"
  | "playbookDetail"
  | "chatSelected"
  | "profile";

type Overlay = "askAlva" | "infoModal" | null;
type Direction = "forward" | "back" | "overlay";

type ScreenMeta = {
  src: string;
  height: number;
  label: string;
  scroll?: boolean;
};

type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: () => void;
};

const DESIGN_WIDTH = 393;

const screens: Record<Screen | Exclude<Overlay, null>, ScreenMeta> = {
  login: { src: "/screens/login.png", height: 852, label: "Login" },
  chat: { src: "/screens/chat.png", height: 852, label: "Alva Agent chat" },
  sidebar: { src: "/screens/sidebar.png", height: 1313, label: "Sidebar", scroll: true },
  playbooks: { src: "/screens/playbooks.png", height: 852, label: "Playbooks" },
  recentChats: { src: "/screens/recent-chats.png", height: 852, label: "Recent Chats" },
  explore: { src: "/screens/explore.png", height: 852, label: "Explore" },
  playbookDetail: { src: "/screens/playbook-detail.png", height: 852, label: "Playbook detail" },
  chatSelected: { src: "/screens/chat-selected.png", height: 852, label: "Selected chat" },
  profile: { src: "/screens/profile.png", height: 852, label: "Profile" },
  askAlva: { src: "/screens/ask-alva-overlay.png", height: 852, label: "Ask Alva overlay" },
  infoModal: { src: "/screens/info-modal.png", height: 852, label: "Info modal" },
};

function HotspotButton({ hotspot, frameHeight }: { hotspot: Hotspot; frameHeight: number }) {
  const style = {
    left: `${(hotspot.x / DESIGN_WIDTH) * 100}%`,
    top: `${(hotspot.y / frameHeight) * 100}%`,
    width: `${(hotspot.width / DESIGN_WIDTH) * 100}%`,
    height: `${(hotspot.height / frameHeight) * 100}%`,
  };

  return (
    <button
      aria-label={hotspot.label}
      className="hotspot"
      data-hotspot={hotspot.id}
      onClick={(event) => {
        event.stopPropagation();
        hotspot.action();
      }}
      style={style}
      type="button"
    />
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const [animationTick, setAnimationTick] = useState(0);

  const navigate = (next: Screen, nextDirection: Direction = "forward") => {
    setOverlay(null);
    setHistory((items) => [...items, screen]);
    setDirection(nextDirection);
    setAnimationTick((value) => value + 1);
    setScreen(next);
  };

  const replace = (next: Screen, nextDirection: Direction = "forward") => {
    setOverlay(null);
    setDirection(nextDirection);
    setAnimationTick((value) => value + 1);
    setScreen(next);
  };

  const backTo = (fallback: Screen = "sidebar") => {
    setOverlay(null);
    setHistory((items) => {
      const nextHistory = [...items];
      const previous = nextHistory.pop() ?? fallback;
      setDirection("back");
      setAnimationTick((value) => value + 1);
      setScreen(previous);
      return nextHistory;
    });
  };

  const openOverlay = (nextOverlay: Exclude<Overlay, null>) => {
    setDirection("overlay");
    setOverlay(nextOverlay);
    setAnimationTick((value) => value + 1);
  };

  const closeOverlay = () => {
    setDirection("back");
    setOverlay(null);
    setAnimationTick((value) => value + 1);
  };

  const viewKey = overlay ?? screen;
  const meta = screens[viewKey];

  const hotspots = useMemo<Hotspot[]>(() => {
    if (overlay === "askAlva") {
      return [
        { id: "ask-close", label: "Close Ask Alva", x: 0, y: 110, width: 55, height: 70, action: closeOverlay },
      ];
    }

    if (overlay === "infoModal") {
      return [
        { id: "info-close", label: "Close information modal", x: 324, y: 258, width: 54, height: 62, action: closeOverlay },
        { id: "info-backdrop", label: "Close information modal backdrop", x: 0, y: 0, width: 393, height: 852, action: closeOverlay },
      ];
    }

    switch (screen) {
      case "login":
        return [
          { id: "login-anywhere", label: "Complete login", x: 0, y: 0, width: 393, height: 852, action: () => replace("chat") },
        ];
      case "chat":
        return [
          { id: "chat-menu", label: "Open sidebar", x: 0, y: 123, width: 56, height: 56, action: () => navigate("sidebar") },
        ];
      case "sidebar":
        return [
          { id: "sidebar-avatar", label: "Open profile", x: 338, y: 128, width: 48, height: 52, action: () => navigate("profile") },
          { id: "sidebar-explore", label: "Open Explore", x: 0, y: 258, width: 190, height: 58, action: () => navigate("explore") },
          { id: "sidebar-playbooks-all", label: "View all playbooks", x: 313, y: 466, width: 78, height: 45, action: () => navigate("playbooks") },
          { id: "sidebar-recent-all", label: "View all recent chats", x: 313, y: 815, width: 78, height: 45, action: () => navigate("recentChats") },
          { id: "sidebar-playbook-1", label: "Open Investor Roundtable", x: 0, y: 502, width: 393, height: 61, action: () => navigate("playbookDetail") },
          { id: "sidebar-playbook-2", label: "Open LAB Short War Room", x: 0, y: 563, width: 393, height: 61, action: () => navigate("playbookDetail") },
          { id: "sidebar-playbook-3", label: "Open Citrini Operating System", x: 0, y: 624, width: 393, height: 61, action: () => navigate("playbookDetail") },
          { id: "sidebar-playbook-4", label: "Open Theme Tracker", x: 0, y: 685, width: 393, height: 61, action: () => navigate("playbookDetail") },
          { id: "sidebar-playbook-5", label: "Open BTC Bet Scanner", x: 0, y: 746, width: 393, height: 61, action: () => navigate("playbookDetail") },
          { id: "sidebar-chat-1", label: "Open Crypto Price chat", x: 0, y: 894, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-2", label: "Open AVGO chat", x: 0, y: 944, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-3", label: "Open Macro rates chat", x: 0, y: 995, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-4", label: "Open Semis chat", x: 0, y: 1046, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-5", label: "Open NVDA chat", x: 0, y: 1097, width: 393, height: 49, action: () => navigate("chatSelected") },
        ];
      case "playbooks":
        return [
          { id: "playbooks-back", label: "Back to sidebar", x: 0, y: 62, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "playbooks-item-1", label: "Open Investor Roundtable", x: 0, y: 193, width: 393, height: 62, action: () => navigate("playbookDetail") },
          { id: "playbooks-item-2", label: "Open LAB Short War Room", x: 0, y: 254, width: 393, height: 62, action: () => navigate("playbookDetail") },
          { id: "playbooks-item-3", label: "Open Citrini Operating System", x: 0, y: 315, width: 393, height: 62, action: () => navigate("playbookDetail") },
          { id: "playbooks-item-4", label: "Open Theme Tracker", x: 0, y: 376, width: 393, height: 62, action: () => navigate("playbookDetail") },
          { id: "playbooks-item-5", label: "Open BTC Bet Scanner", x: 0, y: 437, width: 393, height: 62, action: () => navigate("playbookDetail") },
        ];
      case "recentChats":
        return [
          { id: "recent-back", label: "Back to sidebar", x: 0, y: 62, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "recent-chat-1", label: "Open Crypto Price chat", x: 0, y: 167, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-2", label: "Open AVGO chat", x: 0, y: 217, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-3", label: "Open Macro rates chat", x: 0, y: 267, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-4", label: "Open Semis chat", x: 0, y: 317, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-5", label: "Open NVDA chat", x: 0, y: 367, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-6", label: "Open AI infra chat", x: 0, y: 417, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-7", label: "Open FOMC chat", x: 0, y: 467, width: 393, height: 50, action: () => navigate("chatSelected") },
        ];
      case "explore":
        return [
          { id: "explore-menu", label: "Open sidebar", x: 0, y: 59, width: 56, height: 56, action: () => navigate("sidebar", "back") },
          { id: "explore-card-1", label: "Open BTC Ultimate AI Trader", x: 0, y: 196, width: 393, height: 115, action: () => navigate("playbookDetail") },
          { id: "explore-card-2", label: "Open MAG7 Equal-Weight", x: 0, y: 311, width: 393, height: 115, action: () => navigate("playbookDetail") },
          { id: "explore-card-3", label: "Open PEPE Long vs BTC Short", x: 0, y: 426, width: 393, height: 115, action: () => navigate("playbookDetail") },
          { id: "explore-card-4", label: "Open Attribution Analysis", x: 0, y: 541, width: 393, height: 115, action: () => navigate("playbookDetail") },
          { id: "explore-card-5", label: "Open BTC MACD crossover", x: 0, y: 656, width: 393, height: 70, action: () => navigate("playbookDetail") },
        ];
      case "playbookDetail":
        return [
          { id: "detail-back", label: "Back", x: 0, y: 124, width: 48, height: 48, action: () => backTo("sidebar") },
          { id: "detail-info", label: "Open playbook info", x: 260, y: 124, width: 42, height: 48, action: () => openOverlay("infoModal") },
          { id: "detail-ask-alva", label: "Ask Alva", x: 34, y: 650, width: 84, height: 58, action: () => openOverlay("askAlva") },
        ];
      case "chatSelected":
        return [
          { id: "selected-back", label: "Back", x: 0, y: 124, width: 48, height: 48, action: () => backTo("sidebar") },
        ];
      case "profile":
        return [
          { id: "profile-back", label: "Back to sidebar", x: 0, y: 65, width: 56, height: 56, action: () => backTo("sidebar") },
        ];
      default:
        return [];
    }
  }, [screen, overlay]);

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className="mobile-shell" aria-label="m.baby mobile demo">
        <div
          className={`screen-frame ${meta.scroll ? "screen-frame-scroll" : ""}`}
          data-current-view={viewKey}
          data-screen-height={meta.height}
        >
          <div
            className={`screen-visual enter-${direction}`}
            key={`${viewKey}-${animationTick}`}
            style={{ "--screen-height": `${meta.height}px` } as React.CSSProperties}
          >
            <img alt={meta.label} className="screen-image" draggable={false} src={meta.src} />
            <div className="hotspot-layer">
              {hotspots.map((hotspot) => (
                <HotspotButton frameHeight={meta.height} hotspot={hotspot} key={hotspot.id} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

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
type DetailTab = "overview" | "analytics" | "strategy" | "feed";

type Narrative = {
  title: string;
  summary: string;
  details: string[];
};

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
const DETAIL_TOP_HEIGHT = 179;
const DETAIL_FOOTER_VIEWPORT_Y = 632;
const DETAIL_FOOTER_HEIGHT = 220;

const detailTabs: Record<DetailTab, { src: string; height: number; label: string; narrative: Narrative }> = {
  overview: {
    src: "/screens/detail-tabs/overview.png",
    height: 2218,
    label: "Overview",
    narrative: {
      title: "Quality Value Stock Screener detail: Overview",
      summary: "Overview tab content from the supplied Figma frame with creator, metrics, equity curve, returns, and drawdown modules.",
      details: [
        "Top chrome and fixed bottom actions remain aligned to the original mobile detail frame.",
        "The Overview content area is the 393 by 2218 export from Figma node 9949:133037.",
      ],
    },
  },
  analytics: {
    src: "/screens/detail-tabs/analytics.png",
    height: 1644,
    label: "Analytics",
    narrative: {
      title: "Quality Value Stock Screener detail: Analytics",
      summary: "Analytics tab content from the supplied Figma frame with return, risk, and distribution analysis.",
      details: [
        "The Analytics content area is the 393 by 1644 export from Figma node 9949:133040.",
        "Tab switching keeps the same playbook shell and resets the scroll position to the top.",
      ],
    },
  },
  strategy: {
    src: "/screens/detail-tabs/strategy.png",
    height: 1112,
    label: "Strategy",
    narrative: {
      title: "Quality Value Stock Screener detail: Strategy",
      summary: "Strategy tab content from the supplied Figma frame with objective and strategy copy blocks.",
      details: [
        "The Strategy content area is the 393 by 1112 export from Figma node 9949:133039.",
        "The fixed Ask Alva, Remix, Trade, and Subscribe action area stays available over the tab content.",
      ],
    },
  },
  feed: {
    src: "/screens/detail-tabs/feed.png",
    height: 1956,
    label: "Feed",
    narrative: {
      title: "Quality Value Stock Screener detail: Feed",
      summary: "Feed tab content from the supplied Figma frame with playbook updates and market posts.",
      details: [
        "The Feed content area is the 393 by 1956 export from Figma node 9949:133038.",
        "The tab content scrolls behind the fixed bottom shell to match the mobile composition.",
      ],
    },
  },
};

const detailTabHitAreas: Array<{ tab: DetailTab; x: number; width: number }> = [
  { tab: "overview", x: 0, width: 98 },
  { tab: "analytics", x: 98, width: 98 },
  { tab: "strategy", x: 196, width: 98 },
  { tab: "feed", x: 294, width: 99 },
];

const screenNarratives: Record<Screen | Exclude<Overlay, null>, Narrative> = {
  login: {
    title: "Login",
    summary: "Alva login screen with email, Google, X, Telegram, Discord, and Cloudflare verification options.",
    details: [
      "Slogan: Turn ideas into live investing playbooks in minutes.",
      "Offer: sign up to unlock 3-day Pro, 8 dollars credits, and full data access.",
    ],
  },
  chat: {
    title: "Alva Agent chat",
    summary: "Chat tab showing a FinTwit Digest setup conversation and delivery destination options.",
    details: [
      "User request: create today's FinTwit Digest from a chosen FinTwit list.",
      "Alva answer includes a Daily Digest market report summary and Telegram, Discord, WhatsApp actions.",
    ],
  },
  sidebar: {
    title: "Sidebar",
    summary: "Navigation menu with upgrade banner, Explore, Portfolio, Alva Skill, FinTwit Alpha League, playbooks, chats, and Ask Alva.",
    details: [
      "Playbooks include Investor Roundtable, LAB Short War Room, Citrini Operating System, Theme Tracker Humanoid Robots, and BTC Bet Scanner.",
      "Recent chats include Crypto Price plus AI Trend Pulse, AVGO earnings recap, Macro and rates this week, Semis versus power-grid rotation, and NVDA options flow check.",
    ],
  },
  playbooks: {
    title: "Playbooks",
    summary: "Playbooks list with All, Subscribed, and Created tabs plus status filters.",
    details: [
      "Visible playbooks include Investor Roundtable, LAB Short War Room, Citrini Operating System, Theme Tracker Humanoid Robots, and BTC Bet Scanner.",
    ],
  },
  recentChats: {
    title: "Recent Chats",
    summary: "Recent chat list with a New Chat button and timestamped market conversation threads.",
    details: [
      "Visible chats include Crypto Price plus AI Trend Pulse, AVGO earnings recap, Macro and rates this week, Semis versus power-grid rotation, NVDA options flow check, AI infra shipment watch, and FOMC liquidity map.",
    ],
  },
  explore: {
    title: "Explore",
    summary: "Explore feed with category chips and market playbook cards.",
    details: [
      "Cards include BTC Ultimate AI Trader, MAG7 Equal-Weight Monthly Rebalance, PEPE Long versus BTC Short Monitoring, Attribution Analysis Strategy, and BTC MACD 1h Simple Crossover.",
    ],
  },
  playbookDetail: {
    title: "Quality Value Stock Screener detail",
    summary: "Playbook detail with Overview, Analytics, Strategy, and Feed tab content from the supplied Figma frame.",
    details: [
      "The tab content area uses the four direct exports from Figma node 9949:133034.",
      "Floating actions include Ask Alva, Remix, Trade, and Subscribe.",
    ],
  },
  chatSelected: {
    title: "Daily FinTwit Digest chat",
    summary: "Selected chat thread for Daily FinTwit Digest scheduling.",
    details: [
      "Alva asks whether to deliver the digest automatically each morning.",
      "User confirms Telegram delivery daily at 7:30 AM, then Alva confirms the schedule.",
    ],
  },
  profile: {
    title: "Profile",
    summary: "Profile page for sheer with Pro and Annual badges, usage balance, referral, creator earnings, language, settings, and logout.",
    details: [
      "Available usage balance is 12,000, with daily, monthly, and pack limits shown.",
    ],
  },
  askAlva: {
    title: "Ask Alva overlay",
    summary: "Bottom chat overlay opened from the playbook detail page.",
    details: [
      "Overlay shows Daily FinTwit Digest chat with controls for close, new chat, expand, attachment chip, and message input.",
    ],
  },
  infoModal: {
    title: "Playbook information modal",
    summary: "Centered modal describing Quality Value Stock Screener with owner, tags, automations, metrics, and description.",
    details: [
      "Metrics include 2.6K views, 24 comments, 12 remix, and 138 subscribed.",
      "Description explains AI infrastructure investment thesis tracking across silicon, networking, hyperscalers, power, and data centers.",
    ],
  },
};

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

function DetailScreen({
  animationTick,
  direction,
  onAskAlva,
  onBack,
  onInfo,
  onSelectTab,
  tab,
}: {
  animationTick: number;
  direction: Direction;
  onAskAlva: () => void;
  onBack: () => void;
  onInfo: () => void;
  onSelectTab: (tab: DetailTab) => void;
  tab: DetailTab;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTab = detailTabs[tab];
  const detailHeight = DETAIL_TOP_HEIGHT + activeTab.height + DETAIL_FOOTER_HEIGHT;
  const narrative = activeTab.narrative;
  const style = {
    "--detail-total-height": `${detailHeight}px`,
    "--detail-content-height": `${activeTab.height}px`,
  } as CSSProperties;

  const contentHotspots: Hotspot[] = [
    { id: "detail-back", label: "Back", x: 0, y: 124, width: 48, height: 48, action: onBack },
    { id: "detail-info", label: "Open playbook info", x: 260, y: 124, width: 42, height: 48, action: onInfo },
    ...detailTabHitAreas.map(({ tab: nextTab, x, width }) => ({
      id: `detail-tab-${nextTab}`,
      label: `Show ${detailTabs[nextTab].label}`,
      x,
      y: DETAIL_TOP_HEIGHT,
      width,
      height: 46,
      action: () => {
        scrollRef.current?.scrollTo(0, 0);
        onSelectTab(nextTab);
      },
    })),
  ];

  const fixedHotspots: Hotspot[] = [
    { id: "detail-ask-alva", label: "Ask Alva", x: 34, y: DETAIL_FOOTER_VIEWPORT_Y + 18, width: 84, height: 58, action: onAskAlva },
  ];

  return (
    <div className="detail-frame" data-current-detail-tab={tab}>
      <div className="sr-only" aria-live="polite">
        <h1>{narrative.title}</h1>
        <p>{narrative.summary}</p>
        <ul>
          {narrative.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <p>
          Available actions: Back, Open playbook info, Show Overview, Show Analytics, Show Strategy, Show Feed, Ask Alva.
        </p>
      </div>

      <div className="detail-scroll" ref={scrollRef}>
        <div className={`detail-scroll-content enter-${direction}`} key={`${tab}-${animationTick}`} style={style}>
          <img alt="" aria-hidden="true" className="detail-shell-top" draggable={false} src="/screens/detail-shell-top.png" />
          <img alt="" aria-hidden="true" className="detail-tab-content" draggable={false} src={activeTab.src} />
          <div className="hotspot-layer detail-content-hotspots">
            {contentHotspots.map((hotspot) => (
              <HotspotButton frameHeight={detailHeight} hotspot={hotspot} key={hotspot.id} />
            ))}
          </div>
        </div>
      </div>

      <img alt="" aria-hidden="true" className="detail-shell-footer" draggable={false} src="/screens/detail-shell-footer.png" />
      <div className="hotspot-layer detail-fixed-hotspots">
        {fixedHotspots.map((hotspot) => (
          <HotspotButton frameHeight={852} hotspot={hotspot} key={hotspot.id} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const [animationTick, setAnimationTick] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

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

  const openDetail = () => {
    setDetailTab("overview");
    navigate("playbookDetail");
  };

  const selectDetailTab = (nextTab: DetailTab) => {
    if (nextTab === detailTab) {
      return;
    }

    setDirection("forward");
    setDetailTab(nextTab);
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
          { id: "sidebar-playbook-1", label: "Open Investor Roundtable", x: 0, y: 502, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-2", label: "Open LAB Short War Room", x: 0, y: 563, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-3", label: "Open Citrini Operating System", x: 0, y: 624, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-4", label: "Open Theme Tracker", x: 0, y: 685, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-5", label: "Open BTC Bet Scanner", x: 0, y: 746, width: 393, height: 61, action: openDetail },
          { id: "sidebar-chat-1", label: "Open Crypto Price chat", x: 0, y: 894, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-2", label: "Open AVGO chat", x: 0, y: 944, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-3", label: "Open Macro rates chat", x: 0, y: 995, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-4", label: "Open Semis chat", x: 0, y: 1046, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-5", label: "Open NVDA chat", x: 0, y: 1097, width: 393, height: 49, action: () => navigate("chatSelected") },
        ];
      case "playbooks":
        return [
          { id: "playbooks-back", label: "Back to sidebar", x: 0, y: 62, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "playbooks-item-1", label: "Open Investor Roundtable", x: 0, y: 193, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-2", label: "Open LAB Short War Room", x: 0, y: 254, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-3", label: "Open Citrini Operating System", x: 0, y: 315, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-4", label: "Open Theme Tracker", x: 0, y: 376, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-5", label: "Open BTC Bet Scanner", x: 0, y: 437, width: 393, height: 62, action: openDetail },
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
          { id: "explore-card-1", label: "Open BTC Ultimate AI Trader", x: 0, y: 196, width: 393, height: 115, action: openDetail },
          { id: "explore-card-2", label: "Open MAG7 Equal-Weight", x: 0, y: 311, width: 393, height: 115, action: openDetail },
          { id: "explore-card-3", label: "Open PEPE Long vs BTC Short", x: 0, y: 426, width: 393, height: 115, action: openDetail },
          { id: "explore-card-4", label: "Open Attribution Analysis", x: 0, y: 541, width: 393, height: 115, action: openDetail },
          { id: "explore-card-5", label: "Open BTC MACD crossover", x: 0, y: 656, width: 393, height: 70, action: openDetail },
        ];
      case "playbookDetail":
        return [];
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
  }, [screen, overlay, detailTab]);

  const narrative = screenNarratives[viewKey];

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className="mobile-shell" aria-label="m.baby mobile demo">
        <div className={`screen-frame ${meta.scroll ? "screen-frame-scroll" : ""}`} data-current-view={viewKey} data-screen-height={meta.height}>
          {screen === "playbookDetail" && overlay === null ? (
            <DetailScreen
              animationTick={animationTick}
              direction={direction}
              onAskAlva={() => openOverlay("askAlva")}
              onBack={() => backTo("sidebar")}
              onInfo={() => openOverlay("infoModal")}
              onSelectTab={selectDetailTab}
              tab={detailTab}
            />
          ) : (
            <div
              className={`screen-visual enter-${direction}`}
              key={`${viewKey}-${animationTick}`}
              style={{ "--screen-height": `${meta.height}px` } as CSSProperties}
            >
              <div className="sr-only" aria-live="polite">
                <h1>{narrative.title}</h1>
                <p>{narrative.summary}</p>
                <ul>
                  {narrative.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <p>Available actions: {hotspots.map((hotspot) => hotspot.label).join(", ")}.</p>
              </div>
              <img alt="" aria-hidden="true" className="screen-image" draggable={false} src={meta.src} />
              <div className="hotspot-layer">
                {hotspots.map((hotspot) => (
                  <HotspotButton frameHeight={meta.height} hotspot={hotspot} key={hotspot.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

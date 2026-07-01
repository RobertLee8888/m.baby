import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronDown, Eye, Info, Lock, MoreHorizontal, Repeat2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Screen =
  "login" | "chat" | "sidebar" | "sidebarMenu" | "playbooks" | "recentChats" | "explore" | "playbookDetail" | "chatSelected" | "profile" | "settings";

type Overlay = "askAlva" | "infoModal" | null;
type DetailTab = "overview" | "analytics" | "strategy" | "feed";
type SettingsTab = "account" | "usage" | "portfolio" | "alvaAgent" | "alerts" | "apiKey";
type Motion = "auth" | "push" | "back" | "drawer" | "soft";

type BrowserRouteState = {
  babyDemo: true;
  detailTab: DetailTab;
  history: Screen[];
  overlay: Overlay;
  screen: Screen;
  settingsTab: SettingsTab;
};

type Playbook = {
  title: string;
  subtitle: string;
  avatar: string;
  cover: string;
  tag?: string;
  stat?: string;
};

type ChatItem = {
  title: string;
  time: string;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
const MIN_MOBILE_STAGE_WIDTH = 360;

const getVisualViewportSize = () => {
  if (typeof window === "undefined") return { height: 852, width: 393 };

  const visualViewport = window.visualViewport;
  return {
    height: visualViewport?.height ?? window.innerHeight,
    width: visualViewport?.width ?? window.innerWidth,
  };
};

const playbooks: Playbook[] = [
  {
    title: "Investor Roundtable",
    subtitle: "Ten legendary investors debate any stock - live verdict",
    avatar: asset("assets/figma/sidebar-playbook-1.png"),
    cover: asset("assets/covers/cover-roundtable.webp"),
    tag: "Debate",
    stat: "2.6K",
  },
  {
    title: "LAB Short War Room",
    subtitle: "Live short-seller console for LABUSDT - squeeze risk",
    avatar: asset("assets/figma/sidebar-playbook-2.png"),
    cover: asset("assets/covers/cover-lab.webp"),
    tag: "Crypto",
    stat: "1.8K",
  },
  {
    title: "Citrini Operating System",
    subtitle: "Six modules - live macro indicators + megatrend tracker",
    avatar: asset("assets/figma/sidebar-playbook-3.png"),
    cover: asset("assets/covers/cover-citrini.webp"),
    tag: "Macro",
    stat: "9.1K",
  },
  {
    title: "Theme Tracker - Humanoid Robots",
    subtitle: "75 names across 9 supply-chain layers, scored daily",
    avatar: asset("assets/figma/sidebar-playbook-4.png"),
    cover: asset("assets/covers/cover-btcprice.webp"),
    tag: "Theme",
    stat: "3.2K",
  },
  {
    title: "BTC Bet Scanner",
    subtitle: "Polymarket BTC daily-close - 4-way probability blend",
    avatar: asset("assets/figma/sidebar-playbook-5.png"),
    cover: asset("assets/covers/cover-btcbet.webp"),
    tag: "Polymarket",
    stat: "5.7K",
  },
];

const chats: ChatItem[] = [
  { title: "Crypto Price + AI Trend Pulse", time: "2 min ago" },
  { title: "$AVGO earnings recap", time: "26 min ago" },
  { title: "Macro & rates this week", time: "1 hour ago" },
  { title: "Semis vs power-grid rotation", time: "4 hours ago" },
  { title: "NVDA options flow check", time: "Yesterday" },
  { title: "AI infra shipment watch", time: "Tue" },
  { title: "FOMC liquidity map", time: "Mon" },
];

const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Account" },
  { id: "usage", label: "Usage" },
  { id: "portfolio", label: "Portfolio" },
  { id: "alvaAgent", label: "Alva Agent" },
  { id: "alerts", label: "Automations" },
  { id: "apiKey", label: "API Key" },
];

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "strategy", label: "Strategy" },
  { id: "feed", label: "Feed" },
];

function IconButton({
  label,
  icon: Icon,
  iconSrc,
  onClick,
  className = "",
}: {
  label: string;
  icon?: LucideIcon;
  iconSrc?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button aria-label={label} className={`icon-button ${className}`} onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : Icon ? <Icon size={20} strokeWidth={1.6} /> : null}
    </button>
  );
}

function AssetIcon({ className = "", size = 20, src }: { className?: string; size?: number; src: string }) {
  return <img alt="" className={`asset-icon ${className}`} height={size} src={asset(src)} style={{ height: size, width: size }} width={size} />;
}

function Page({ children, className = "", scroll = false }: { children: React.ReactNode; className?: string; scroll?: boolean }) {
  return <div className={`page ${scroll ? "page-scroll" : ""} ${className}`}>{children}</div>;
}

function TopAd() {
  return (
    <div className="ad-banner">
      <span>{"Which FinTwit accounts actually make money? We backtested their posts so you know where to find alpha →"}</span>
      <AssetIcon size={14} src="assets/figma/close-l1.svg" />
    </div>
  );
}

function Logo({ size = "large" }: { size?: "large" | "small" }) {
  return (
    <div className={`logo-mark logo-${size}`} aria-label="Alva">
      <img className="logo-symbol" src={asset("assets/figma/alva-symbol.svg")} alt="" />
      <img className="logo-word" src={asset("assets/figma/alva-word.svg")} alt="" />
    </div>
  );
}

function TopBar({ title, left, right, border = true }: { title: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode; border?: boolean }) {
  return (
    <div className={`topbar ${border ? "topbar-border" : ""}`}>
      <div className="topbar-side">{left}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-right">{right}</div>
    </div>
  );
}

function TabRow<T extends string>({
  items,
  active,
  onChange,
  compact = false,
}: {
  items: Array<{ id: T; label: string }>;
  active: T;
  onChange: (next: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={`tab-row ${compact ? "tab-row-compact" : ""}`}>
      {items.map((item) => (
        <button className={`tab-item ${active === item.id ? "active" : ""}`} key={item.id} onClick={() => onChange(item.id)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={`pill ${active ? "pill-active" : ""}`}>{children}</span>;
}

function Avatar({ src, size = 36 }: { src: string; size?: number }) {
  return <img alt="" className="avatar" height={size} src={src} style={{ height: size, width: size }} width={size} />;
}

function AgentIcon() {
  return (
    <span className="agent-icon">
      <img alt="" src={asset("assets/figma/alva-agent-icon.svg")} />
    </span>
  );
}

function NavRow({
  icon: Icon,
  iconSrc,
  label,
  active = false,
  onClick,
  badge,
}: {
  icon?: LucideIcon;
  iconSrc?: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button className={`nav-row ${active ? "active" : ""}`} onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : Icon ? <Icon size={19} strokeWidth={1.55} /> : null}
      <span>{label}</span>
      {badge ? <span className="mini-badge">{badge}</span> : null}
    </button>
  );
}

function PlaybookRow({ item, onClick }: { item: Playbook; onClick?: () => void }) {
  return (
    <button className="playbook-row" onClick={onClick} type="button">
      <Avatar size={32} src={item.avatar} />
      <span className="row-copy">
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>
      </span>
    </button>
  );
}

function ChatRow({ item, onClick }: { item: ChatItem; onClick?: () => void }) {
  return (
    <button className="chat-row" onClick={onClick} type="button">
      <AssetIcon src="assets/figma/sidebar-thread-normal.svg" />
      <span>{item.title}</span>
      <time>{item.time}</time>
    </button>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <Page className="login-page">
      <div className="login-hero">
        <Logo />
        <h1>Turn ideas into live investing playbooks in minutes</h1>
        <p>Log in to build, remix, and trade.</p>
      </div>

      <button className="promo-card" onClick={onLogin} type="button">
        <span className="promo-icon">
          <span className="gift-emoji" aria-hidden="true">
            🎁
          </span>
        </span>
        <span>
          <strong>Sign up to unlock 3-day Pro</strong>
          <small>$8 credits · Full data access</small>
        </span>
      </button>

      <button className="email-button" onClick={onLogin} type="button">
        Login with Email
      </button>

      <div className="divider">
        <span />
        <small>or</small>
        <span />
      </div>

      <div className="social-grid">
        {[
          ["Google", "assets/figma/social-google.svg"],
          ["X", "assets/figma/social-x.svg"],
          ["Telegram", "assets/figma/social-telegram.svg"],
          ["Discord", "assets/figma/social-discord.svg"],
        ].map(([label, src]) => (
          <button aria-label={`Login with ${label}`} key={label} onClick={onLogin} type="button">
            <img alt="" src={asset(src)} />
          </button>
        ))}
      </div>

      <button className="human-check" onClick={onLogin} type="button">
        <span className="checkbox" />
        <span>Verify you are human</span>
        <span className="cloudflare">
          <span className="cloudflare-row">
            <img alt="" src={asset("assets/figma/cloudflare.svg")} />
            <span>Cloudflare</span>
          </span>
          <small>Privacy · Terms</small>
        </span>
      </button>

      <p className="terms">
        By signing in, you agree to the Terms of Service and Privacy
        <br />
        Policy
      </p>
    </Page>
  );
}

function ChatPage({ onMenu }: { onMenu: () => void }) {
  return (
    <Page className="chat-page">
      <TopAd />
      <TopBar
        title="Alva Agent"
        left={<IconButton iconSrc="assets/figma/menu-l1.svg" label="Open sidebar" onClick={onMenu} />}
        right={<IconButton iconSrc="assets/figma/account-settings-l.svg" label="Settings" />}
      />
      <TabRow
        active="chat"
        items={[
          { id: "chat", label: "Chat" },
          { id: "tasks", label: "Tasks (5)" },
          { id: "memory", label: "Memory" },
          { id: "alerts", label: "Alerts (8)" },
          { id: "files", label: "Files (8)" },
        ]}
        onChange={() => undefined}
      />
      <div className="chat-scroll">
        <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
        <div className="agent-label">
          <AgentIcon />
          <strong>Alva</strong>
        </div>
        <article className="digest-card">
          <header>
            <div>
              <h2>Daily Digest · Market Digest</h2>
              <Pill>
                <span className="teal-dot" /> nvda-macd-hft-notify
              </Pill>
              <p className="muted">English · Jun 15 · Daily Digest · Previous day · Based on 53 FinTwits</p>
            </div>
            <button type="button">Open full report</button>
          </header>
          <div className="digest-body">
            <p>Top-ranked traders clustered around $NVDA, $000660.KS, $AKAM, $AMPG, and $AVGO in this window.</p>
            <p>
              The strongest current theme is AI infrastructure and cloud names, with $NVDA receiving repeated attention while $AVGO appears as a possible
              funding short.
            </p>
          </div>
        </article>
      </div>
      <Composer />
    </Page>
  );
}

function Composer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`composer ${compact ? "composer-compact" : ""}`}>
      <AssetIcon size={21} src="assets/figma/plus-l1.svg" />
      <span>Ask Alva anything. @ for context, / for skills</span>
      <button type="button">
        <AssetIcon size={17} src="assets/figma/arrow-up-line-l1.svg" />
      </button>
    </div>
  );
}

function SidebarPage({
  onAccount,
  onExplore,
  onPlaybooks,
  onRecentChats,
  onPlaybook,
  onChat,
}: {
  onAccount: () => void;
  onExplore: () => void;
  onPlaybooks: () => void;
  onRecentChats: () => void;
  onPlaybook: () => void;
  onChat: () => void;
}) {
  return (
    <Page className="sidebar-page" scroll>
      <TopAd />
      <div className="sidebar-head">
        <Logo size="small" />
        <button className="avatar-button" onClick={onAccount} type="button">
          <Avatar size={32} src={asset("assets/figma/sidebar-top-avatar.png")} />
        </button>
      </div>
      <button className="upgrade-card" type="button">
        <span className="upgrade-icon">
          <AssetIcon size={24} src="assets/figma/arrow-up-l1.svg" />
        </span>
        <span>
          <strong>
            Upgrade to Pro <AssetIcon size={12} src="assets/figma/arrow-right-l2.svg" />
          </strong>
          <small>Unlock unlimited playbooks with 7-day free trial</small>
        </span>
      </button>

      <nav className="side-nav">
        <NavRow iconSrc="assets/figma/sidebar-icon-explore.svg" label="Explore" onClick={onExplore} />
        <NavRow iconSrc="assets/figma/sidebar-icon-portfolio.svg" label="Portfolio" />
        <NavRow iconSrc="assets/figma/sidebar-icon-alva-skill.svg" label="Alva Skill" />
        <NavRow active iconSrc="assets/figma/sidebar-icon-league.svg" label="FinTwit Alpha League" />
      </nav>

      <SectionHeader action="View all" onAction={onPlaybooks} title="Playbooks" />
      <div className="list-stack">
        {playbooks.map((item) => (
          <PlaybookRow item={item} key={item.title} onClick={onPlaybook} />
        ))}
      </div>

      <SectionHeader action="View all" onAction={onRecentChats} title="Chats" />
      <button className="new-chat" type="button">
        <AssetIcon size={14} src="assets/figma/chat-new-l.svg" /> New Chat
      </button>
      <div className="list-stack chat-stack">
        {chats.slice(0, 5).map((item) => (
          <ChatRow item={item} key={item.title} onClick={onChat} />
        ))}
      </div>
      <button className="ask-fab" type="button">
        <AssetIcon src="assets/figma/chat-ai-l.svg" /> Ask Alva
      </button>
    </Page>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action ? (
        <button onClick={onAction} type="button">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function SidebarMenuPage({ onBack, onProfile, onSettings }: { onBack: () => void; onProfile: () => void; onSettings: () => void }) {
  return (
    <Page className="account-menu-page">
      <TopBar border={false} left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />} title="" />
      <button className="account-user" onClick={onProfile} type="button">
        <Avatar size={48} src={asset("assets/figma/profile-avatar.png")} />
        <span>
          <strong>sheer</strong>
          <span className="inline-tags">
            <Pill>Pro</Pill>
            <Pill>Annual</Pill>
          </span>
          <small>
            <img alt="" className="google-logo-small" src={asset("assets/figma/social-google.svg")} /> sheer@alva.xyz
          </small>
        </span>
        <AssetIcon size={12} src="assets/figma/arrow-right-l2.svg" />
      </button>

      <div className="account-list">
        <MenuItem iconSrc="assets/figma/account-credit-l.svg" label="Usage" />
        <div className="usage-card">
          <span>
            <small>Available</small>
            <strong>12,000</strong>
          </span>
          <span className="usage-lines">
            <small>
              Daily <b>1,000</b>
            </small>
            <small>
              Monthly <b>3,000</b>
            </small>
            <small>
              Pack <b>12,000</b>
            </small>
          </span>
        </div>
        <MenuItem iconSrc="assets/figma/account-gift-l.svg" label="Referral" />
        <MenuItem iconSrc="assets/figma/account-wallet-l.svg" label="Creator Earnings" status />
        <MenuItem iconSrc="assets/figma/account-language-l.svg" label="Language" />
        <MenuItem iconSrc="assets/figma/account-settings-l.svg" label="Settings" onClick={onSettings} />
        <MenuItem iconSrc="assets/figma/account-logout-l.svg" label="Log Out" />
      </div>
      <div className="account-socials">
        <button aria-label="Discord" type="button">
          <img alt="" src={asset("assets/figma/account-discord-l.svg")} />
        </button>
        <button aria-label="Telegram" type="button">
          <img alt="" src={asset("assets/figma/account-telegram-l.svg")} />
        </button>
        <button aria-label="X" type="button">
          <img alt="" src={asset("assets/figma/account-x-l.svg")} />
        </button>
        <button aria-label="Docs" type="button">
          <img alt="" src={asset("assets/figma/account-docs-l.svg")} />
        </button>
      </div>
    </Page>
  );
}

function MenuItem({
  icon: Icon,
  iconSrc,
  label,
  onClick,
  status = false,
}: {
  icon?: LucideIcon;
  iconSrc?: string;
  label: string;
  onClick?: () => void;
  status?: boolean;
}) {
  return (
    <button className="menu-item" onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : Icon ? <Icon size={19} strokeWidth={1.55} /> : null}
      <span>{label}</span>
      {status ? <span className="status-dot" /> : null}
      <AssetIcon size={12} src="assets/figma/arrow-right-l2.svg" />
    </button>
  );
}

function PlaybooksPage({ onBack, onOpen }: { onBack: () => void; onOpen: () => void }) {
  return (
    <Page className="plain-list-page">
      <TopBar border={false} left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />} title="Playbooks" />
      <TabRow
        active="all"
        items={[
          { id: "all", label: "All" },
          { id: "subscribed", label: "Subscribed" },
          { id: "created", label: "Created" },
        ]}
        onChange={() => undefined}
      />
      <div className="filter-row">
        <Pill>All</Pill>
        <Pill active>Running</Pill>
        <Pill>Paused</Pill>
        <Pill>Draft</Pill>
      </div>
      <div className="list-stack large-list">
        {playbooks.map((item) => (
          <PlaybookRow item={item} key={item.title} onClick={onOpen} />
        ))}
      </div>
    </Page>
  );
}

function RecentChatsPage({ onBack, onChat }: { onBack: () => void; onChat: () => void }) {
  return (
    <Page className="plain-list-page">
      <TopBar border={false} left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />} title="Recent Chats" />
      <button className="primary-outline" type="button">
        <AssetIcon size={15} src="assets/figma/chat-new-l.svg" /> New Chat
      </button>
      <div className="list-stack chat-stack full">
        {chats.map((item) => (
          <ChatRow item={item} key={item.title} onClick={onChat} />
        ))}
      </div>
    </Page>
  );
}

function ExplorePage({ onMenu, onOpen }: { onMenu: () => void; onOpen: () => void }) {
  const exploreItems = [
    {
      title: "BTC Ultimate AI Trader",
      desc: "Aggregates real-time data across multiple DEX platforms to identify high-potential Gold...",
      author: "Alva Intern",
      avatar: asset("assets/avatars/ava-1.png"),
      cover: asset("assets/figma/explore-thumb-1.png"),
      price: "$50",
    },
    {
      title: "MAG7 Equal-Weight Monthly Rebalance",
      desc: "Maintains a fully invested equal-weight portfolio of the Magnificent 7 stocks and reb...",
      author: "Maya Reynolds",
      avatar: asset("assets/avatars/ava-2.png"),
      cover: asset("assets/figma/explore-thumb-2.png"),
    },
    {
      title: "PEPE Long vs BTC Short Monthly Rebal...",
      desc: "The OI Abnormal Movement Monitoring Strategy tracks selected crypto tokens on a...",
      author: "Lucas Bennett",
      avatar: asset("assets/avatars/ava-3.png"),
      cover: asset("assets/figma/explore-thumb-3.png"),
    },
    {
      title: "Attribution Analysis Strategy for Price...",
      desc: "Monitor selected tokens on a 4-hour timeframe to detect abnormal changes in Op...",
      author: "Olivia Hayes",
      avatar: asset("assets/avatars/ava-5.png"),
      cover: asset("assets/figma/explore-thumb-4.png"),
      price: "$5/mo",
    },
    {
      title: "BTC MACD 1h Simple Crossover",
      desc: "Trade BTC using MACD(12,26,9) line crossing with a simple risk filter.",
      author: "Ethan Brooks",
      avatar: asset("assets/avatars/av-zet.jpeg"),
      cover: asset("assets/covers/cover-btcprice.webp"),
    },
  ];

  return (
    <Page className="explore-page" scroll>
      <TopBar
        left={<IconButton iconSrc="assets/figma/menu-l1.svg" label="Open sidebar" onClick={onMenu} />}
        right={<IconButton iconSrc="assets/figma/search-l1.svg" label="Search" />}
        title="Explore"
      />
      <button className="explore-sort" type="button">
        Popular <ChevronDown size={14} strokeWidth={1.6} />
      </button>
      <div className="explore-tabs">
        {["Smart Screener", "Theme Tracker", "Backtest", "AI Digest"].map((item) => (
          <Pill key={item}>{item}</Pill>
        ))}
        <button aria-label="More categories" className="mini-icon-button" type="button">
          <AssetIcon size={17} src="assets/figma/menu-l1.svg" />
        </button>
      </div>
      <div className="explore-stack">
        {exploreItems.map((item) => (
          <button className="explore-card" key={item.title} onClick={onOpen} type="button">
            <span className="explore-copy">
              <strong>{item.title}</strong>
              <small>{item.desc}</small>
              <span className="explore-author">
                <Avatar size={18} src={item.avatar} />
                {item.author}
              </span>
            </span>
            <img alt="" src={item.cover} />
            <span className="explore-metrics">
              {item.price ? (
                <span className="explore-price">
                  <Lock size={12} strokeWidth={1.8} /> {item.price}
                </span>
              ) : null}
              <span>
                <Eye size={13} strokeWidth={1.6} /> 12.8K
              </span>
              <span>
                <Repeat2 size={12} strokeWidth={1.6} /> 3
              </span>
            </span>
          </button>
        ))}
      </div>
    </Page>
  );
}

function SettingsPage({ active, onBack, onTab }: { active: SettingsTab; onBack: () => void; onTab: (tab: SettingsTab) => void }) {
  return (
    <Page className="settings-page" scroll>
      <TopBar border={false} left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />} title="Settings" />
      <TabRow active={active} compact items={settingsTabs} onChange={onTab} />
      <div className="settings-content tab-content-motion" key={active}>
        {active === "account" ? <SettingsAccount /> : null}
        {active === "usage" ? <SettingsUsage /> : null}
        {active === "portfolio" ? <SettingsPortfolio /> : null}
        {active === "alvaAgent" ? <SettingsAgent /> : null}
        {active === "alerts" ? <SettingsAlerts /> : null}
        {active === "apiKey" ? <SettingsApi /> : null}
      </div>
    </Page>
  );
}

function SettingsAccount() {
  return (
    <>
      <div className="profile-mini settings-profile-mini">
        <span className="settings-avatar-wrap">
          <Avatar size={64} src={asset("assets/figma/profile-avatar.png")} />
          <span>
            <AssetIcon size={12} src="assets/figma/profile-edit-l1.svg" />
          </span>
        </span>
        <span>
          <strong>Sheer</strong>
          <small>UID 13458677909324 · Joined 12/31/2025</small>
        </span>
      </div>
      <div className="two-buttons">
        <button type="button">Profile</button>
        <button className="danger" type="button">
          Log out
        </button>
      </div>
      <Field label="Nickname" value="Sheer" />
      <label className="field-block">
        <span>User info</span>
        <textarea placeholder="Introduce about yourself..." maxLength={500} />
        <small>0/500</small>
      </label>
      <h3>Connections</h3>
      <p className="settings-section-note">Manage how you sign in to Alva and where we can reach you.</p>
      <Connection iconSrc="assets/figma/gmail-l.svg" label="Gmail" sub="sheer@alva.xyz" action="Login Account" />
      <Connection iconSrc="assets/figma/email-l.svg" label="Email" sub="sheer@alva.xyz" action="Disconnect" />
      <Connection iconSrc="assets/figma/social-x.svg" label="X (Twitter)" sub="@sheer_lee" action="Disconnect" />
      <Connection iconSrc="assets/figma/social-telegram.svg" label="Telegram" sub="Get instant alerts when prices break out." action="Connect" />
      <Connection iconSrc="assets/figma/social-discord.svg" label="Discord" sub="Join the community and chat with other traders." action="Connect" />
    </>
  );
}

function SettingsUsage() {
  return (
    <>
      <div className="plan-card">
        <div>
          <strong>Pro</strong>
          <Pill>Annually</Pill>
        </div>
        <button type="button">View all plans</button>
        <small>Start Date 06/06/2026 · Next Billing 06/06/2027</small>
        <div className="two-buttons">
          <button className="filled" type="button">
            Add credits
          </button>
          <button type="button">Manage</button>
        </div>
      </div>
      <MetricCard label="Available" value="10,000" sub="Credits" />
      <Notice>Your subscription will expire on Jan 8, 2027 and you will be downgraded to Free afterwards</Notice>
      <UsageBar label="Daily" value="800 / 1,000" percent={80} />
      <UsageBar label="Monthly" value="8,640 / 21,360" percent={40} />
      <UsageBar label="Pack" value="2,920" percent={18} />
    </>
  );
}

function SettingsPortfolio() {
  return (
    <>
      <SectionHeader action="+ Add" title="Broker Connections" />
      <Connection icon="IB" label="Interactive Brokers" sub="U***7338 · Live" action="Disconnect" />
      <Connection icon="BN" label="Binance" sub="U***7905 · Spot" action="Disconnect" />
      <Connection icon="AP" label="Alpaca" sub="U***7130 · Live" action="Disconnect" />
      <h3>Global Risk Rules</h3>
      <ToggleRow label="Max Single Order" value="$5,000" enabled />
      <ToggleRow label="Max Daily Turnover" value="-" />
      <ToggleRow label="Hard Stop Loss" value="8%" />
    </>
  );
}

function SettingsAgent() {
  return (
    <>
      <div className="connected-app">
        <span>Connected App</span>
        <button type="button">
          <AssetIcon size={14} src="assets/figma/social-telegram.svg" /> Telegram <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
        </button>
      </div>
      <Connection iconSrc="assets/figma/social-telegram.svg" label="Telegram" sub="Sheername" action="Disconnect" />
      <Connection iconSrc="assets/figma/social-discord.svg" label="Discord" sub="Join the community and chat with other traders." action="Connect" />
      <ToggleRow label="Customize Your Assistant" enabled />
      <textarea className="assistant-text" placeholder="Define your assistant's identity: name, tone, and..." />
      <ToggleRow label="Generate Memory from Chat History" enabled />
      <div className="quote-box">"How to apply..." when looking up design tokens, component specs, and market context.</div>
    </>
  );
}

function SettingsAlerts() {
  return (
    <>
      <div className="filter-row tight">
        <Pill active>All</Pill>
        <Pill>Active</Pill>
        <Pill>Paused</Pill>
      </div>
      {["Market Pulse Digest", "AI Earnings Radar", "GLP-1 Trial Watch", "space-rs-rotation"].map((item, index) => (
        <div className="alert-card" key={item}>
          <header>
            <strong>{item}</strong>
            <button type="button">Push-notify</button>
          </header>
          <small>{index === 0 ? "Mega Chin · Last Run 15m" : "Runs daily · Last Run 1h"}</small>
          <div className="alert-actions">
            <AssetIcon size={15} src="assets/figma/profile-edit-l1.svg" />
            <AssetIcon size={15} src="assets/figma/activity-l1.svg" />
            <span>Unsubscribe</span>
          </div>
        </div>
      ))}
    </>
  );
}

function SettingsApi() {
  return (
    <>
      <SectionHeader action="+ Create" title="Alva API Keys" />
      {["Open Claw Key", "Claude Key", "Gemini Private Key"].map((item) => (
        <ApiKeyRow key={item} label={item} />
      ))}
      <SectionHeader action="Upload" title="Secrets Vault" />
      <ApiKeyRow label="Sheer Test" muted />
      <div className="quick-start">
        <AssetIcon size={16} src="assets/figma/key-l1.svg" />
        <span>
          <strong>Quick Start</strong>
          <small>For full setup instructions, configuration details, and examples.</small>
        </span>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function Connection({ icon, iconSrc, label, sub, action }: { icon?: string; iconSrc?: string; label: string; sub: string; action: string }) {
  return (
    <div className="connection-row">
      <span className={`connection-icon ${iconSrc ? "connection-icon-image" : ""}`}>{iconSrc ? <AssetIcon size={20} src={iconSrc} /> : icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{sub}</small>
      </span>
      <button className={action === "Login Account" ? "muted-action" : ""} type="button">
        {action}
      </button>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="notice">{children}</div>;
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="metric-card">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function UsageBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="usage-bar">
      <span>
        <b>{label}</b>
        <small>{value}</small>
      </span>
      <div>
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, enabled = false }: { label: string; value?: string; enabled?: boolean }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      {value ? <strong>{value}</strong> : null}
      <button className={enabled ? "enabled" : ""} type="button" aria-label={label}>
        <span />
      </button>
    </div>
  );
}

function ApiKeyRow({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`api-row ${muted ? "muted" : ""}`}>
      <AssetIcon size={16} src="assets/figma/key-l1.svg" />
      <span>
        <strong>{label}</strong>
        <small>eyJhbGciOiJ**************</small>
      </span>
      <AssetIcon size={15} src="assets/figma/copy-l1.svg" />
      <AssetIcon size={15} src="assets/figma/profile-edit-l1.svg" />
    </div>
  );
}

function ChatSelectedPage({ onBack }: { onBack: () => void }) {
  return (
    <Page className="chat-page selected-chat">
      <TopAd />
      <TopBar
        title={
          <span className="title-with-caret">
            Daily FinTwit Digest <ChevronDown size={14} strokeWidth={1.7} />
          </span>
        }
        left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />}
        right={<IconButton iconSrc="assets/figma/account-settings-l.svg" label="Settings" />}
      />
      <div className="chat-scroll">
        <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
        <div className="agent-label">
          <AgentIcon />
          <strong>Alva</strong>
          <time>10:28 PM</time>
        </div>
        <div className="assistant-message">
          <p>
            On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and sentiment
            shifts.
          </p>
          <p>Want me to deliver this automatically each morning?</p>
        </div>
        <div className="user-bubble selected-confirm">Yes — send it to Telegram daily at 7:30 AM.</div>
        <div className="agent-label">
          <AgentIcon />
          <strong>Alva</strong>
          <time>10:28 PM</time>
        </div>
        <div className="assistant-message">
          <p>Done. Your FinTwit Digest is scheduled for 7:30 AM daily and will arrive in Telegram.</p>
          <p>Today's edition: 8 accounts covered, 14 tickers flagged — NVDA and BTC drew the most bullish mentions.</p>
          <p>Highlights: NVDA bulls at 68%, BTC reclaiming $104k, and</p>
        </div>
      </div>
      <Composer />
    </Page>
  );
}

function ProfilePage({ onBack }: { onBack: () => void }) {
  return (
    <Page className="profile-page" scroll>
      <TopBar border={false} left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />} title="" />
      <div className="profile-hero">
        <Avatar size={64} src={asset("assets/figma/profile-avatar.png")} />
        <div>
          <h1>
            YGGYLL <span>Pro</span>
          </h1>
          <p>
            @yggyll <i /> Joined Dec 23, 2025
          </p>
        </div>
      </div>
      <p className="profile-bio">
        I am YGGYLL — building crypto trading playbooks focused on momentum, breakouts, and asymmetric risk. Mostly
        <button type="button">
          Show more <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
        </button>
      </p>
      <div className="profile-social-row">
        <span>
          <img alt="" src={asset("assets/figma/social-x.svg")} /> @yggyll
        </span>
        <span>
          <img alt="" src={asset("assets/figma/social-telegram.svg")} /> @YGGYLLSignals
        </span>
        <span>
          <img alt="" src={asset("assets/figma/social-discord.svg")} /> yggyll.alva
        </span>
      </div>
      <div className="stats-grid">
        <Stat value="6" label="Playbooks" />
        <Stat value="890" label="Stars" />
        <Stat value="12" label="Remix" />
        <Stat value="$1,203.45" label="Earned" />
      </div>
      <div className="profile-actions">
        <button type="button">
          <AssetIcon size={14} src="assets/figma/profile-edit-l1.svg" /> Edit Profile
        </button>
        <button type="button">
          <AssetIcon size={14} src="assets/figma/profile-share-l.svg" /> Share Profile
        </button>
      </div>
      <TabRow
        active="playbooks"
        items={[
          { id: "playbooks", label: "My Playbooks" },
          { id: "starred", label: "My starred" },
          { id: "purchased", label: "My purchased" },
        ]}
        onChange={() => undefined}
      />
      <div className="filter-row profile-filter-row">
        <Pill active>All</Pill>
        <Pill>Public</Pill>
        <Pill>Private</Pill>
        <Pill>Paid</Pill>
      </div>
      <button className="profile-feature-card" type="button">
        <header>
          <span>
            <strong>EV Supply Chain</strong>
            <small>Top 20 signals tracked by source, flow, and risk layer</small>
          </span>
          <em>
            <Lock size={13} strokeWidth={1.7} /> $50
          </em>
          <MoreHorizontal size={17} strokeWidth={1.6} />
        </header>
        <img alt="" src={asset("assets/figma/profile-playbook-preview.png")} />
        <div className="profile-card-tags">
          <Pill>Consenso</Pill>
          <Pill active>BTO</Pill>
          <Pill>GOL</Pill>
          <Pill>ROCE</Pill>
        </div>
      </button>
    </Page>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PlaybookDetailPage({
  tab,
  onBack,
  onInfo,
  onAsk,
  onTab,
}: {
  tab: DetailTab;
  onBack: () => void;
  onInfo: () => void;
  onAsk: () => void;
  onTab: (tab: DetailTab) => void;
}) {
  return (
    <Page className="detail-page" scroll>
      <TopAd />
      <TopBar
        left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />}
        right={
          <>
            <IconButton iconSrc="assets/figma/info-l1.svg" label="Info" onClick={onInfo} />
            <IconButton iconSrc="assets/figma/comment-l1.svg" label="Comments" />
            <IconButton iconSrc="assets/figma/profile-share-l.svg" label="Share" />
          </>
        }
        title="Quality Value Stock Screen..."
      />
      <TabRow active={tab} items={detailTabs} onChange={onTab} />
      <DetailContent tab={tab} />
      <div className="detail-actions">
        <button onClick={onAsk} type="button">
          <AssetIcon size={16} src="assets/figma/chat-ai-l.svg" /> Ask Alva
        </button>
        <button type="button">Remix 1.2K</button>
        <button type="button">Trade</button>
        <button className="filled" type="button">
          Subscribe 512
        </button>
      </div>
    </Page>
  );
}

function DetailContent({ tab }: { tab: DetailTab }) {
  if (tab === "analytics") {
    return (
      <div className="detail-content tab-content-motion" key={tab}>
        <Panel title="Return Analysis">
          <MiniChart variant="bars" />
        </Panel>
        <Panel title="Risk Metrics">
          <MetricLine label="Sharpe" value="1.84" />
          <MetricLine label="Max Drawdown" value="-8.6%" />
          <MetricLine label="Volatility" value="12.3%" />
        </Panel>
      </div>
    );
  }
  if (tab === "strategy") {
    return (
      <div className="detail-content strategy-content tab-content-motion" key={tab}>
        <section className="strategy-section">
          <h2>
            Objective <ChevronDown size={16} strokeWidth={1.5} />
          </h2>
          <p>
            The strategy triggers whenever BTC long liquidations exceed $300M within any rolling 24-hour window, then identifies the top 10 non-stablecoin
            tokens (from the top 100 by market cap) that deliver the highest 7-day excess return versus BTC from the next UTC 00:00 open.
          </p>
        </section>
        <section className="strategy-section">
          <h2>
            Strategy <ChevronDown size={16} strokeWidth={1.5} />
          </h2>
          <div className="strategy-switch-row">
            <span className="strategy-mini-tabs">
              <button className="active" type="button">
                Idea
              </button>
              <button type="button">Code</button>
            </span>
            <label>
              <span className="switch-off" />
              Log
            </label>
          </div>
          <div className="strategy-card">
            <h3>Signal Generation</h3>
            <ul>
              <li>Wait until the next UTC 00:00 open.</li>
              <li>Compute the 7-day forward return for BTC and all top-100 crypto assets (excluding stablecoins).</li>
              <li>Select the top 10 tokens with the highest 7-day excess return vs BTC historically (based on your analysis dataset).</li>
            </ul>
            <h3>Entry Rule</h3>
            <ul>
              <li>
                Buy an equal-weighted basket of the top 3 outperformer tokens (i.e., the three tokens with the highest historical average 7-day excess return
                after such events).
              </li>
              <li>Allocate capital equally</li>
            </ul>
            <h3>Exit Rule</h3>
            <p>At the end of the 7-day holding window:</p>
            <ul>
              <li>Sell all tokens</li>
              <li>Realize the basket return</li>
              <li>Return to cash until the next liquidation-trigger event</li>
            </ul>
          </div>
        </section>
      </div>
    );
  }
  if (tab === "feed") {
    return (
      <div className="detail-content tab-content-motion" key={tab}>
        {[
          "NVDA margin pressure eased after supplier checks.",
          "Power-grid exposure improved across top holdings.",
          "Semis rotation remains active versus software.",
        ].map((item) => (
          <Panel key={item} title="Market update">
            <p>{item}</p>
            <small>Jun 15 · 9:30 AM</small>
          </Panel>
        ))}
      </div>
    );
  }
  return (
    <div className="detail-content tab-content-motion" key={tab}>
      <div className="detail-info-row">
        <Pill>Last Updated: 11/20/2025</Pill>
        <Pill>Interval: 1d</Pill>
        <Pill>Start Date: 06/12/2023</Pill>
        <Pill>Initial Amount: 1M USD</Pill>
      </div>
      <div className="metric-spark-grid">
        <MetricSpark label="Total Return" value="18.4%" tone="up" variant={0} />
        <MetricSpark label="Annualized Return" value="49.32%" tone="up" variant={1} />
        <MetricSpark label="Volatility" value="22.4%" tone="up" variant={2} />
        <MetricSpark label="Sharpe Ratio" value="5.54" tone="up" variant={3} />
        <MetricSpark label="Sortino Ratio" value="1.45" tone="up" variant={4} />
        <MetricSpark label="Max Drawdown" value="-9.6%" tone="down" variant={5} />
      </div>
      <section className="equity-section">
        <h3>
          Equity Curve <span>USD</span>
        </h3>
        <div className="legend-row">
          <span>Initial Amount</span>
          <span>This Playbook</span>
          <span>BTC</span>
        </div>
        <Sparkline height={150} tone="up" variant={6} />
      </section>
    </div>
  );
}

function MetricSpark({ label, value, tone, variant }: { label: string; value: string; tone: "up" | "down"; variant: number }) {
  return (
    <div className="metric-spark-card">
      <span>
        {label}
        <Info size={12} strokeWidth={1.5} />
      </span>
      <strong className={tone}>{value}</strong>
      <Sparkline height={48} tone={tone} variant={variant} />
    </div>
  );
}

function Sparkline({ height, tone, variant }: { height: number; tone: "up" | "down"; variant: number }) {
  const sets = [
    "0,18 8,42 17,30 26,32 35,37 44,35 53,40 62,29 71,35 80,31 89,28 98,36 107,41 116,34",
    "0,42 8,18 17,46 26,25 35,31 44,33 53,39 62,28 71,35 80,30 89,37 98,24 107,31 116,44",
    "0,34 8,33 17,37 26,35 35,39 44,33 53,42 62,29 71,43 80,25 89,44 98,18 107,14 116,47",
    "0,42 8,40 17,41 26,36 35,42 44,44 53,39 62,24 71,20 80,18 89,27 98,31 107,24 116,28",
    "0,36 8,39 17,28 26,24 35,37 44,45 53,28 62,21 71,30 80,34 89,26 98,42 107,47 116,24",
    "0,44 8,45 17,42 26,40 35,35 44,38 53,27 62,25 71,19 80,22 89,16 98,15 107,18 116,14",
    "0,122 24,128 48,116 72,126 96,104 120,96 144,86 168,92 192,72 216,64 240,52 264,58 288,44 312,32 336,28",
  ];
  return (
    <svg className={`sparkline ${tone}`} height={height} viewBox={`0 0 ${variant === 6 ? 336 : 116} ${height}`} width="100%" aria-hidden="true">
      <polyline points={sets[variant]} />
    </svg>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniChart({ variant = "line" }: { variant?: "line" | "bars" }) {
  return (
    <div className={`mini-chart ${variant}`}>
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} style={{ height: `${22 + ((index * 17) % 58)}px` }} />
      ))}
    </div>
  );
}

function AskAlvaOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-root ask-overlay-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="ask-sheet">
        <div className="sheet-handle" />
        <TopBar
          border={false}
          left={<IconButton iconSrc="assets/figma/close-l1.svg" label="Close" onClick={onClose} />}
          right={
            <>
              <IconButton iconSrc="assets/figma/chat-new-l.svg" label="New chat" />
              <IconButton iconSrc="assets/figma/expand-l1.svg" label="Expand" />
            </>
          }
          title={
            <span className="title-with-caret">
              Daily FinTwit Digest <ChevronDown size={14} strokeWidth={1.7} />
            </span>
          }
        />
        <div className="chat-scroll sheet-chat">
          <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
          <div className="agent-label">
            <AgentIcon />
            <strong>Alva</strong>
            <time>10:28 PM</time>
          </div>
          <div className="assistant-message">
            <p>
              On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and sentiment
              shifts.
            </p>
            <p>Want me to deliver this automatically each morning?</p>
          </div>
          <div className="user-bubble selected-confirm">Yes — send it to Telegram daily at 7:30 AM.</div>
          <div className="agent-label">
            <AgentIcon />
            <strong>Alva</strong>
            <time>10:28 PM</time>
          </div>
          <div className="assistant-message">
            <p>Done. Your FinTwit Digest is scheduled for 7:30 AM daily and will arrive in Telegram.</p>
            <p>Today's edition: 8 accounts covered, 14 tickers flagged — NVDA and BTC drew the most bullish mentions.</p>
          </div>
        </div>
        <Composer compact />
      </div>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-root modal-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="info-modal">
        <header>
          <h2>Quality Value Stock Screener Quality Value Stock Screener</h2>
          <IconButton iconSrc="assets/figma/close-l1.svg" label="Close" onClick={onClose} />
        </header>
        <div className="modal-chip-row">
          <span className="modal-chip">
            <Avatar size={20} src={asset("assets/figma/modal-avatar.png")} /> YGGYLL
          </span>
          <span className="modal-chip">
            <img alt="" className="modal-chip-icon" src={asset("assets/figma/researcher-l1.svg")} /> README
          </span>
          <span className="modal-chip">
            <span className="teal-dot" /> 3 Automations · 2m ago
          </span>
          <span className="modal-chip">
            <span>Built on:</span>
            <Avatar size={14} src={asset("assets/figma/modal-built-on.png")} />
            BTC Ultimate AI Trad...
          </span>
        </div>
        <div className="modal-stats">
          <Stat value="2.6K" label="Views" />
          <Stat value="24" label="Comments" />
          <Stat value="12" label="Remix" />
          <Stat value="138" label="Subscribed" />
        </div>
        <p>
          Tracks the AI infrastructure investment thesis across silicon, networking, hyperscalers, power, and data centers. 17-stock basket with daily quant
          analysis and ADK-driven narrative.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [motion, setMotion] = useState<Motion>("soft");
  const [viewport, setViewport] = useState(getVisualViewportSize);

  const routeState = (
    nextScreen: Screen,
    nextHistory: Screen[],
    nextOverlay: Overlay,
    nextDetailTab = detailTab,
    nextSettingsTab = settingsTab,
  ): BrowserRouteState => ({
    babyDemo: true,
    detailTab: nextDetailTab,
    history: nextHistory,
    overlay: nextOverlay,
    screen: nextScreen,
    settingsTab: nextSettingsTab,
  });

  const writeBrowserState = (mode: "push" | "replace", state: BrowserRouteState) => {
    if (typeof window === "undefined") return;
    const method = mode === "push" ? "pushState" : "replaceState";
    window.history[method](state, "", window.location.href);
  };

  const motionFor = (from: Screen, to: Screen): Motion => {
    if (from === "login" && to === "chat") return "auth";
    if (from === "chat" && to === "sidebar") return "drawer";
    if (from === to) return "soft";
    return "push";
  };

  useEffect(() => {
    writeBrowserState("replace", routeState(screen, history, overlay));

    const onPopState = (event: PopStateEvent) => {
      const state = event.state as BrowserRouteState | null;
      if (!state?.babyDemo) return;
      setMotion("back");
      setScreen(state.screen);
      setHistory(state.history);
      setOverlay(state.overlay);
      setDetailTab(state.detailTab);
      setSettingsTab(state.settingsTab);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateViewport = () => setViewport(getVisualViewportSize());
    const visualViewport = window.visualViewport;

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    visualViewport?.addEventListener("resize", updateViewport);
    visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      visualViewport?.removeEventListener("resize", updateViewport);
      visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, []);

  const navigate = (next: Screen, options: { detailTab?: DetailTab; settingsTab?: SettingsTab } = {}) => {
    const nextHistory = [...history, screen];
    const nextDetailTab = options.detailTab ?? detailTab;
    const nextSettingsTab = options.settingsTab ?? settingsTab;
    setHistory(nextHistory);
    setMotion(motionFor(screen, next));
    setOverlay(null);
    setDetailTab(nextDetailTab);
    setSettingsTab(nextSettingsTab);
    setScreen(next);
    writeBrowserState("push", routeState(next, nextHistory, null, nextDetailTab, nextSettingsTab));
  };

  const replace = (next: Screen) => {
    setHistory([]);
    setMotion(motionFor(screen, next));
    setOverlay(null);
    setScreen(next);
    writeBrowserState("replace", routeState(next, [], null));
  };

  const back = (fallback: Screen = "sidebar") => {
    if (typeof window !== "undefined" && history.length > 0 && window.history.state?.babyDemo) {
      window.history.back();
      return;
    }

    const stack = [...history];
    const previous = stack.pop() ?? fallback;
    setMotion("back");
    setOverlay(null);
    setScreen(previous);
    setHistory(stack);
    writeBrowserState("replace", routeState(previous, stack, null));
  };

  const openOverlay = (next: Exclude<Overlay, null>) => {
    setOverlay(next);
    writeBrowserState("push", routeState(screen, history, next));
  };

  const closeOverlay = () => {
    if (typeof window !== "undefined" && window.history.state?.babyDemo && window.history.state.overlay) {
      window.history.back();
      return;
    }
    setOverlay(null);
  };

  const openDetail = () => {
    navigate("playbookDetail", { detailTab: "overview" });
  };

  const openSettings = () => {
    navigate("settings", { settingsTab: "account" });
  };

  const rendered = useMemo(() => {
    switch (screen) {
      case "login":
        return <LoginPage onLogin={() => replace("chat")} />;
      case "chat":
        return <ChatPage onMenu={() => navigate("sidebar")} />;
      case "sidebar":
        return (
          <SidebarPage
            onAccount={() => navigate("sidebarMenu")}
            onChat={() => navigate("chatSelected")}
            onExplore={() => navigate("explore")}
            onPlaybook={openDetail}
            onPlaybooks={() => navigate("playbooks")}
            onRecentChats={() => navigate("recentChats")}
          />
        );
      case "sidebarMenu":
        return <SidebarMenuPage onBack={() => back("sidebar")} onProfile={() => navigate("profile")} onSettings={openSettings} />;
      case "playbooks":
        return <PlaybooksPage onBack={() => back("sidebar")} onOpen={openDetail} />;
      case "recentChats":
        return <RecentChatsPage onBack={() => back("sidebar")} onChat={() => navigate("chatSelected")} />;
      case "explore":
        return <ExplorePage onMenu={() => navigate("sidebar")} onOpen={openDetail} />;
      case "chatSelected":
        return <ChatSelectedPage onBack={() => back("sidebar")} />;
      case "profile":
        return <ProfilePage onBack={() => back("sidebar")} />;
      case "settings":
        return <SettingsPage active={settingsTab} onBack={() => back("sidebarMenu")} onTab={setSettingsTab} />;
      case "playbookDetail":
        return (
          <PlaybookDetailPage
            onAsk={() => openOverlay("askAlva")}
            onBack={() => back("sidebar")}
            onInfo={() => openOverlay("infoModal")}
            onTab={setDetailTab}
            tab={detailTab}
          />
        );
      default:
        return null;
    }
  }, [screen, settingsTab, detailTab]);

  const stageScale = viewport.width < MIN_MOBILE_STAGE_WIDTH ? viewport.width / MIN_MOBILE_STAGE_WIDTH : 1;
  const stageHeight = stageScale < 1 ? viewport.height / stageScale : viewport.height;
  const mobileShellStyle =
    stageScale < 1
      ? ({
          "--shell-dvh": `${stageHeight}px`,
          height: `${stageHeight}px`,
          minHeight: `${stageHeight}px`,
          transform: `scale(${stageScale})`,
          transformOrigin: "top left",
          width: `${MIN_MOBILE_STAGE_WIDTH}px`,
        } as CSSProperties)
      : undefined;

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className="mobile-shell" aria-label="m.baby mobile demo" style={mobileShellStyle}>
        <div className={`view-transition enter-${motion}`} key={screen}>
          {rendered}
        </div>
        {overlay === "askAlva" ? <AskAlvaOverlay onClose={closeOverlay} /> : null}
        {overlay === "infoModal" ? <InfoModal onClose={closeOverlay} /> : null}
      </section>
    </main>
  );
}

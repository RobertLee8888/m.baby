import { asset } from "../assets";
import {
  AssetIcon,
  Avatar,
  ChatRow,
  IconButton,
  Logo,
  MenuItem,
  NavRow,
  Page,
  Pill,
  PlaybookRow,
  SectionHeader,
  TabRow,
  TopAd,
  TopBar,
} from "../components";
import { chats, exploreItems, playbooks } from "../data";

export function SidebarPage({
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

export function SidebarMenuPage({ onBack, onProfile, onSettings }: { onBack: () => void; onProfile: () => void; onSettings: () => void }) {
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

export function PlaybooksPage({ onBack, onOpen }: { onBack: () => void; onOpen: () => void }) {
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

export function RecentChatsPage({ onBack, onChat }: { onBack: () => void; onChat: () => void }) {
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

export function ExplorePage({ onMenu, onOpen }: { onMenu: () => void; onOpen: () => void }) {
  return (
    <Page className="explore-page" scroll>
      <TopBar
        left={<IconButton iconSrc="assets/figma/menu-l1.svg" label="Open sidebar" onClick={onMenu} />}
        right={<IconButton iconSrc="assets/figma/search-l1.svg" label="Search" />}
        title="Explore"
      />
      <button className="explore-sort" type="button">
        Popular <AssetIcon size={12} src="assets/figma/data-entry-info.svg" />
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
                  <AssetIcon size={14} src="assets/figma/locked-f.svg" /> {item.price}
                </span>
              ) : null}
              <span>
                <AssetIcon size={14} src="assets/figma/show-l.svg" /> 12.8K
              </span>
              <span>
                <AssetIcon size={14} src="assets/figma/remix-l.svg" /> 3
              </span>
            </span>
          </button>
        ))}
      </div>
    </Page>
  );
}

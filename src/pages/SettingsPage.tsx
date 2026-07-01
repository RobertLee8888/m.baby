import {
  ApiKeyRow,
  AssetIcon,
  Avatar,
  Connection,
  Field,
  IconButton,
  MetricCard,
  Notice,
  Page,
  Pill,
  SectionHeader,
  TabRow,
  ToggleRow,
  TopBar,
  UsageBar,
} from "../components";
import { settingsTabs } from "../data";
import type { SettingsTab } from "../types";
import { asset } from "../assets";

export function SettingsPage({ active, onBack, onTab }: { active: SettingsTab; onBack: () => void; onTab: (tab: SettingsTab) => void }) {
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
      <Connection iconSrc="assets/brokers/binance.svg" label="Binance" sub="U***7905 · Spot" action="Disconnect" />
      <Connection iconSrc="assets/brokers/alpaca.svg" label="Alpaca" sub="U***7130 · Live" action="Disconnect" />
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

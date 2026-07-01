import { asset } from "../assets";
import {
  AssetIcon,
  Avatar,
  IconButton,
  MetricLine,
  MiniChart,
  Page,
  Panel,
  Pill,
  Stat,
  TabRow,
  TopBar,
} from "../components";
import { detailTabs } from "../data";
import type { DetailTab } from "../types";

export function PlaybookDetailPage({
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
        <button className="detail-action-item" onClick={onAsk} type="button">
          <AssetIcon size={20} src="assets/figma/chat-ai-action-l.svg" />
          <span>Ask Alva</span>
        </button>
        <button className="detail-action-item" type="button">
          <AssetIcon size={20} src="assets/figma/remix-action-l.svg" />
          <span>
            Remix <small>1.2K</small>
          </span>
        </button>
        <button className="detail-action-item" type="button">
          <AssetIcon size={20} src="assets/figma/swap-l.svg" />
          <span>Trade</span>
        </button>
        <button className="detail-action-item" type="button">
          <AssetIcon size={20} src="assets/figma/notification-l.svg" />
          <span>
            Subscribe <small>512</small>
          </span>
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
            Objective <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
          </h2>
          <p>
            The strategy triggers whenever BTC long liquidations exceed $300M within any rolling 24-hour window, then identifies the top 10 non-stablecoin
            tokens (from the top 100 by market cap) that deliver the highest 7-day excess return versus BTC from the next UTC 00:00 open.
          </p>
        </section>
        <section className="strategy-section">
          <h2>
            Strategy <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
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
        <AssetIcon size={12} src="assets/figma/info-l1.svg" />
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

export function InfoModal({ onClose }: { onClose: () => void }) {
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

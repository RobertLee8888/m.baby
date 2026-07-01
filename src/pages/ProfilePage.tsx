import { asset } from "../assets";
import { AssetIcon, Avatar, IconButton, Page, Pill, Stat, TabRow, TopBar } from "../components";

export function ProfilePage({ onBack }: { onBack: () => void }) {
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
            <AssetIcon size={14} src="assets/figma/locked-f-dark.svg" /> $50
          </em>
          <AssetIcon size={14} src="assets/figma/more-l2.svg" />
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

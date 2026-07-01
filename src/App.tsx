import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getVisualViewportSize, MIN_MOBILE_STAGE_WIDTH } from "./assets";
import { AskAlvaOverlay, ChatPage, ChatSelectedPage } from "./pages/ChatPages";
import { ExplorePage, PlaybooksPage, RecentChatsPage, SidebarMenuPage, SidebarPage } from "./pages/BrowsePages";
import { InfoModal, PlaybookDetailPage } from "./pages/PlaybookDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { createRouteState, getBrowserRouteState, motionFor, writeBrowserState } from "./navigation";
import type { BrowserRouteState, DetailTab, Motion, Overlay, Screen, SettingsTab } from "./types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [motion, setMotion] = useState<Motion>("soft");
  const [viewport, setViewport] = useState(getVisualViewportSize);

  useEffect(() => {
    writeBrowserState(
      "replace",
      createRouteState({
        detailTab: "overview",
        history: [],
        overlay: null,
        screen: "login",
        settingsTab: "account",
      }),
    );

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
    writeBrowserState(
      "push",
      createRouteState({
        detailTab: nextDetailTab,
        history: nextHistory,
        overlay: null,
        screen: next,
        settingsTab: nextSettingsTab,
      }),
    );
  };

  const replace = (next: Screen) => {
    setHistory([]);
    setMotion(motionFor(screen, next));
    setOverlay(null);
    setScreen(next);
    writeBrowserState(
      "replace",
      createRouteState({
        detailTab,
        history: [],
        overlay: null,
        screen: next,
        settingsTab,
      }),
    );
  };

  const back = (fallback: Screen = "sidebar") => {
    if (history.length > 0 && getBrowserRouteState()) {
      window.history.back();
      return;
    }

    const stack = [...history];
    const previous = stack.pop() ?? fallback;
    setMotion("back");
    setOverlay(null);
    setScreen(previous);
    setHistory(stack);
    writeBrowserState(
      "replace",
      createRouteState({
        detailTab,
        history: stack,
        overlay: null,
        screen: previous,
        settingsTab,
      }),
    );
  };

  const openOverlay = (next: Exclude<Overlay, null>) => {
    setOverlay(next);
    writeBrowserState(
      "push",
      createRouteState({
        detailTab,
        history,
        overlay: next,
        screen,
        settingsTab,
      }),
    );
  };

  const closeOverlay = () => {
    if (getBrowserRouteState()?.overlay) {
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

  let rendered: ReactNode = null;

  switch (screen) {
    case "login":
      rendered = <LoginPage onLogin={() => replace("chat")} />;
      break;
    case "chat":
      rendered = <ChatPage onMenu={() => navigate("sidebar")} />;
      break;
    case "sidebar":
      rendered = (
        <SidebarPage
          onAccount={() => navigate("sidebarMenu")}
          onAskAlva={() => replace("chat")}
          onChat={() => navigate("chatSelected")}
          onExplore={() => navigate("explore")}
          onPlaybook={openDetail}
          onPlaybooks={() => navigate("playbooks")}
          onRecentChats={() => navigate("recentChats")}
        />
      );
      break;
    case "sidebarMenu":
      rendered = <SidebarMenuPage onBack={() => back("sidebar")} onProfile={() => navigate("profile")} onSettings={openSettings} />;
      break;
    case "playbooks":
      rendered = <PlaybooksPage onBack={() => back("sidebar")} onOpen={openDetail} />;
      break;
    case "recentChats":
      rendered = <RecentChatsPage onBack={() => back("sidebar")} onChat={() => navigate("chatSelected")} />;
      break;
    case "explore":
      rendered = <ExplorePage onMenu={() => navigate("sidebar")} onOpen={openDetail} />;
      break;
    case "chatSelected":
      rendered = <ChatSelectedPage onBack={() => back("sidebar")} />;
      break;
    case "profile":
      rendered = <ProfilePage onBack={() => back("sidebar")} />;
      break;
    case "settings":
      rendered = <SettingsPage active={settingsTab} onBack={() => back("sidebarMenu")} onTab={setSettingsTab} />;
      break;
    case "playbookDetail":
      rendered = (
        <PlaybookDetailPage
          onAsk={() => openOverlay("askAlva")}
          onBack={() => back("sidebar")}
          onInfo={() => openOverlay("infoModal")}
          onTab={setDetailTab}
          tab={detailTab}
        />
      );
      break;
  }

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

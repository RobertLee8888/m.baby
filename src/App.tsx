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
  const [drawerTransition, setDrawerTransition] = useState<{ from: Screen; to: Screen } | null>(null);
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
      setDrawerTransition(null);
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

  useEffect(() => {
    if (!drawerTransition) return;
    const timeout = window.setTimeout(() => {
      setScreen(drawerTransition.to);
      setMotion("none");
      setDrawerTransition(null);
    }, 560);
    return () => window.clearTimeout(timeout);
  }, [drawerTransition]);

  const navigate = (next: Screen, options: { detailTab?: DetailTab; settingsTab?: SettingsTab } = {}) => {
    const nextHistory = [...history, screen];
    const nextDetailTab = options.detailTab ?? detailTab;
    const nextSettingsTab = options.settingsTab ?? settingsTab;
    const nextMotion = motionFor(screen, next);
    setHistory(nextHistory);
    setMotion(nextMotion);
    setDrawerTransition(nextMotion === "drawer" ? { from: screen, to: next } : null);
    setOverlay(null);
    setDetailTab(nextDetailTab);
    setSettingsTab(nextSettingsTab);
    if (nextMotion !== "drawer") {
      setScreen(next);
    }
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
    setDrawerTransition(null);
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
    setDrawerTransition(null);
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

  const renderScreen = (target: Screen): ReactNode => {
    switch (target) {
    case "login":
      return <LoginPage onLogin={() => replace("chat")} />;
    case "chat":
      return <ChatPage onMenu={() => navigate("sidebar")} />;
    case "sidebar":
      return (
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
    }
  }

  const stageScale = viewport.width < MIN_MOBILE_STAGE_WIDTH ? viewport.width / MIN_MOBILE_STAGE_WIDTH : 1;
  const stageHeight = stageScale < 1 ? viewport.height / stageScale : viewport.height;
  const mobileShellStyle = {
    "--shell-dvh": `${stageHeight}px`,
    height: `${stageHeight}px`,
    minHeight: `${stageHeight}px`,
    ...(stageScale < 1
      ? {
          transform: `scale(${stageScale})`,
          transformOrigin: "top left",
          width: `${MIN_MOBILE_STAGE_WIDTH}px`,
        }
      : null),
  } as CSSProperties;
  const isDrawerTransition = Boolean(drawerTransition);
  const rendered = renderScreen(screen);

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className={`mobile-shell ${isDrawerTransition ? "is-drawer-transition" : ""}`} aria-label="m.baby mobile demo" style={mobileShellStyle}>
        {drawerTransition ? (
          <div className="view-transition drawer-enter-layer" data-transition-layer="drawer-enter" key={`drawer-${drawerTransition.to}`}>
            {renderScreen(drawerTransition.to)}
          </div>
        ) : null}
        <div
          aria-hidden={drawerTransition ? "true" : undefined}
          className={`view-transition ${drawerTransition ? "drawer-exit-layer" : `enter-${motion}`}`}
          data-transition-layer={drawerTransition ? "drawer-exit" : "current"}
          key={screen}
        >
          {rendered}
        </div>
        {overlay === "askAlva" ? <AskAlvaOverlay onClose={closeOverlay} /> : null}
        {overlay === "infoModal" ? <InfoModal onClose={closeOverlay} /> : null}
      </section>
    </main>
  );
}

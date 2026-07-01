export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const MIN_MOBILE_STAGE_WIDTH = 360;

export const getVisualViewportSize = () => {
  if (typeof window === "undefined") return { height: 852, width: 393 };

  const visualViewport = window.visualViewport;
  return {
    height: visualViewport?.height ?? window.innerHeight,
    width: visualViewport?.width ?? window.innerWidth,
  };
};

import * as React from "react";

import { useThrottledCallback } from "./use-throttled-callback";

export interface WindowSizeState {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  scale: number;
}

export function useWindowSize(): WindowSizeState {
  const [windowSize, setWindowSize] = React.useState<WindowSizeState>({
    width: 0,
    height: 0,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 0,
  });

  const handleViewportChange = useThrottledCallback(() => {
    if (typeof window === "undefined") return;

    const vp = window.visualViewport;
    if (!vp) return;

    const {
      width = 0,
      height = 0,
      offsetTop = 0,
      offsetLeft = 0,
      scale = 0,
    } = vp;

    setWindowSize((prevState) => {
      if (
        width === prevState.width &&
        height === prevState.height &&
        offsetTop === prevState.offsetTop &&
        offsetLeft === prevState.offsetLeft &&
        scale === prevState.scale
      ) {
        return prevState;
      }

      return { width, height, offsetTop, offsetLeft, scale };
    });
  }, 200);

  React.useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    visualViewport.addEventListener("resize", handleViewportChange);

    handleViewportChange();

    return () => {
      visualViewport.removeEventListener("resize", handleViewportChange);
    };
  }, [handleViewportChange]);

  return windowSize;
}

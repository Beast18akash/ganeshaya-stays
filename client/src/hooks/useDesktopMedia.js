import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 1024px)";

const subscribe = (onStoreChange) => {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getSnapshot = () => window.matchMedia(desktopQuery).matches;

export const useDesktopMedia = () => useSyncExternalStore(subscribe, getSnapshot, () => false);

"use client";

import { useEffect, useRef } from "react";

import { useFeedUiStore } from "@/features/feed/store";

export function useFeedScrollRestoration() {
  const scrollY = useFeedUiStore((state) => state.scrollY);
  const setScrollY = useFeedUiStore((state) => state.setScrollY);
  const restoredScrollY = useRef(scrollY);

  restoredScrollY.current = scrollY;

  useEffect(() => {
    const container = document.getElementById("lela-scroll-container");
    if (!container) {
      return;
    }

    container.scrollTo(0, restoredScrollY.current);

    const onScroll = () => {
      const nextScrollY = container.scrollTop;
      if (nextScrollY !== useFeedUiStore.getState().scrollY) {
        setScrollY(nextScrollY);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [setScrollY]);
}

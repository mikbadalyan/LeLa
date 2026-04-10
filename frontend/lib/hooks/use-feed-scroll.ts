"use client";

import { useEffect } from "react";

import { useFeedUiStore } from "@/features/feed/store";

export function useFeedScrollRestoration() {
  const scrollY = useFeedUiStore((state) => state.scrollY);
  const setScrollY = useFeedUiStore((state) => state.setScrollY);

  useEffect(() => {
    const container = document.getElementById("lela-scroll-container");
    if (!container) {
      return;
    }

    container.scrollTo(0, scrollY);

    const onScroll = () => {
      setScrollY(container.scrollTop);
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
      setScrollY(container.scrollTop);
    };
  }, [scrollY, setScrollY]);
}

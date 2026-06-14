"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/tracking";

export default function TrackingListener() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Prevent double tracking in React 18 StrictMode if path didn't change
    if (pathname && lastTrackedPath.current !== pathname) {
      trackEvent("page_view", { path: pathname });
      lastTrackedPath.current = pathname;
    }
  }, [pathname]);

  return null;
}

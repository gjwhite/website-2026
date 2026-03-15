"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps page content with a key derived from the pathname so that when the
 * route changes, React remounts the content. That makes the load-animate
 * (fade-in-up) animation run again on every navigation, not just initial load.
 */
export function PageLoadKey({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname ?? undefined}>{children}</div>;
}

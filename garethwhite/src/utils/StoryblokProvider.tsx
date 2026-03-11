"use client";

import { useEffect } from "react";
import { initStoryblokClient } from "@/lib/storyblokClient";

export default function StoryblokProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initStoryblokClient();
  }, []);
  return <>{children}</>;
}

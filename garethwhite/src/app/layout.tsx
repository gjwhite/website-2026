import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import StoryblokProvider from "@/utils/StoryblokProvider";
import { PageLoadKey } from "@/components/PageLoadKey";
import { TransitionColourLayer } from "@/components/TransitionColourLayer";
import { TransitionColourSetup } from "@/components/TransitionColourSetup";

export const metadata: Metadata = {
  title: "My Storyblok App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="en">
        <StoryblokProvider>
          <body>
            <TransitionColourSetup />
            <TransitionColourLayer />
            <PageLoadKey>{children}</PageLoadKey>
          </body>
        </StoryblokProvider>
      </html>
    </ViewTransitions>
  );
}

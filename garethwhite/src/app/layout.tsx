import type { Metadata } from "next";
import "./globals.css";
import StoryblokProvider from "@/utils/StoryblokProvider";

export const metadata: Metadata = {
  title: "My Storyblok App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <StoryblokProvider>
        <body>{children}</body>
      </StoryblokProvider>
    </html>
  );
}

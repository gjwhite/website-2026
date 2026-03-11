/**
 * Storyblok CLI config. Management API (components pull, types generate) needs auth:
 *
 * Option A – Personal access token (recommended, no login):
 * 1. In Storyblok: My account → Account settings → Personal access tokens → Create.
 * 2. Add to .env.local: STORYBLOK_PERSONAL_ACCESS_TOKEN=your_token
 *
 * Option B – Interactive: run `npm run storyblok:login` (can fail with "invalid credentials").
 */
import { config as loadEnv } from "dotenv";
import { defineConfig } from "storyblok/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  space: process.env.STORYBLOK_SPACE_ID,
  modules: {
    types: {
      generate: {
        // CLI writes to .storyblok/types/<space_id>/<filename>.d.ts (it ignores "output").
        // path: base dir (default ".storyblok"); filename: base name (default "storyblok-components").
        filename: "storyblok-components",
      },
    },
  },
});

#!/usr/bin/env node
/**
 * Copies CLI-generated Storyblok types to src/types/storyblok-component-types.d.ts
 * and adds *Storyblok aliases. Run after: npm run storyblok:types
 *
 * Usage: node scripts/copy-storyblok-types.mjs [spaceId]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const spaceId = process.argv[2] || process.env.STORYBLOK_SPACE_ID || "232624";
const generatedPath = resolve(root, ".storyblok", "types", spaceId, "storyblok-components.d.ts");
const outputPath = resolve(root, "src", "types", "storyblok-component-types.d.ts");

if (!existsSync(generatedPath)) {
  console.error(
    `Generated types not found at ${generatedPath}. Run: npm run storyblok:types`
  );
  process.exit(1);
}

let content = readFileSync(generatedPath, "utf-8");

// Fix import so it resolves from src/types/ (import from .storyblok/types/storyblok)
content = content.replace(
  /from ['"]\.\.\/storyblok\.d\.ts['"]/,
  "from '../../.storyblok/types/storyblok'"
);

// Find exported component/types: "export interface X " or "export type X "
const componentNames = [];
const interfaceMatches = content.matchAll(/export interface (\w+)\s/g);
const typeMatches = content.matchAll(/export type (\w+)\s/g);
for (const m of interfaceMatches) componentNames.push(m[1]);
for (const m of typeMatches) {
  if (m[1] !== "ContentType") componentNames.push(m[1]);
}

// Build alias exports for *Storyblok (component bloks only; skip ContentType which is a union)
const blokAliases = componentNames
  .filter((n) => n !== "ContentType")
  .map((n) => `export type ${n}Storyblok = ${n};`)
  .join("\n");

const footer = `
// Aliases for use in component props (import from "@/types/storyblok-component-types")
${blokAliases}
`;

writeFileSync(outputPath, content.trimEnd() + footer, "utf-8");
console.log(`Wrote ${outputPath}`);
console.log(`  Types: ${componentNames.join(", ")} (+ *Storyblok aliases)`);

#!/usr/bin/env npx tsx
/**
 * Version bump script
 * Usage: npx tsx scripts/bump-version.ts [major|minor|patch]
 * Default: patch
 *
 * Updates VERSION file and package.json version field.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const versionFile = join(root, "VERSION");
const pkgFile = join(root, "package.json");

const current = readFileSync(versionFile, "utf-8").trim();
const parts = current.split(".").map(Number);
if (parts.length < 3 || parts.some(isNaN)) {
  console.error(
    `Invalid version in VERSION file: "${current}". Expected semver format (e.g. 1.2.3)`,
  );
  process.exit(1);
}
const [major, minor, patch] = parts;

const bump = (process.argv[2] || "patch") as "major" | "minor" | "patch";

let next: string;
switch (bump) {
  case "major":
    next = `${major + 1}.0.0`;
    break;
  case "minor":
    next = `${major}.${minor + 1}.0`;
    break;
  case "patch":
  default:
    next = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update VERSION file
writeFileSync(versionFile, next + "\n");

// Update package.json
const pkg = JSON.parse(readFileSync(pkgFile, "utf-8"));
pkg.version = next;
writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");

console.log(`${current} → ${next}`);

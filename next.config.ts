import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const version = readFileSync(join(process.cwd(), "VERSION"), "utf-8").trim();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;

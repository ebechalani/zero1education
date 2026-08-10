import type { NextConfig } from "next";

/**
 * GitHub Pages serves plain files with no Node process, so that build is a
 * static export served from /<repo>. Set GITHUB_PAGES=true to opt in — the CI
 * workflow does. Local dev and any server deployment (Vercel) are unaffected,
 * which keeps server rendering available where it exists.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = "zero1education";

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: `/${repo}`,
      assetPrefix: `/${repo}/`,
      // Directory-style URLs so /about resolves to /about/index.html
      trailingSlash: true,
      // No image optimizer exists on a static host
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;

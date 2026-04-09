import { execSync } from "node:child_process";

const GITHUB_PAGES_REPO = "clubsphere4";

const getGitHubPagesBasePath = () => {
  if (process.env.STATIC_EXPORT !== "true") return "";

  const repoFromEnv =
    process.env.GITHUB_REPOSITORY?.split("/")[1] ||
    process.env.GITHUB_PAGES_REPO ||
    GITHUB_PAGES_REPO ||
    "";

  if (repoFromEnv) return `/${repoFromEnv.replace(/\.git$/, "")}`;

  try {
    const remote = execSync("git config --get remote.origin.url", {
      encoding: "utf8"
    }).trim();
    const match = remote.match(/\/([^/]+?)(?:\.git)?$/);
    return match ? `/${match[1]}` : "";
  } catch {
    return "";
  }
};

const basePath = getGitHubPagesBasePath();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export" } : {}),
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;

import type { NextConfig } from "next";

// NOTE: no `output: "standalone"` here — the Cloudflare Workers build uses the
// OpenNext adapter (`npm run build:worker`), which produces its own bundle in
// .open-next/. The standalone output is for Docker/Node hosting and conflicts
// with the adapter build.
const nextConfig: NextConfig = {};

export default nextConfig;

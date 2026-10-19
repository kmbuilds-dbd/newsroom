import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext adapter config for Cloudflare Workers. Defaults are fine for this
// app (no R2/D1/queue bindings; Supabase + DeepSeek are plain fetch calls).
// See https://opennext.js.org/cloudflare for caching and other overrides.
export default defineCloudflareConfig();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Agent/lib modules use ethers (server-only). Keep them out of client bundles.
  serverExternalPackages: ["ethers", "openai", "@supabase/supabase-js"],
};

module.exports = nextConfig;

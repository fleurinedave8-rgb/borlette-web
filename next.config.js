/** @type {import('next').NextConfig} */ // build 1773852745
const nextConfig = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async rewrites() { return []; },
}
module.exports = nextConfig;

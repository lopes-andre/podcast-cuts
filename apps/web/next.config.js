/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@podcast-highlighter/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;


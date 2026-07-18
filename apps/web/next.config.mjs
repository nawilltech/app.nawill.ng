/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output — a self-contained dist/ with only the deps actually used,
  // so the Docker runtime image doesn't need the full node_modules tree copied in.
  output: 'standalone',
};

export default nextConfig;

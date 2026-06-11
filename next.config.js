/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['source.unsplash.com', 'images.unsplash.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig

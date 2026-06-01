const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['jsx', 'js', 'tsx', 'ts'],
  // Tell Next.js its own directory is the root, not the monorepo root
  outputFileTracingRoot: path.join(__dirname),
}

module.exports = nextConfig

import { resolve } from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: resolve(import.meta.dirname, '../..'),
  },
}

export default nextConfig

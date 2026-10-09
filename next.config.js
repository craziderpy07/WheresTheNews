const cesiumPath = `/cesium/${require('cesium/package.json').version}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.67.83.140'],
  env: { NEXT_PUBLIC_CESIUM_BASE_URL: `${cesiumPath}/` },
  async rewrites() {
    return [{ source: `${cesiumPath}/:path*`, destination: '/cesium/:path*' }];
  },
  async headers() {
    return [{ source: `${cesiumPath}/:path*`, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  }
};

module.exports = nextConfig;

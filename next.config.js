/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side loading of native Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'aws4': false,
        'snappy': false,
        'supports-color': false,
        'timers/promises': false,
        'net': false,
        'tls': false,
        'fs': false,
        'dns': false,
        'stream': false,
        'crypto': false,
        'http': false,
        'https': false,
        'os': false,
        'path': false,
        'zlib': false,
        'child_process': false,
        'perf_hooks': false,
        'worker_threads': false,
        'process': false,
        'util': false,
        'buffer': false,
        'url': false,
        'assert': false,
        'events': false,
      };

      // Exclude native modules and addons from client bundle
      config.module = {
        ...config.module,
        exprContextCritical: false,
        rules: [
          ...config.module.rules,
          {
            test: /\.node$/,
            loader: 'ignore-loader',
          }
        ]
      };

      // Ignore native addons
      config.externals = [
        ...config.externals || [],
        function ({ context, request }, callback) {
          if (/\.node$/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        }
      ];
    }

    // Add custom resolvers for Node.js modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'util/types': require.resolve('util/types'),
      'util': require.resolve('util/'),
      'buffer': require.resolve('buffer/'),
      'stream': require.resolve('stream-browserify'),
      'zlib': require.resolve('browserify-zlib'),
      'events': require.resolve('events/'),
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      }
    ],
    domains: ['res.cloudinary.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'lib', 'src']
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/store',
      },
    ];
  },
  // Add logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
    mcp: {
      level: 'error', // Only show error logs for MCP
    },
  },
}

module.exports = nextConfig
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  outputFileTracingIncludes: {
    '/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/@react-pdf/renderer/node_modules/pdfkit/js/standard-fonts/**/*'],
    '/api/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/@react-pdf/renderer/node_modules/pdfkit/js/standard-fonts/**/*'],
    '/recibos/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/@react-pdf/renderer/node_modules/pdfkit/js/standard-fonts/**/*'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  webpack(config) {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;

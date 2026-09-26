/** @type {import('next').NextConfig} */
// Cesium needs its static assets (Workers/, Widgets/ CSS, etc.) copied into
// the public folder and a CESIUM_BASE_URL global defined. This is the
// standard community pattern for Next.js + Cesium - verify with
// `npm run build` locally (this sandbox has no network to install/test it).
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";

const cesiumSource = "node_modules/cesium/Build/Cesium";

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            { from: path.join(cesiumSource, "Workers"), to: "../public/cesium/Workers" },
            { from: path.join(cesiumSource, "Assets"), to: "../public/cesium/Assets" },
            { from: path.join(cesiumSource, "Widgets"), to: "../public/cesium/Widgets" },
          ],
        })
      );
      config.plugins.push(
        new webpack.DefinePlugin({ CESIUM_BASE_URL: JSON.stringify("/cesium") })
      );
    }
    return config;
  },
};

export default nextConfig;

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude the Next.js web project — Metro doesn't need to watch it
config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.startsWith(path.join(__dirname, "web"))
);
config.resolver.blockList = [
  ...(config.resolver.blockList ? [config.resolver.blockList].flat() : []),
  new RegExp(`^${path.join(__dirname, "web").replace(/\\/g, "\\\\")}.*`),
];

module.exports = withNativeWind(config, { input: "./global.css" });

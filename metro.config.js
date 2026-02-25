const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Support .wasm files for expo-sqlite on web
config.resolver.assetExts = [...(config.resolver.assetExts || []), "wasm"];

module.exports = config;

// Default Metro config can't see @personaliai/react-native — it's a `file:..`
// dependency (symlinked into example/node_modules by npm) pointing outside
// this project directory, and Metro doesn't watch/resolve outside its root
// without being told to. This is the standard Expo monorepo fix: watch the
// SDK repo root too, and let module resolution fall back to its node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;

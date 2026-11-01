const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// fixtures/julien.snapshot.json est gitignoré (données personnelles, ADR-004).
// Sans le fichier, on le remplace par un snapshot vide pour que le bundling
// fonctionne sur un clone frais (le dépôt fixture sert alors zéro activité).
const SNAPSHOT = path.join(__dirname, 'fixtures', 'julien.snapshot.json');
const SNAPSHOT_STUB = path.join(
  __dirname,
  'src',
  'data',
  'adapters',
  'fixture',
  'emptySnapshot.json',
);
const snapshotAvailable = fs.existsSync(SNAPSHOT);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (!snapshotAvailable && moduleName.endsWith('julien.snapshot.json')) {
    return { type: 'sourceFile', filePath: SNAPSHOT_STUB };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });

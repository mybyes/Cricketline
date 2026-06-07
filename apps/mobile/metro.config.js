const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { resolve } = require('metro-resolver')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)

const pagerShim = path.resolve(projectRoot, 'src/shims/pager-view.web.tsx')
const devToolsShim = path.resolve(projectRoot, 'src/shims/ReactDevToolsSettingsManager.web.js')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-pager-view') {
      return { type: 'sourceFile', filePath: pagerShim }
    }

    const normalized = moduleName.replace(/\\/g, '/')
    if (normalized.includes('ReactDevToolsSettingsManager')) {
      return { type: 'sourceFile', filePath: devToolsShim }
    }
  }

  return resolve(context, moduleName, platform)
}

module.exports = config

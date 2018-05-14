module.exports = {
  globals: {
    'ts-jest': {
      tsConfigFile: 'tsconfig.json'
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
  },
  testMatch: [
    '**/test/**/*.spec.(ts|js)'
  ],
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: 'jest-extended'
};
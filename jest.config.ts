/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  roots: ["<rootDir>/src"],
  testEnvironment: 'node',

  testMatch: [
    "**/__tests__/**/*.+(ts|js)",
    "**/?(*.)+(test).+(ts|js)"
  ],

  transform: {
    "^.+\\.(ts)$": "ts-jest"
  },

  verbose: true,

  globals: {
    "ts-jest": {
      diagnostics: false
    }
  },

  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],

  moduleNameMapper: {
    "^nodemailer$": "<rootDir>/src/tests/__mocks__/nodemailer.ts"
  },

  collectCoverage: false,

  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts",             // ignore type definitions
    "!src/**/__tests__/**",       // ignore test files
    "!src/**/test/**",            // ignore test helpers
    "!src/**/mocks/**",           // ignore mock files
    "!src/configs/**",            // ignore configs (env/email/server/etc.)
    "!src/index.ts",              // ignore app entrypoint
  ],

  coverageDirectory: "coverage",

  coverageReporters:[
    'text',           // Shows coverage in console
    'text-summary',   // Shows summary in console
    'html',           // Generates HTML report
    'lcov',           // For PR comments and Codecov
    'json-summary',   // For programmatic access
    'json',           // Full coverage data
    'cobertura',      // For some CI tools
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'jest-junit.xml' }]
  ]
};

/** @type {import('jest').Config} */
module.exports = {
  roots: ["<rootDir>/src"],

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

  coverageReporters: ["text", "lcov", "html"],
};

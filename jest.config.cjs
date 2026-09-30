module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  collectCoverageFrom: ['src/**/*.ts', 'frontend/**/*.ts', '!src/index.ts'],
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: { global: { statements: 91, branches: 91, functions: 91, lines: 91 } },
  clearMocks: true
};

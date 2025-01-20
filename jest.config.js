module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js'],  // Updated path
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
};
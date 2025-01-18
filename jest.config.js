// jest.config.js
module.exports = {
    // Specify that we're using TypeScript
    preset: 'ts-jest',
    
    // Set test environment
    testEnvironment: 'node',
    
    // Look for test files in __tests__ directories
    testMatch: ['**/__tests__/**/*.test.ts'],
    
    // Handle path aliases (matching your tsconfig.json)
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    
    // Transform TypeScript files
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    
    // Specify coverage collection
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/__tests__/**',
    ],
    coverageDirectory: 'coverage',
    
    // Setup files & environment variables
    setupFiles: [],
    
    // Ignore paths
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Verbose output
    verbose: true,
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Allow for module mocking
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  };
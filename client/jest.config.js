// client/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // Optional: for global test setup
  transform: {
    '^.+\.(js|jsx)$': 'babel-jest',
    '^.+\.svg$': '<rootDir>/svgTransform.js', // To handle SVG imports
  },
  moduleNameMapper: {
    '\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\.(gif|ttf|eot|svg|png)$': '<rootDir>/fileTransform.js', // Mock file imports
  },
};

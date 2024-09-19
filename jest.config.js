module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
};

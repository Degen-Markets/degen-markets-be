module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // this is what fixed it
  moduleNameMapper: {
    "file-type": "<rootDir>/__mocks__/file-type.ts",
    "is-svg": "<rootDir>/__mocks__/is-svg.ts",
  },
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
};

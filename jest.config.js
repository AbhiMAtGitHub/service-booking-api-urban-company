module.exports = {
  testEnvironment: "node",
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/config/*.js", // ignore config constants/db
    "!src/tests/**", // ignore tests
    "!src/app.js", // entrypoint
    "!src/server.js", // entrypoint
  ],
  coverageReporters: ["text", "lcov", "json", "html"],
  coverageDirectory: "coverage",
  testTimeout: 20000, // allow enough time for DB ops
  setupFiles: ["<rootDir>/src/tests/setupEnv.js"],
};

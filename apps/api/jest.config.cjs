/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    // Resolve the shared workspace package to its TS source so ts-jest compiles
    // it to CJS. The package's exports now point Node at built ESM (dist), which
    // Jest's CommonJS require() can't load — this mapper keeps tests on source.
    "^@feedbackhub/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    // Our source uses explicit .js import specifiers (ESM style). In the CJS
    // test build, strip the extension so ./x.js resolves to the ./x.ts source.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Compile tests + imported source to CommonJS for the test run only,
        // avoiding Jest's experimental ESM VM. Source stays ESM in production.
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
  testMatch: ["**/test/**/*.test.ts"],
  // Tests hit the live Neon DB, so allow generous per-test time.
  testTimeout: 30000,
  // Run suites serially: they share one external Postgres (Neon), and parallel
  // workers compete for connections on the direct endpoint and flake on cold start.
  maxWorkers: 1,
};

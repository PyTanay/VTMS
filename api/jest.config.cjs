module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^../src/(.*)$": "<rootDir>/src/$1",
  },
};

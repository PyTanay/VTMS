module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2023",
          module: "commonjs",
          lib: ["ES2023"],
          types: ["jest"],
          esModuleInterop: true,
          skipLibCheck: true,
          moduleResolution: "node",
          allowImportingTsExtensions: false,
          verbatimModuleSyntax: false,
          moduleDetection: "force",
          noEmit: true,
          jsx: "react-jsx",
          strict: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
};

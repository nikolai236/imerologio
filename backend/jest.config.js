const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  maxWorkers: 1,
  transform: {
    ...tsJestTransformCfg,
  },
  setupFiles: ["./tests/jest.setup.ts"]
};
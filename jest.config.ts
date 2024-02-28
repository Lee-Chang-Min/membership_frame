import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  //preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/test/**/*.test.(ts|js)"],
  testEnvironment: "node",
  verbose: true,
};

export default config;

import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  collectCoverage: true,
  moduleFileExtensions: ["ts", "js"],
  testRegex: ".test.ts$",
  restoreMocks: true,
};

export default config;

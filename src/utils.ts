import fs from "fs";

import { TestStatus } from "./interfaces";

export function loadJSON(file: string) {
  const data = fs.readFileSync(file, { encoding: "utf8" });
  return JSON.parse(data);
}

export const Status = {
  Passed: {
    value: TestStatus.Passed,
    text: "PASSED",
    color: "yellow",
  },
  Blocked: {
    value: TestStatus.Blocked,
    text: "SKIPPED",
    color: "green",
  },
  Failed: {
    value: TestStatus.Failed,
    text: "FAILED",
    color: "red",
  },
};

export const separator = "------------------------------";

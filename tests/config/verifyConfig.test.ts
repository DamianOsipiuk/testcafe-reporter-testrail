import { verifyConfig } from "../../src/config";
import type { Config } from "../../src/types";

jest.spyOn(global.console, "log").mockImplementation();

const minimalConfig = {
  enabled: true,
  host: "h",
  user: "u",
  apiKey: "a",
  projectId: 1,
  suiteId: 2,
};

const verifyCases: [string, Partial<Config>, boolean][] = [
  ["valid config", minimalConfig, true],
  [
    "when disabled",
    {
      enabled: false,
    },
    false,
  ],
  [
    "when without host",
    {
      ...minimalConfig,
      host: undefined,
    },
    false,
  ],
  [
    "when without user",
    {
      ...minimalConfig,
      user: undefined,
    },
    false,
  ],
  [
    "when without apiKey",
    {
      ...minimalConfig,
      apiKey: undefined,
    },
    false,
  ],
  [
    "when without projectId",
    {
      ...minimalConfig,
      projectId: undefined,
    },
    false,
  ],
  [
    "when without suiteId",
    {
      ...minimalConfig,
      suiteId: undefined,
    },
    false,
  ],
];

describe("verifyConfig", () => {
  test.each(verifyCases)(
    "should properly verify with %s",
    (_name, config, expected) => {
      expect(verifyConfig(config as Config)).toBe(expected);
    }
  );
});
